// src/constants.ts
import artifact from './HashCanonNFT.json'
import type { Abi } from 'viem'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id (typed & readonly) */
export const CONTRACTS = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000',
  [sepolia.id]: '0x680eabF14Ae8375c3eE06a7D2AD847E9475F8aFf',
} as const satisfies Record<number, `0x${string}`>

/* ABI must be an array – export explicitly and type-check it */
export const CONTRACT_ABI: Abi = (artifact as { abi: Abi }).abi

export const MINT_START_TIME = new Date('2025-08-25T11:57:00Z')
export const TOTAL_SUPPLY_CAP = 8192
