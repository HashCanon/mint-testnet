// src/wagmi.ts
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http } from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

const ENABLE_TESTNETS = import.meta.env.VITE_ENABLE_TESTNETS !== 'false'
const IS_DEV = import.meta.env.DEV

// — RPC ——————————————————————————————————————————————
const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC ?? 'https://ethereum-sepolia.publicnode.com'
const MAINNET_RPC  = import.meta.env.VITE_MAINNET_RPC  ?? 'https://rpc.ankr.com/eth'

// — Chains ————————————————————————————————————————————
export const CHAINS = ENABLE_TESTNETS ? ([sepolia] as const) : ([mainnet] as const)

// — WalletConnect project id ——————————————————————————
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

// — App metadata (dynamic for dev/prod) —————————————————
// In dev we must use the actual page origin to avoid WC warning.
const PROD_ORIGIN = 'https://hashcanon.github.io'
const BASE_PATH   = ENABLE_TESTNETS ? '/mint-testnet/' : '/mint/'

// Use current origin in dev; use GH Pages origin in prod.
const APP_ORIGIN = IS_DEV && typeof window !== 'undefined'
  ? window.location.origin
  : PROD_ORIGIN

const APP_URL  = IS_DEV
  // WalletConnect compares against page URL (origin). Keep it simple in dev.
  ? APP_ORIGIN
  // In prod we can point to the full public path.
  : `${APP_ORIGIN}${BASE_PATH}`

// Build icon URL against the same origin/base so wallets can fetch it.
const APP_ICON = IS_DEV && typeof window !== 'undefined'
  ? `${APP_ORIGIN}${BASE_PATH}web-app-manifest-192x192.png`
  : `${PROD_ORIGIN}${BASE_PATH}web-app-manifest-192x192.png`

const APP_NAME = ENABLE_TESTNETS ? 'HashCanon Testnet Mint App' : 'HashCanon Mint App'

// — wagmi / RainbowKit config ——————————————————————————
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
