// src/logic.ts
// ------------------------------------------------------------------
// Chain-agnostic helpers + reads / writes for HashJing NFT contract
// ------------------------------------------------------------------

import { wagmiConfig }             from './wagmi'
import { CONTRACTS, CONTRACT_ABI } from './constants'
import {
  getWalletClient,
  getPublicClient,
  writeContract,
} from 'wagmi/actions'
import type { PublicClient } from 'viem'

// ------------------------------------------------------------------
// Narrow chain-id to the only two networks we support.
type SupportedChain = 1 | 11155111                         // 1 = mainnet, 11155111 = Sepolia
const SEP: SupportedChain = 11155111

/** Current chain-id: prefer wallet → fallback to Sepolia. */
const currentChainId = async (): Promise<SupportedChain> =>
  (await getWalletClient(wagmiConfig).catch(() => undefined))?.chain.id as SupportedChain ?? SEP

/** Generic read helper (wallet provider, if connected). */
const read = async <R = unknown>(
  fn : string,
  args: readonly unknown[] = [],
): Promise<R> => {
  const chainId = await currentChainId()
  const client: PublicClient = getPublicClient(wagmiConfig, { chainId })
  return client.readContract({
    address:   CONTRACTS[chainId],
    abi:       CONTRACT_ABI,
    functionName: fn,
    args,
  }) as unknown as R
}

/** Public-RPC read helper (works before wallet connect). */
const readPublic = async <R = unknown>(
  fn : string,
  args: readonly unknown[] = [],
): Promise<R> => {
  const client = getPublicClient(wagmiConfig, { chainId: SEP })
  return client.readContract({
    address:   CONTRACTS[SEP],
    abi:       CONTRACT_ABI,
    functionName: fn,
    args,
  }) as unknown as R
}

// ------------------------------------------------------------------
// Reads
// ------------------------------------------------------------------

export const getMintingStatus = async (): Promise<boolean> => {
  // Log **every** call so it is visible in the browser console / terminal
  console.log('[logic] mintingEnabled() → requesting status')

  try {
  const enabled = await readPublic<boolean>('mintingEnabled')
  console.log(`[logic] mintingEnabled() → ${enabled}`)
  return enabled
  } catch (err) {
  console.warn(
    `[logic] mintingEnabled() failed (${(err as Error).message}); falling back to TRUE`,
    )
  return true
  }

  try   { return await readPublic<boolean>('mintingEnabled') }
  catch  {
    console.warn('mintingEnabled() failed – fallback to TRUE')
    return true
  }
}

export const getTotalMinted = async (): Promise<number> => {
  const total = await readPublic<bigint>('totalSupply')
  return Number(total)
}

export const getTokenURI = async (id: number) => {
  const uri = await read<string>('tokenURI', [id])
  return JSON.parse(atob(uri.split(',')[1]))
}

// ------------------------------------------------------------------
// Write (mint)
// ------------------------------------------------------------------

export const sendMintTx = async () => {
  const wc = await getWalletClient(wagmiConfig)
  if (!wc) throw new Error('Wallet not found')

  const hash = await writeContract(wagmiConfig, {
    account:   wc.account,
    chainId:   wc.chain.id as SupportedChain,
    address:   CONTRACTS[wc.chain.id as SupportedChain],
    abi:       CONTRACT_ABI,
    functionName: 'mint',
    args:      [],                              // empty array is mandatory
    value:     BigInt(2_000_000_000_000_000),   // 0.002 ETH
  })

  return { hash, chainId: wc.chain.id as SupportedChain }
}
