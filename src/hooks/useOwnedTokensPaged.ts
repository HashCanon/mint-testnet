// Comments in English only
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CONTRACTS } from '@/constants'

// Minimal ABI (only what we call)
const ABI = [
  {
    type: 'function',
    name: 'tokensOfOwner',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256[]' }],
  },
  {
    type: 'function',
    name: 'tokenURI',
    stateMutability: 'view',
    inputs: [{ name: 'id', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
] as const

export type TokenMeta = {
  name: string
  description: string
  image: string
  attributes: { trait_type: string; value: string | number | boolean }[]
}

type Params = { page: number; pageSize: number }

export function useOwnedTokensPaged({ page, pageSize }: Params) {
  const { address } = useAccount()
  const chainId = useChainId()
  const client = usePublicClient()

  const contract = useMemo(() => {
    const addr = CONTRACTS[chainId as number]
    return addr
      ? { address: addr as `0x${string}`, abi: ABI }
      : null
  }, [chainId])

  const [ids, setIds] = useState<number[]>([])
  const [tokens, setTokens] = useState<TokenMeta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const cacheRef = useRef<Map<number, TokenMeta>>(new Map())

  // fetch IDs once per address/chain
  useEffect(() => {
    let cancelled = false
    setError(null)
    setIds([])
    if (!client || !contract || !address) return

    ;(async () => {
      try {
        const raw = (await client.readContract({
          ...contract,
          functionName: 'tokensOfOwner',
          args: [address],
        })) as bigint[]
        if (cancelled) return
        const list = raw.map(n => Number(n)).sort((a, b) => b - a) // newest first
        setIds(list)
      } catch (e) {
        if (!cancelled) setError(e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [client, contract, address])

  // fetch current page tokenURIs
  useEffect(() => {
    let cancelled = false
    setError(null)
    setTokens([])
    if (!client || !contract) return

    const start = (page - 1) * pageSize
    const end = Math.min(start + pageSize, ids.length)
    const pageIds = ids.slice(start, end)

    if (pageIds.length === 0) return

    setLoading(true)
    ;(async () => {
      try {
        const results: TokenMeta[] = []
        // small concurrency to avoid provider throttling
        const CONCURRENCY = 3
        let i = 0
        async function next() {
          if (cancelled) return
          const id = pageIds[i++]
          if (id === undefined) return
          let meta = cacheRef.current.get(id)
          if (!meta) {
            const uri = (await client.readContract({
              ...contract,
              functionName: 'tokenURI',
              args: [BigInt(id)],
            })) as string
            const b64 = uri.split(',')[1] ?? ''
            meta = JSON.parse(atob(b64)) as TokenMeta
            cacheRef.current.set(id, meta)
          }
          results.push(meta)
          if (i < pageIds.length) await next()
        }
        // kick off up to CONCURRENCY workers
        await Promise.all(Array.from({ length: Math.min(CONCURRENCY, pageIds.length) }, next))
        if (!cancelled) setTokens(results)
      } catch (e) {
        if (!cancelled) setError(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [client, contract, ids, page, pageSize])

  return {
    ids,
    tokens,
    total: ids.length,
    loading,
    error,
  }
}
