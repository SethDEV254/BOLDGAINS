// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract BoldGainsWallet is Ownable, ReentrancyGuard, Pausable {
    uint256 public constant FEE_BPS = 1000; // 10%
    uint256 public accumulatedFees;

    event RegistrationFeePaid(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net);
    event UpgradeFeePaid(address indexed from, string userId, uint8 packageLevel, uint256 gross, uint256 fee, uint256 net);
    event Deposited(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net);
    event PayoutSent(address indexed to, uint256 amount, string ref);
    event BatchPayoutExecuted(string txRef, uint256 total, uint256 count);
    event EmergencyWithdraw(address indexed to, uint256 amount);

    constructor() Ownable(msg.sender) {}

    // ── User payable actions (blocked when paused) ───────────────────────────

    function payRegistrationFee(string calldata userId) external payable nonReentrant whenNotPaused {
        uint256 gross = msg.value;
        require(gross > 0, "Send BNB");
        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;
        emit RegistrationFeePaid(msg.sender, userId, gross, fee, gross - fee);
    }

    function payUpgradeFee(string calldata userId, uint8 packageLevel) external payable nonReentrant whenNotPaused {
        uint256 gross = msg.value;
        require(gross > 0, "Send BNB");
        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;
        emit UpgradeFeePaid(msg.sender, userId, packageLevel, gross, fee, gross - fee);
    }

    function deposit(string calldata userId) external payable nonReentrant whenNotPaused {
        uint256 gross = msg.value;
        require(gross > 0, "Send BNB");
        uint256 fee = (gross * FEE_BPS) / 10000;
        accumulatedFees += fee;
        emit Deposited(msg.sender, userId, gross, fee, gross - fee);
    }

    // ── Owner actions ────────────────────────────────────────────────────────

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function batchPayout(
        address[] calldata recipients,
        uint256[] calldata amounts,
        string calldata txRef
    ) external onlyOwner nonReentrant {
        require(recipients.length == amounts.length, "Length mismatch");
        uint256 total;
        for (uint256 i; i < amounts.length; ++i) total += amounts[i];
        require(address(this).balance - accumulatedFees >= total, "Insufficient balance");
        for (uint256 i; i < recipients.length; ++i) {
            (bool ok,) = recipients[i].call{value: amounts[i]}("");
            require(ok, "Transfer failed");
            emit PayoutSent(recipients[i], amounts[i], txRef);
        }
        emit BatchPayoutExecuted(txRef, total, recipients.length);
    }

    function processWithdrawal(address to, uint256 netAmount, string calldata ref) external onlyOwner nonReentrant {
        require(address(this).balance - accumulatedFees >= netAmount, "Insufficient balance");
        (bool ok,) = to.call{value: netAmount}("");
        require(ok, "Transfer failed");
        emit PayoutSent(to, netAmount, ref);
    }

    function collectFees() external onlyOwner nonReentrant {
        uint256 fees = accumulatedFees;
        require(fees > 0, "No fees");
        accumulatedFees = 0;
        (bool ok,) = owner().call{value: fees}("");
        require(ok, "Transfer failed");
    }

    /// @notice Withdraws entire contract balance to owner. Use in emergencies.
    function emergencyWithdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "Nothing to withdraw");
        accumulatedFees = 0;
        (bool ok,) = owner().call{value: bal}("");
        require(ok, "Transfer failed");
        emit EmergencyWithdraw(owner(), bal);
    }

    // ── Views ────────────────────────────────────────────────────────────────

    function availableBalance() external view returns (uint256) {
        return address(this).balance > accumulatedFees
            ? address(this).balance - accumulatedFees
            : 0;
    }

    function contractBalance() external view returns (uint256) { return address(this).balance; }

    receive() external payable {}
}
