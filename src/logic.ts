//-------------------------------------------------------------------
//  Chain-agnostic helpers + read / write for HashJing NFT contract
//-------------------------------------------------------------------

import { wagmiConfig }            from './wagmi'
import { CONTRACTS, CONTRACT_ABI } from './constants'
import {
  getWalletClient,
  getPublicClient,
  writeContract,
} from 'wagmi/actions'
import type { PublicClient }       from 'viem'
import { ethers }                  from 'ethers'

/* ─ helpers ───────────────────────────────────────────────────────── */

const SEP = 11155111                                   // Sepolia id

/** current chain-id: prefer wallet → fallback Sepolia */
const currentChainId = async () =>
  (await getWalletClient(wagmiConfig).catch(() => undefined))?.chain.id ?? SEP

/** read via *wallet provider* (when connected) */
const read = async <
  P extends { abi: any; functionName: string; args?: any[] }
>(params: P) => {
  const chainId = await currentChainId()
  const client: PublicClient = getPublicClient(wagmiConfig, { chainId })
  return client.readContract({ chainId, address: CONTRACTS[chainId], ...params })
}

/** read via *public RPC* (before wallet connect) */
const readPublic = async <
  P extends { abi: any; functionName: string; args?: any[] }
>(params: P) => {
  const client = getPublicClient(wagmiConfig, { chainId: SEP })
  return client.readContract({ chainId: SEP, address: CONTRACTS[SEP], ...params })
}

/* ─ reads ─────────────────────────────────────────────────────────── */

export const getMintingStatus = async () => {
  try   { return await readPublic({ abi: CONTRACT_ABI, functionName: 'mintingEnabled' }) }
  catch { console.warn('mintingEnabled() failed → TRUE'); return true }
}

export const getTotalMinted = async () => {
  const total: bigint = await readPublic({ abi: CONTRACT_ABI, functionName: 'totalSupply' })
  return Number(total)
}

export const getTokenURI = async (id: number) => {
  const uri: string = await read({ abi: CONTRACT_ABI, functionName: 'tokenURI', args: [id] })
  return JSON.parse(atob(uri.split(',')[1]))
}

/* ─ write (only send tx — mined-receipt ждём в App) ───────────────── */

export const sendMintTx = async () => {
  const wc = await getWalletClient(wagmiConfig)
  if (!wc) throw new Error('Wallet not found')

  const hash = await writeContract(wagmiConfig, {
    account:   wc.account,
    chainId:   wc.chain.id,
    address:   CONTRACTS[wc.chain.id],
    abi:       CONTRACT_ABI,
    functionName: 'mint',
    args:      [],                              // обязателен
    value:     BigInt(2_000_000_000_000_000),   // 0.002 ETH
  })

  /* возвращаем только hash + chain — mined-receipt ждём в App */
  return { hash, chainId: wc.chain.id }
}

/* (опц.) ethers helper */
export const getContract = async (withSigner = false) => {
  if (!window.ethereum) throw new Error('No wallet found')

  const provider = new ethers.BrowserProvider(window.ethereum)
  const network  = await provider.getNetwork()
  const address  = CONTRACTS[Number(network.chainId)] ?? CONTRACTS[SEP]
  const signer   = withSigner ? await provider.getSigner() : undefined

  return new ethers.Contract(address, CONTRACT_ABI, signer || provider)
}
