// ------------------------------------------------------------------
//  wagmi / RainbowKit shared config
// ------------------------------------------------------------------

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { http }             from 'wagmi'
import { sepolia, mainnet } from 'wagmi/chains'

/* тестнеты включены, если VITE_ENABLE_TESTNETS !== 'false' */
const ENABLE_TESTNETS =
  import.meta.env.VITE_ENABLE_TESTNETS !== 'false'

export const CHAINS = ENABLE_TESTNETS
  ? ([sepolia, mainnet] as const)      // Sepolia первой
  : ([mainnet] as const)

/* WalletConnect project id ("" ⇒ QR off) */
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

/* кастомные RPC из .env или fallback-public */
const SEPOLIA_RPC =
  import.meta.env.VITE_SEPOLIA_RPC        // ← ваш Infura / Alchemy key
  ?? 'https://ethereum-sepolia.publicnode.com'   // public, без ключа

const MAINNET_RPC =
  import.meta.env.VITE_MAINNET_RPC
  ?? 'https://rpc.ankr.com/eth'

/* экспортируем wagmiConfig */
export const wagmiConfig = getDefaultConfig({
  appName: 'HashJing',
  projectId,
  chains: CHAINS,
  transports: {
    [mainnet.id]: http(MAINNET_RPC),
    [sepolia.id]: http(SEPOLIA_RPC),
  },
})
