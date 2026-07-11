import { getUserById, addEarning, recordEarning } from './db';

export interface PayoutItem {
  userId: number;
  amount: number;
  type: string;
  description: string;
  sourceUserId: number;
}

export async function distributePayouts(items: PayoutItem[]): Promise<void> {
  if (items.length === 0) return;

  const privateKey   = process.env.OPERATOR_PRIVATE_KEY;
  const contractAddr = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;

  const cryptoItems: { address: string; amountWei: bigint; item: PayoutItem }[] = [];
  const platformItems: PayoutItem[] = [];

  if (privateKey && contractAddr) {
    const { parseUnits } = await import('ethers');
    for (const item of items) {
      const user = await getUserById(item.userId);
      if (user?.bsc_address) {
        cryptoItems.push({
          address: user.bsc_address,
          amountWei: parseUnits(item.amount.toFixed(6), 18),
          item,
        });
      } else {
        platformItems.push(item);
      }
    }
  } else {
    platformItems.push(...items);
  }

  if (cryptoItems.length > 0) {
    try {
      const { JsonRpcProvider, Wallet, Contract } = await import('ethers');
      const { BSC_RPC, CONTRACT_ABI } = await import('./contract');

      const provider = new JsonRpcProvider(BSC_RPC);
      const signer   = new Wallet(privateKey!, provider);
      const contract = new Contract(contractAddr!, CONTRACT_ABI, signer);

      const recipients = cryptoItems.map(c => c.address);
      const amounts    = cryptoItems.map(c => c.amountWei);
      const ref        = `auto-${Date.now()}`;

      const tx = await contract.op7(recipients, amounts, ref);
      await tx.wait();

      for (const { item } of cryptoItems) {
        await recordEarning(item.userId, item.type, item.amount, item.sourceUserId, item.description);
      }
    } catch (err) {
      console.error('[payout] batchPayout failed — falling back to platform credit:', err);
      for (const { item } of cryptoItems) {
        await addEarning(item.userId, item.type, item.amount, item.sourceUserId, item.description);
      }
    }
  }

  for (const item of platformItems) {
    await addEarning(item.userId, item.type, item.amount, item.sourceUserId, item.description);
  }
}
