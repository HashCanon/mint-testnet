// src/wagmi.ts
import { getDefaultConfig }   from '@rainbow-me/rainbowkit'
import { http }               from 'wagmi'
import { sepolia, mainnet }   from 'wagmi/chains'

const ENABLE_TESTNETS = import.meta.env.VITE_ENABLE_TESTNETS !== 'false'

// — Список сетей ————————————————————————————————————————————————
export const CHAINS = ENABLE_TESTNETS
  ? ([sepolia] as const)      // только Sepolia
  : ([mainnet] as const)      // или только Mainnet

// — RPC ——————————————————————————————————————————————
const SEPOLIA_RPC = import.meta.env.VITE_SEPOLIA_RPC
  ?? 'https://ethereum-sepolia.publicnode.com'

const MAINNET_RPC = import.meta.env.VITE_MAINNET_RPC
  ?? 'https://rpc.ankr.com/eth'

// — WalletConnect project id ——————————————————————————————
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

// — wagmi config ————————————————————————————————————————————
export const wagmiConfig = getDefaultConfig({
  appName: 'HashCanon',
  projectId,
  chains: CHAINS,
  transports: ENABLE_TESTNETS
    ? { [sepolia.id]: http(SEPOLIA_RPC) }   
    : { [mainnet.id]: http(MAINNET_RPC) },
})
