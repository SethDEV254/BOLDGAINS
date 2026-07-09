'use client';

import { useAppKit } from '@reown/appkit/react';
import { useAccount, useDisconnect, useBalance, useWalletClient, useSwitchChain } from 'wagmi';
import { BrowserProvider, JsonRpcSigner, Contract, parseEther, formatUnits } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '@/lib/contract';

const BSC_CHAIN_ID = 56;

async function getEthersSigner(walletClient: any): Promise<JsonRpcSigner> {
  const { account, chain, transport } = walletClient;
  const provider = new BrowserProvider(transport, { chainId: chain.id, name: chain.name });
  return new JsonRpcSigner(provider, account.address);
}

export function useWallet() {
  const { open } = useAppKit();
  const { address, isConnected, isConnecting, chain } = useAccount();
  const { disconnect } = useDisconnect();
  const { data: balance } = useBalance({ address, chainId: BSC_CHAIN_ID });
  const { data: walletClient } = useWalletClient({ chainId: BSC_CHAIN_ID });
  const { switchChainAsync } = useSwitchChain();

  const bnbBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000';

  const isWrongChain = isConnected && !!chain && chain.id !== BSC_CHAIN_ID;

  function openWallet() {
    open();
  }

  async function ensureBSC() {
    if (!chain || chain.id !== BSC_CHAIN_ID) {
      await switchChainAsync({ chainId: BSC_CHAIN_ID });
      await new Promise(r => setTimeout(r, 800));
    }
  }

  async function getSigner(): Promise<JsonRpcSigner> {
    if (!walletClient) throw new Error('Wallet not connected');
    return getEthersSigner(walletClient);
  }

  async function payRegistrationFee(amountBnb: number, userId: string): Promise<string> {
    await ensureBSC();
    const signer = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.payRegistrationFee(userId, { value: parseEther(amountBnb.toFixed(8)) });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async function payUpgradeFee(amountBnb: number, userId: string, packageLevel: number): Promise<string> {
    await ensureBSC();
    const signer = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.payUpgradeFee(userId, packageLevel, { value: parseEther(amountBnb.toFixed(8)) });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  async function deposit(amountBnb: number, userId: string): Promise<string> {
    await ensureBSC();
    const signer = await getSigner();
    const contract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.deposit(userId, { value: parseEther(amountBnb.toFixed(8)) });
    const receipt = await tx.wait();
    return receipt.hash;
  }

  return {
    open: openWallet,
    address: address ?? null,
    bnbBalance,
    isConnected,
    isWrongChain,
    isReady: isConnected && !!walletClient && !isWrongChain,
    connecting: isConnecting,
    disconnect: () => disconnect(),
    switchToBSC: () => switchChainAsync({ chainId: BSC_CHAIN_ID }),
    payRegistrationFee,
    payUpgradeFee,
    deposit,
  };
}
