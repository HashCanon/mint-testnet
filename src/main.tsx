// src/main.tsx
// ------------------------------------------------------------------
// Root entry for HashCanon Mint UI
// ------------------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import "./index.css"

/* RainbowKit / wagmi */
import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider, ConnectButton } from '@rainbow-me/rainbowkit'
import { WagmiConfig } from 'wagmi'

/* shared wagmi / chain config */
import { wagmiConfig, CHAINS } from './wagmi'

/* react-query singleton */
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

// ------------------------------------------------------------------

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiConfig config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* Sepolia = CHAINS[0] */}
        <RainbowKitProvider initialChain={CHAINS[0]}>
          <ConnectButton />
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiConfig>
  </React.StrictMode>,
)
