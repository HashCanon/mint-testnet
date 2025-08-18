// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

import '@rainbow-me/rainbowkit/styles.css'
import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { WagmiProvider } from 'wagmi'
import { wagmiConfig, CHAINS } from './wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const queryClient = new QueryClient()

// Use StrictMode only in production
const RootWrapper = import.meta.env.DEV
  ? ({ children }: { children: React.ReactNode }) => <>{children}</>
  : React.StrictMode

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RootWrapper>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider initialChain={CHAINS[0]} modalSize="compact">
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </RootWrapper>,
)
