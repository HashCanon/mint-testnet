// src/components/MintedMandalas.tsx
import { useEffect, useMemo, useState } from 'react'
import { MintedCard, type TokenMeta } from './MintedCard'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

export interface MintedMandalasProps {
  tokens: TokenMeta[]
  loading?: boolean
  itemsPerPage?: number
}

// Single collection-wide on-chain description shown once above the list.
const COMMON_ONCHAIN_DESC =
  'HashCanon is a fully on-chain mandala: a deterministic glyph where entropy becomes form. ' +
  'A 256-bit cryptographic seed unfolds into self-contained SVG art, following the visual principles of the I Ching. ' +
  'No IPFS. No servers. Only Ethereum.'

/** Build a compact page list with ellipsis. */
function buildPages(current: number, total: number): (number | string)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | string)[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  if (start > 2) out.push('…')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < total - 1) out.push('…')
  out.push(total)
  return out
}

export function MintedMandalas({ tokens, loading, itemsPerPage = 10 }: MintedMandalasProps) {
  /* --- Hooks must be called unconditionally (StrictMode-safe) --- */
  const perPage = Math.max(1, itemsPerPage)
  const [page, setPage] = useState(1)
  const normalized = useMemo(() => tokens, [tokens]) // no transform; just keeping identity stable

  const total = normalized.length
  const pageCount = Math.max(1, Math.ceil(total / perPage))

  useEffect(() => {
    // clamp page if list size changes
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const start = (page - 1) * perPage
  const end = Math.min(start + perPage, total)
  const view = useMemo(() => normalized.slice(start, end), [normalized, start, end])
  const pageItems = buildPages(page, pageCount)
  const showPager = pageCount > 1

  /* --- Early returns AFTER hooks --- */
  if (loading) return <p className="status">Loading your mandalas…</p>
  if (total === 0) return null

  return (
    <div className="space-y-8">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Your Minted Mandalas
      </h2>

      {/* Single shared on-chain description for the entire collection */}
      <div className="text-sm md:text-base leading-relaxed space-y-2">
        <p>{COMMON_ONCHAIN_DESC}</p>
        <p className="text-muted-foreground">
          <em>Common on-chain description for the entire collection.</em>
        </p>
      </div>

      {/* Cards */}
      <div className="space-y-6">
        {view.map(t => (
          <MintedCard
            key={
              (t.attributes.find(a => a.trait_type === 'Source hash')?.value as string) ??
              `name-${t.name}`
            }
            token={t}
          />
        ))}
      </div>

      {/* Pagination (shadcn/ui). Hidden when only one page. */}
      {showPager && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.max(1, p - 1)) }}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {pageItems.map((p, idx) =>
              typeof p === 'number' ? (
                <PaginationItem key={`p-${p}-${idx}`}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); setPage(p) }}
                    isActive={p === page}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={`e-${idx}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => { e.preventDefault(); setPage(p => Math.min(pageCount, p + 1)) }}
                aria-disabled={page === pageCount}
                className={page === pageCount ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
