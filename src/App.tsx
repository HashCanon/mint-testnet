// src/App.tsx
import { useEffect, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { toast, Toaster } from 'sonner'

import { CONTRACTS, MINT_START_TIME, TOTAL_SUPPLY_CAP } from './constants'

import { useCountdown } from './hooks/useCountdown'
import { useMintingStatus } from './hooks/useMintingStatus'
import { useTotalMinted } from './hooks/useTotalMinted'
import { useMint } from './hooks/useMint'

import { Header } from './components/Header'
import { Countdown } from './components/Countdown'
import { WalletInfo } from './components/WalletInfo'
import { StatusPanel } from './components/StatusPanel'
import { ContactBlock } from './components/ContactBlock'
import { MintedMandalas } from './components/MintedMandalas'

/* ────────────────────────────────────────────────────────────────── */
/*  Constants & Chain Helpers                                        */
/* ────────────────────────────────────────────────────────────────── */

const getAddress = (id?: number) => (id && CONTRACTS[id]) || undefined

/* ────────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ────────────────────────────────────────────────────────────────── */

export default function App() {
  // Wallet & Network Info
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const chains = useChains()
  const chain = chains.find(c => c.id === chainId)
  const networkOk = !!getAddress(chainId)

  // UI State
  const { now } = useCountdown(MINT_START_TIME)
  const mintingEnabled = useMintingStatus()
  const { totalMinted, refresh: refreshTotal } = useTotalMinted()

  const [mintedTokens, setMintedTokens] = useState<any[]>([])
  const [waitToast, setWaitToast] = useState<string | number | null>(null)

  // Show waiting toast before mint opens
  useEffect(() => {
    const afterStart = now >= MINT_START_TIME
    if (afterStart && mintingEnabled === false && !waitToast) {
      const id = toast('⏳ Waiting for network confirmation…', { duration: Infinity })
      setWaitToast(id)
    }
    if (mintingEnabled === true && waitToast) {
      toast.dismiss(waitToast)
      setWaitToast(null)
    }
  }, [now, mintingEnabled, waitToast])


  // Mint button handler
  const { mint: handleMint, busy: mintBusy } = useMint({
    onSuccess: meta => setMintedTokens(prev => [meta, ...prev]),
    onAfterSuccess: refreshTotal,
  })

  return (
    <>
      <Header chainName={chain?.name} />
      <Countdown now={now} startTime={MINT_START_TIME} mintingEnabled={mintingEnabled} />

      <div id="mandala-section">
        <div className="section-title">Mint your unique mandala</div>
        <p className="status">Each token is fully on-chain and costs 0.002 ETH.</p>

        <WalletInfo
          isConnected={isConnected}
          address={address}
          chainName={chain?.name}
          networkOk={networkOk}
        />

        <button
          className={`wide-button green-button ${
            mintBusy || !isConnected || !networkOk ||
            mintingEnabled !== true ||
            (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
              ? 'disabled'
              : ''
          }`}
          disabled={
            mintBusy || !isConnected || !networkOk ||
            mintingEnabled !== true ||
            (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
          }
          onClick={handleMint}
        >
          {totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP
            ? 'Sold out ❌'
            : mintingEnabled === null
            ? 'Checking status…'
            : mintingEnabled === false
            ? 'Mint disabled ❌'
            : 'Mint now'}
        </button>

        <StatusPanel
          totalMinted={totalMinted}
          totalCap={TOTAL_SUPPLY_CAP}
          priceLabel="0.002 ETH + gas"
          networkOk={networkOk}
          contractUrl={
            networkOk
              ? `https://${chain?.testnet ? 'sepolia.' : ''}etherscan.io/address/${getAddress(chainId)}`
              : undefined
          }
          contractShort={getAddress(chainId)?.slice(0, 6) + '…' + getAddress(chainId)?.slice(-4)}
        />

        <MintedMandalas tokens={mintedTokens} />
      </div>
      <ContactBlock />
      <Toaster position="bottom-center" richColors />
    </>
  )
}
