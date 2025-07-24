// src/constants.ts
import abi from './HashJingNFT.json'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id */
export const CONTRACTS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: set mainnet address
  [sepolia.id]: '0xDBAd714E12a326b9574D88bbE6C3A4Beded731C9' //'0x728DF6cDC575D3C6e37a039cd82DEAd74384F455' 
} as const

export const CONTRACT_ABI = abi.abi
export const MINT_START_TIME = new Date('2025-07-19T13:50:00Z')
export const TOTAL_SUPPLY_CAP = 8192