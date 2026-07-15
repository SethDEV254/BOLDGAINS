export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';

const BSC_RPC_FALLBACKS = [
  'https://bsc-dataseed1.binance.org/',
  'https://bsc-dataseed2.binance.org/',
  'https://bsc-dataseed3.binance.org/',
  'https://bsc-dataseed1.defibit.io/',
  'https://bsc-dataseed1.ninicoin.io/',
];

export const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-dataseed.binance.org/';
export const BSC_RPC_LIST = process.env.BSC_RPC_URL
  ? [process.env.BSC_RPC_URL, ...BSC_RPC_FALLBACKS]
  : ['https://bsc-dataseed.binance.org/', ...BSC_RPC_FALLBACKS];

export const CONTRACT_ABI = [
  // User actions (payable — send BNB as msg.value; blocked when paused)
  'function payRegistrationFee(string calldata userId, address referrer) external payable',
  'function op2(string calldata userId, uint8 packageLevel) external payable', // payUpgradeFee
  'function op3(string calldata userId) external payable', // deposit
  // Owner-only config
  'function op4() external', // pause
  'function op5() external', // unpause
  'function op6(address _operator) external', // setOperator
  'function op9() external', // collectFees
  'function productAcquisition() external', // emergencyWithdraw
  // Operator or owner payout actions
  'function op7(address[] calldata recipients, uint256[] calldata amounts, string calldata txRef) external', // batchPayout
  'function productAcquisition(address to, uint256 netAmount, string calldata ref) external', // processWithdrawal
  // Views
  'function contractBalance() view returns (uint256)',
  'function availableBalance() view returns (uint256)',
  'function dailyCapRemaining() view returns (uint256)',
  'function accumulatedFees() view returns (uint256)',
  'function paused() view returns (bool)',
  'function owner() view returns (address)',
  'function operator() view returns (address)',
  // Events
  'event RegistrationFeePaid(address indexed from, string userId, address indexed referrer, uint256 gross, uint256 referrerAmount, uint256 contractAmount)',
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
