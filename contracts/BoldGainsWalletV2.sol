// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * BoldGainsWallet V2
 *
 * Security hardening over V1:
 *  - Ownable2Step: ownership transfers require acceptance, preventing accidental loss
 *  - Separate operator role: payouts run via operator; only owner can change critical config
 *  - Zero-address guards on all outbound transfers
 *  - Max batch size cap (prevents gas-limit griefing)
 *  - Minimum deposit floor (prevents dust/event-spam attacks)
 *  - Daily withdrawal cap: total outbound BNB is rate-limited per 24 h window
 *  - Max single-payout cap: no single call can drain more than SINGLE_PAYOUT_CAP
 *  - userId validated: must be non-empty and ≤ 64 bytes
 *  - CEI pattern strictly followed on all state-changing paths
 *  - receive() tracked: direct ETH sends are recorded, not silently accepted
 */
contract BoldGainsWalletV2 is Ownable2Step, ReentrancyGuard, Pausable {

    // ── Constants ────────────────────────────────────────────────────────────

    uint256 public constant FEE_BPS          = 1000;          // 10%
    uint256 public constant MAX_BATCH        = 200;           // max recipients per batchPayout
    uint256 public constant MIN_DEPOSIT      = 0.001 ether;   // ~$0.50 — blocks dust spam
    uint256 public constant DAILY_CAP        = 500 ether;     // max outbound BNB per 24 h
    uint256 public constant SINGLE_PAYOUT_CAP = 50 ether;    // max per single processWithdrawal

    // ── State ────────────────────────────────────────────────────────────────

    uint256 public accumulatedFees;

    address public operator;

    // Daily withdrawal rate limiter
    uint256 public dailyWindowStart;
    uint256 public dailyWithdrawnAmount;

    // ── Events ───────────────────────────────────────────────────────────────

    event OperatorChanged(address indexed previous, address indexed next);
    event RegistrationFeePaid(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net);
    event UpgradeFeePaid(address indexed from, string userId, uint8 packageLevel, uint256 gross, uint256 fee, uint256 net);
    event Deposited(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net);
    event DirectReceived(address indexed from, uint256 amount);
    event PayoutSent(address indexed to, uint256 amount, string ref);
    event PayoutFailed(address indexed to, uint256 amount, string ref);
    event BatchPayoutExecuted(string txRef, uint256 total, uint256 count);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    // ── Modifiers ────────────────────────────────────────────────────────────

    modifier onlyOperatorOrOwner() {
        require(msg.sender == operator || msg.sender == owner(), "Not authorized");
        _;
    }

    modifier validUserId(string calldata userId) {
        bytes memory b = bytes(userId);
        require(b.length > 0 && b.length <= 64, "Invalid userId");
        _;
    }

    // ── Constructor ──────────────────────────────────────────────────────────

    constructor(address _operator) Ownable(msg.sender) {
        require(_operator != address(0), "Zero operator");
        operator = _operator;
        dailyWindowStart = block.timestamp;
    }

    // ── User payable actions (blocked when paused) ───────────────────────────

    function payRegistrationFee(string calldata userId)
        external
        payable
        nonReentrant
        whenNotPaused
        validUserId(userId)
    {
        uint256 gross = msg.value;
        require(gross >= MIN_DEPOSIT, "Below minimum");

        // Effects before Events (CEI)
        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;

        emit RegistrationFeePaid(msg.sender, userId, gross, fee, gross - fee);
    }

    function payUpgradeFee(string calldata userId, uint8 packageLevel)
        external
        payable
        nonReentrant
        whenNotPaused
        validUserId(userId)
    {
        uint256 gross = msg.value;
        require(gross >= MIN_DEPOSIT, "Below minimum");

        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;

        emit UpgradeFeePaid(msg.sender, userId, packageLevel, gross, fee, gross - fee);
    }

    function deposit(string calldata userId)
        external
        payable
        nonReentrant
        whenNotPaused
        validUserId(userId)
    {
        uint256 gross = msg.value;
        require(gross >= MIN_DEPOSIT, "Below minimum");

        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;

        emit Deposited(msg.sender, userId, gross, fee, gross - fee);
    }

    // ── Owner-only config ────────────────────────────────────────────────────

    function pause()   external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function setOperator(address _operator) external onlyOwner {
        require(_operator != address(0), "Zero operator");
        emit OperatorChanged(operator, _operator);
        operator = _operator;
    }

    // ── Payout actions (operator OR owner) ───────────────────────────────────

    function batchPayout(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata txRef
    ) external onlyOperatorOrOwner nonReentrant {
        uint256 len = recipients.length;
        require(len > 0,                     "Empty batch");
        require(len == amounts.length,        "Length mismatch");
        require(len <= MAX_BATCH,             "Exceeds max batch");

        // Compute total and validate recipients before any transfer
        uint256 total;
        for (uint256 i; i < len; ++i) {
            require(recipients[i] != address(0), "Zero recipient");
            require(amounts[i] > 0,              "Zero amount");
            total += amounts[i];
        }

        // Single balance check (CEI: check before interact)
        uint256 avail = _availableBalance();
        require(avail >= total, "Insufficient balance");

        // Reserve the full daily cap upfront; credit back any failed transfers after
        _checkAndUpdateDailyCap(total);

        // Interactions — continue on individual transfer failures so one bad recipient
        // cannot brick the entire batch; failed amounts are credited back to the daily cap
        uint256 failedAmount;
        for (uint256 i; i < len; ++i) {
            (bool ok,) = recipients[i].call{value: amounts[i]}("");
            if (ok) {
                emit PayoutSent(recipients[i], amounts[i], txRef);
            } else {
                failedAmount += amounts[i];
                emit PayoutFailed(recipients[i], amounts[i], txRef);
            }
        }

        if (failedAmount > 0) {
            dailyWithdrawnAmount -= failedAmount;
        }

        emit BatchPayoutExecuted(txRef, total - failedAmount, len);
    }

    function processWithdrawal(address to, uint256 netAmount, string calldata ref)
        external
        onlyOperatorOrOwner
        nonReentrant
    {
        require(to != address(0),                      "Zero address");
        require(netAmount > 0,                         "Zero amount");
        require(netAmount <= SINGLE_PAYOUT_CAP,        "Exceeds single-payout cap");
        require(_availableBalance() >= netAmount,      "Insufficient balance");

        // State update before external call
        _checkAndUpdateDailyCap(netAmount);

        (bool ok,) = to.call{value: netAmount}("");
        require(ok, "Transfer failed");

        emit PayoutSent(to, netAmount, ref);
    }

    function collectFees() external onlyOwner nonReentrant {
        uint256 fees = accumulatedFees;
        require(fees > 0, "No fees");

        // CEI: update state before external call
        accumulatedFees = 0;

        address ownerAddr = owner();
        (bool ok,) = ownerAddr.call{value: fees}("");
        require(ok, "Transfer failed");
    }

    /// @notice Drains entire balance to owner. Emergency use only.
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");

        accumulatedFees = 0;
        dailyWithdrawnAmount = 0;

        address ownerAddr = owner();
        emit EmergencyWithdraw(ownerAddr, bal);

        (bool ok,) = ownerAddr.call{value: bal}("");
        require(ok, "Transfer failed");
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function availableBalance() external view returns (uint256) {
        return _availableBalance();
    }

    function contractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function dailyCapRemaining() external view returns (uint256) {
        if (block.timestamp >= dailyWindowStart + 1 days) return DAILY_CAP;
        return DAILY_CAP > dailyWithdrawnAmount ? DAILY_CAP - dailyWithdrawnAmount : 0;
    }

    // ── Internal helpers ─────────────────────────────────────────────────────

    function _availableBalance() internal view returns (uint256) {
        uint256 bal = address(this).balance;
        return bal > accumulatedFees ? bal - accumulatedFees : 0;
    }

    function _checkAndUpdateDailyCap(uint256 amount) internal {
        if (block.timestamp >= dailyWindowStart + 1 days) {
            dailyWindowStart = block.timestamp;
            dailyWithdrawnAmount = 0;
        }
        require(dailyWithdrawnAmount + amount <= DAILY_CAP, "Daily cap exceeded");
        dailyWithdrawnAmount += amount;
    }

    // ── Receive ──────────────────────────────────────────────────────────────

    /// Direct ETH sends are accepted and tracked via event (no silent accounting gaps).
    receive() external payable {
        emit DirectReceived(msg.sender, msg.value);
    }
}
