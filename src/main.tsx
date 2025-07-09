//-------------------------------------------------------------------
//  Root entry for HashJing Mint UI
//-------------------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './App.css'

import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  ConnectButton,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit'

import { WagmiConfig, http } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ── chain list toggled by env flag ─────────────────────────────
const ENABLE_TESTNETS =
  import.meta.env.VITE_ENABLE_TESTNETS !== 'false' // default = true

export const CHAINS = ENABLE_TESTNETS
  ? ([mainnet, sepolia] as const)
  : ([mainnet] as const)

// ── WalletConnect project id (empty ⇒ hide QR) ─────────────────
const projectId = import.meta.env.VITE_WC_PROJECT_ID ?? ''

// ── wagmi global config ───────────────────────────────────────
export const wagmiConfig = getDefaultConfig({
  appName: 'HashJing',
  projectId,
  chains: CHAINS,
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})

// ── react-query singleton ─────────────────────────────────────
const queryClient = new QueryClient()

// ── bootstrap ────────────────────────────────────────────────
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <ConnectButton />
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
