export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
export const BSC_RPC           = 'https://bsc-dataseed.binance.org/';

export const CONTRACT_ABI = [
  // User actions (payable — send BNB as msg.value; blocked when paused)
  'function payRegistrationFee(string calldata userId) external payable',
  'function payUpgradeFee(string calldata userId, uint8 packageLevel) external payable',
  'function deposit(string calldata userId) external payable',
  // Owner-only config
  'function pause() external',
  'function unpause() external',
  'function setOperator(address _operator) external',
  'function collectFees() external',
  'function emergencyWithdraw() external',
  // Operator or owner payout actions
  'function batchPayout(address[] calldata recipients, uint256[] calldata amounts, string calldata txRef) external',
  'function processWithdrawal(address to, uint256 netAmount, string calldata ref) external',
  // Views
  'function contractBalance() view returns (uint256)',
  'function availableBalance() view returns (uint256)',
  'function dailyCapRemaining() view returns (uint256)',
  'function accumulatedFees() view returns (uint256)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
  'function operator() view returns (address)',
  // Events
  'event RegistrationFeePaid(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net)',
  'event UpgradeFeePaid(address indexed from, string userId, uint8 packageLevel, uint256 gross, uint256 fee, uint256 net)',
  'event Deposited(address indexed from, string userId, uint256 gross, uint256 fee, uint256 net)',
  'event PayoutSent(address indexed to, uint256 amount, string ref)',
  'event PayoutFailed(address indexed to, uint256 amount, string ref)',
  'event BatchPayoutExecuted(string txRef, uint256 total, uint256 count)',
  'event EmergencyWithdraw(address indexed to, uint256 amount)',
] as const;

export const BSC_CHAIN = {
  chainId: '0x38',
  chainName: 'BNB Smart Chain',
  nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com/'],
};
