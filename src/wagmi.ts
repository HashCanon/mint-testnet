// src/wagmi.ts
// ------------------------------------------------------------------
// wagmi / RainbowKit shared configuration
// ------------------------------------------------------------------

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

/**
 * Determines whether testnets should be enabled.
 * Controlled by VITE_ENABLE_TESTNETS (default: true).
 */
const ENABLE_TESTNETS = import.meta.env.VITE_ENABLE_TESTNETS !== 'false'

/**
 * List of enabled chains. Sepolia is first to make it the default.
 */
export const CHAINS = ENABLE_TESTNETS
  ? ([sepolia, mainnet] as const)
  : ([mainnet] as const)

/**
 * WalletConnect project ID (empty string disables QR modal).
 */
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

/**
 * Custom RPC URLs from .env (fallback to public endpoints).
 */
const SEPOLIA_RPC =
  import.meta.env.VITE_SEPOLIA_RPC ??
  'https://ethereum-sepolia.publicnode.com'

const MAINNET_RPC =
  import.meta.env.VITE_MAINNET_RPC ??
  'https://rpc.ankr.com/eth'

/**
 * Export wagmiConfig for use in <WagmiConfig />
 */
export const wagmiConfig = getDefaultConfig({
  appName: 'HashJing',
  projectId,
  chains: CHAINS,
  transports: {
    [mainnet.id]: http(MAINNET_RPC),
    [sepolia.id]: http(SEPOLIA_RPC),
  },
})
