// src/constants.ts
import abi from './HashJingNFT.json'
import { mainnet, sepolia } from 'wagmi/chains'

/* contract addresses by chain id */
export const CONTRACTS: Record<number, `0x${string}`> = {
  [mainnet.id]: '0x0000000000000000000000000000000000000000', // TODO: set mainnet address
  [sepolia.id]: '0x82e502d37013A96D1c862E164a64843EeE45DE5D', // 2025-07-06
} as const

// historical Sepolia addresses (kept for reference)
// const SEP_VERIFIED   = '0xaE457632683249AB207F13b53a9eDA932E7a43c0' // verified, not active
// const SEP_2025_07_06    = '0xc90e8698569C5E4F0bE79D1e8DE06406ebf41a85'
// const SEP_07_07_A    = '0x82e502d37013A96D1c862E164a64843EeE45DE5D' // 2025-07-07
// const SEP_07_07_B    = '0xa9125c026CC83bd3CCa2A893bbbfd8DE23c829fb' // 2025-07-07

export const CONTRACT_ABI = abi.abi
