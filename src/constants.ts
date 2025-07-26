// src/constants.ts
import abi from './HashJingNFT.json'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id */
export const CONTRACTS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: set mainnet address
  //[sepolia.id]: '0x0528C769ddA28b25B458e5f205aa7F06311C9acF' // Verified 
  [sepolia.id]: '0x26EF4C8c095194C61f09d7f8F40Ee93bbb5184d5' // Verified -- Similar Match Source Code
} as const

export const CONTRACT_ABI = abi.abi
export const MINT_START_TIME = new Date('2025-07-29T13:50:00Z')
export const TOTAL_SUPPLY_CAP = 8192