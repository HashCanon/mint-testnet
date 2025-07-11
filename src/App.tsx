// src/App.tsx

import { useEffect, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { toast, Toaster } from 'sonner'

import {
  sendMintTx as mintNFT,
  getMintingStatus,
  getTotalMinted,
  getTokenURI,
} from './logic'
import { CONTRACTS } from './constants'
import { wagmiConfig } from './wagmi'
import { getPublicClient } from 'wagmi/actions'

import './App.css'

/* ────────────────────────────────────────────────────────────────── */
/*  Constants & Chain Helpers                                        */
/* ────────────────────────────────────────────────────────────────── */

const getAddress = (id?: number) => (id && CONTRACTS[id]) || undefined

const MINT_START_TIME = new Date('2025-07-07T13:12:00Z')
const TOTAL_SUPPLY_CAP = 8192

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
  const [now, setNow] = useState(new Date())
  const [mintingEnabled, setMintingEnabled] = useState<boolean | null>(null)
  const [totalMinted, setTotalMinted] = useState<number | null>(null)
  const [mintedTokens, setMintedTokens] = useState<any[]>([])
  const [waitToast, setWaitToast] = useState<string | number | null>(null)

  // Local clock: tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Initial fetch for totalSupply
  useEffect(() => {
    getTotalMinted().then(setTotalMinted).catch(() => setTotalMinted(null))
  }, [])

  // Poll mintingEnabled once per second for last minute before start
  useEffect(() => {
    let first = true
    const id = setInterval(async () => {
      const ms = MINT_START_TIME.getTime() - Date.now()
      if (first || ms <= 60000) {
        first = false
        try {
          const enabled = await getMintingStatus()
          setMintingEnabled(enabled)
          if (enabled) clearInterval(id)
        } catch {
          setMintingEnabled(true)
          clearInterval(id)
        }
      }
    }, 1000)
    return () => clearInterval(id)
  }, [])

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

  // Countdown formatter
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const ss = s % 60
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${ss.toString().padStart(2, '0')}`
  }

  // Mint button handler
  const handleMint = async () => {
    if (!isConnected) return toast.error('❌ Connect wallet first')
    if (!networkOk) return toast.error('❌ Wrong network')
    if (mintingEnabled !== true) return toast.error('❌ Mint not active')
    if (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
      return toast.error('❌ Sold-out')

    const confirmId = toast.info('🦊 Confirm the transaction in your wallet…', {
      duration: Infinity,
    })

    let progressId: string | number | null = null
    try {
      const { hash, chainId: txChain } = await mintNFT()
      toast.dismiss(confirmId)

      progressId = toast.info('⏳ Minting…', { duration: Infinity })

      const client = getPublicClient(wagmiConfig, { chainId: txChain })
      await client.waitForTransactionReceipt({ hash })

      toast.dismiss(progressId)
      toast.success('✅ Mint successful!')

      const updated = await getTotalMinted()
      setTotalMinted(updated)

      const meta = await getTokenURI(updated)
      setMintedTokens(prev => [meta, ...prev])
    } catch (err: any) {
      toast.dismiss(confirmId)
      if (progressId) toast.dismiss(progressId)
      toast.error(`❌ ${err.shortMessage ?? err.message}`)
    }
  }

  /* ────────────────────────────────────────────────────────────────── */
  /*  Render                                                           */
  /* ────────────────────────────────────────────────────────────────── */

  return (
    <>
      <div id="title">
        <div>HashJing Mint</div>
        <div className="net-label">{chain?.name ?? 'No network'}</div>
      </div>

      {now < MINT_START_TIME && mintingEnabled !== true && (
        <div className="status">
          <p>Mint starts at {MINT_START_TIME.toUTCString().slice(5, 22)} UTC</p>
          <p>
            Available in <strong>{fmt(MINT_START_TIME.getTime() - now.getTime())}</strong>
          </p>
        </div>
      )}

      <main id="mandala-section">
        <div className="section-title">Mint your unique mandala</div>
        <p className="status">Each token is fully on-chain and costs 0.002 ETH.</p>

        {isConnected && address ? (
          <p className="status">
            Wallet: {address.slice(0, 6)}…{address.slice(-4)} (
            {networkOk ? `${chain?.name} ✅` : 'Wrong network ❌'})
          </p>
        ) : (
          <p className="status">Please connect wallet ↑</p>
        )}

        <button
          className={`wide-button green-button ${
            !isConnected ||
            !networkOk ||
            mintingEnabled !== true ||
            (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
              ? 'disabled'
              : ''
          }`}
          disabled={
            !isConnected ||
            !networkOk ||
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

        <div className="status">
          <p>
            Status:{' '}
            {totalMinted !== null
              ? `${totalMinted} / ${TOTAL_SUPPLY_CAP} minted`
              : `__ / ${TOTAL_SUPPLY_CAP} minted`}
          </p>
          <p>Price: 0.002 ETH + gas</p>
          {networkOk && (
            <p>
              Contract:{' '}
              <a
                href={`https://${chain?.testnet ? 'sepolia.' : ''}etherscan.io/address/${getAddress(chainId)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {getAddress(chainId)?.slice(0, 6)}…{getAddress(chainId)?.slice(-4)}
              </a>
            </p>
          )}
        </div>

        {mintedTokens.length > 0 && (
          <div id="preview-section">
            <h2 className="section-title">Your Minted Mandalas</h2>
            {mintedTokens.map((t, i) => (
              <div key={i} className="preview-container">
                <div
                  className="svg-preview"
                  dangerouslySetInnerHTML={{ __html: atob(t.image.split(',')[1]) }}
                />
                <div className="traits">
                  <h3>{t.name}</h3>
                  <p>{t.description}</p>
                  <ul>
                    {t.attributes.map((a: any) => (
                      <li key={a.trait_type}>
                        <strong>{a.trait_type}:</strong> {String(a.value)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}

        <Toaster position="bottom-center" richColors />
      </main>
    </>
  )
}
