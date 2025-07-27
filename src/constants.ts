// src/constants.ts
import abi from './HashJingNFT.json'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id */
export const CONTRACTS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: set mainnet address
  [sepolia.id]: '0x9283a17df8079F69735CC96C704b04CFB6edb4FF'
} as const

export const CONTRACT_ABI = abi.abi
export const MINT_START_TIME = new Date('2025-07-29T13:50:00Z')
export const TOTAL_SUPPLY_CAP = 8192