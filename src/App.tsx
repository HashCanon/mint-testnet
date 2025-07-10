// src/App.tsx
import { useEffect, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { toast, Toaster } from 'sonner'
import { CONTRACTS } from './constants'

import {
  mintNFT,
  getMintingStatus,
  getTotalMinted,
  getTokenURI,
} from './logic'
import './App.css'

// resolve contract address for the current chain
const getAddress = (chainId?: number) =>
  chainId && CONTRACTS[chainId] ? CONTRACTS[chainId] : undefined

declare global {
  interface Window {
    ethereum?: any
  }
}

const MINT_START_TIME = new Date('2025-07-07T13:12:00Z')
const TOTAL_SUPPLY_CAP = 8_192

export default function App() {
  /* wallet info -------------------------------------------------------- */
  const { address, isConnected } = useAccount()
  const chainId  = useChainId()            // numeric id (0 if unknown)
  const chains   = useChains()             // list from RainbowKit config
  const chain    = chains.find(c => c.id === chainId)
  const networkOk = !!getAddress(chainId)  // valid when address exists

  /* ui-state ----------------------------------------------------------- */
  const [now, setNow] = useState(new Date())
  const [mintingEnabled, setMintingEnabled] = useState<boolean | null>(null)
  const [totalMinted, setTotalMinted] = useState<number | null>(null)
  const [mintedTokens, setMintedTokens] = useState<any[]>([])
  const [waitToast, setWaitToast] = useState<string | number | null>(null)

  /* local clock -------------------------------------------------------- */
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1_000)
    return () => clearInterval(id)
  }, [])

  /* totalSupply one-shot ---------------------------------------------- */
  useEffect(() => {
    getTotalMinted().then(setTotalMinted).catch(() => setTotalMinted(0))
  }, [])

  /* mintingEnabled polling -------------------------------------------- */
  useEffect(() => {
    let first = true
    const id = setInterval(async () => {
      const ms = MINT_START_TIME.getTime() - Date.now()
      if (first || ms <= 60_000) {
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
    }, 1_000)
    return () => clearInterval(id)
  }, [])

  /* waiting toast ------------------------------------------------------ */
  useEffect(() => {
    const afterStart = now >= MINT_START_TIME
    if (afterStart && mintingEnabled === false && !waitToast) {
      const id = toast('⏳ Waiting for network confirmation…', {
        duration: Infinity,
      })
      setWaitToast(id)
    }
    if (mintingEnabled === true && waitToast) {
      toast.dismiss(waitToast)
      setWaitToast(null)
    }
  }, [now, mintingEnabled, waitToast])

  /* helpers ------------------------------------------------------------ */
  const fmt = (ms: number) => {
    const s = Math.max(0, Math.floor(ms / 1000))
    const h = Math.floor((s % 86400) / 3600)
    const m = Math.floor((s % 3600) / 60)
    const sec = s % 60
    return `${h.toString().padStart(2, '0')}:${m
      .toString()
      .padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
  }

  /* mint click --------------------------------------------------------- */
  const handleMint = async () => {
    if (!isConnected) return toast.error('❌ Connect wallet first')
    if (!networkOk) return toast.error('❌ Wrong network')
    if (mintingEnabled !== true) return toast.error('❌ Mint not active')
    if (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
      return toast.error('❌ Sold out')

    toast.info('🦊 Confirm the transaction in your wallet…')
    try {
      const tx = await mintNFT()
      const id = toast.info('⏳ Minting…', { duration: Infinity })
      await tx.wait()
      toast.dismiss(id)
      toast.success('✅ Mint successful!')

      const updated = await getTotalMinted()
      setTotalMinted(updated)

      const meta = await getTokenURI(updated)
      setMintedTokens(prev => [meta, ...prev])
    } catch (err: any) {
      toast.error(`❌ ${err.shortMessage ?? err.message}`)
    }
  }

  /* render ------------------------------------------------------------- */
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
            Available in{' '}
            <strong>{fmt(MINT_START_TIME.getTime() - now.getTime())}</strong>
          </p>
        </div>
      )}

      <main id="mandala-section">
        <div className="section-title">Mint your unique mandala</div>
        <p className="status">
          Each token is fully on-chain and costs 0.002 ETH.
        </p>

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
                href={`https://${chain?.testnet ? 'sepolia.' : ''}etherscan.io/address/${getAddress(
                  chainId,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {getAddress(chainId)!.slice(0, 6)}…{getAddress(chainId)!.slice(-4)}
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
                  dangerouslySetInnerHTML={{
                    __html: atob(t.image.split(',')[1]),
                  }}
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
