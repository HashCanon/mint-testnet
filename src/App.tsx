// src/App.tsx
import { useEffect, useMemo, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'

import { CONTRACTS, MINT_START_TIME, TOTAL_SUPPLY_CAP } from './constants'

import { useCountdown } from './hooks/useCountdown'
import { useMintingStatus } from './hooks/useMintingStatus'
import { useTotalMinted } from './hooks/useTotalMinted'
import { useMint } from './hooks/useMint'
import { useOwnedTokensPaged } from './hooks/useOwnedTokensPaged'
import { useAutoThemeClass } from './hooks/useAutoThemeClass'

import { Header } from './components/Header'
import { Countdown } from './components/Countdown'
import { WalletInfo } from './components/WalletInfo'
import { StatusPanel } from './components/StatusPanel'
import { ContactBlock } from './components/ContactBlock'
import { MintedMandalas } from './components/MintedMandalas'
import { Button } from '@/components/ui/button'

const getAddress = (id?: number) => (id && CONTRACTS[id]) || undefined

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

  // session-minted items (shown on top of page 1)
  const [sessionTokens, setSessionTokens] = useState<any[]>([])

  // mint handler (single source of truth)
  const { mint: handleMint, busy: mintBusy } = useMint({
    onSuccess: meta =>
      setSessionTokens(prev => {
        // de-duplicate by a stable key
        const key = meta?.sourceHash ?? meta?.tokenId ?? meta?.id
        if (key && prev.some(t => (t?.sourceHash ?? t?.tokenId ?? t?.id) === key)) return prev
        return [meta, ...prev]
      }),
    onAfterSuccess: refreshTotal, // returns number (totalSupply or id)
  })

  const [waitToast, setWaitToast] = useState<string | number | null>(null)

  const pageSize = 5
  const [page, setPage] = useState(1)
  const { tokens: ownedPageTokens, total: ownedTotal, loading: pagedLoading } =
    useOwnedTokensPaged({ page, pageSize })

  const [tokensToast, setTokensToast] = useState<string | number | null>(null)

  // Merge session + owned (page 1) with de-duplication
  const pageTokens = useMemo(() => {
    const merge = page === 1 ? [...sessionTokens, ...ownedPageTokens] : ownedPageTokens
    const seen = new Set<string>()
    const uniq = merge.filter((t: any) => {
      const key = String(t?.sourceHash ?? t?.tokenId ?? t?.id ?? '')
      if (!key) return true
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    return page === 1 ? uniq.slice(0, pageSize) : uniq
  }, [page, pageSize, sessionTokens, ownedPageTokens])

  const totalForPager = ownedTotal + sessionTokens.length

  useAutoThemeClass()

  // wipe session list when wallet disconnects or switches
  useEffect(() => {
    if (!isConnected || !address) setSessionTokens([])
  }, [isConnected, address])

  // "Waiting for network confirmation…" before mint opens
  useEffect(() => {
    const afterStart = now >= MINT_START_TIME
    if (afterStart && mintingEnabled === false && !waitToast) {
      const id = toast.info('Waiting for network confirmation…', { duration: Infinity })
      setWaitToast(id)
    }
    if (mintingEnabled === true && waitToast) {
      toast.dismiss(waitToast)
      setWaitToast(null)
    }
  }, [now, mintingEnabled, waitToast])

  // Reset to page 1 on wallet/chain change
  useEffect(() => {
    setPage(1)
  }, [address, chainId])

  // "Loading your collection…" while a page is loading
  useEffect(() => {
    if (pagedLoading && !tokensToast) {
      const id = toast.info('Loading your collection…', { duration: Infinity })
      setTokensToast(id)
    }
    if (!pagedLoading && tokensToast) {
      toast.dismiss(tokensToast)
      setTokensToast(null)
    }
  }, [pagedLoading, tokensToast])

  const COMMON_ONCHAIN_DESC =
    'HashCanon is a fully on-chain mandala: a deterministic glyph where entropy becomes form. ' +
    'A 256-bit cryptographic seed unfolds into self-contained SVG art, following the visual principles of the I Ching. ' +
    'No IPFS. No servers. Only Ethereum.'

  return (
    <>
      <Header chainName={chain?.name} />
      <Countdown now={now} startTime={MINT_START_TIME} mintingEnabled={mintingEnabled} />
      <main className="mx-auto max-w-screen-md px-4 space-y-8 overflow-x-hidden">
        <section className="space-y-4 mt-8">
          <h2 className="text-center text-2xl font-semibold tracking-tight">
            Mint your unique mandala
          </h2>

          <div className="space-y-4 text-base leading-relaxed">
            <WalletInfo isConnected={isConnected} chainId={chainId} />

            <p className="status">{COMMON_ONCHAIN_DESC}</p>

            <Button
              className="rounded-none w-full py-7 text-base font-semibold bg-green-600 hover:bg-green-700 text-white cursor-pointer"
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
            </Button>
          </div>

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
        </section>

        <MintedMandalas
          tokens={pageTokens}
          totalCount={totalForPager}
          page={page}
          onPageChange={setPage}
          loading={pagedLoading}
          itemsPerPage={pageSize}
        />

        <ContactBlock />
        <Toaster position="bottom-center" richColors />
      </main>
    </>
  )
}
