// src/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

const ENABLE_TESTNETS = import.meta.env.VITE_ENABLE_TESTNETS !== 'false'
const IS_DEV = import.meta.env.DEV

// RPC endpoints
const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC ?? 'https://ethereum-sepolia.publicnode.com'
const MAINNET_RPC  = import.meta.env.VITE_MAINNET_RPC  ?? 'https://rpc.ankr.com/eth'

// Chains list
export const CHAINS = ENABLE_TESTNETS ? ([sepolia] as const) : ([mainnet] as const)

// WalletConnect project id
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

// App metadata (dynamic for dev/prod)
const PROD_ORIGIN = 'https://hashcanon.github.io'
const BASE_PATH   = ENABLE_TESTNETS ? '/mint-testnet/' : '/mint/'

// Use exact page URL in dev to silence WC warning completely
const APP_URL = IS_DEV && typeof window !== 'undefined'
  ? window.location.href
  : `${PROD_ORIGIN}${BASE_PATH}`

// Build icon URL relative to current page in dev
const APP_ICON = IS_DEV && typeof window !== 'undefined'
  ? new URL('web-app-manifest-192x192.png', window.location.href).toString()
  : `${PROD_ORIGIN}${BASE_PATH}web-app-manifest-192x192.png`

const APP_NAME = ENABLE_TESTNETS ? 'HashCanon Testnet Mint App' : 'HashCanon Mint App'

// wagmi / RainbowKit config
export const wagmiConfig = getDefaultConfig({
  appName: APP_NAME,
  appDescription: 'On-chain mint',
  appUrl: APP_URL,
  appIcon: APP_ICON,
  projectId,
  chains: CHAINS,
  transports: ENABLE_TESTNETS
    ? { [sepolia.id]: http(SEPOLIA_RPC) }
    : { [mainnet.id]: http(MAINNET_RPC) },
})
