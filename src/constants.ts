// src/constants.ts
import abi from './HashJingNFT.json'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id */
export const CONTRACTS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: set mainnet address
  [sepolia.id]: '0x1Ff1a87DE3980803B96edb4623424208218F0d71',//'0xdb45F8b19bed8e7be9F407c19a1Ce7d1623734e6',//'0x03626883eEd37a3ba619e593e2Bbe5Bd035d2f7A' 
} as const

export const CONTRACT_ABI = abi.abi
export const MINT_START_TIME = new Date('2025-08-25T11:57:00Z')
export const TOTAL_SUPPLY_CAP = 8192