// src/components/MintedMandalas.tsx
import { useEffect, useMemo, useState } from 'react'
import { MintedCard, type TokenMeta } from './MintedCard'
import {
  Pagination, PaginationContent, PaginationEllipsis,
  PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from '@/components/ui/pagination'

export interface MintedMandalasProps {
  tokens: TokenMeta[]
  loading?: boolean
  itemsPerPage?: number
}

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
  // --- hooks MUST be called unconditionally at the top level ---
  const perPage = Math.max(1, itemsPerPage)
  const normalized = useMemo(() => tokens, [tokens]) // no dedupe/transform here
  const [page, setPage] = useState(1)

  const total = normalized.length
  const pageCount = Math.max(1, Math.ceil(total / perPage))

  useEffect(() => {
    if (page > pageCount) setPage(pageCount)
  }, [page, pageCount])

  const start = (page - 1) * perPage
  const end = Math.min(start + perPage, total)
  const view = useMemo(() => normalized.slice(start, end), [normalized, start, end])
  const pageItems = buildPages(page, pageCount)
  const showPager = pageCount > 1

  // --- only now return on loading/empty ---
  if (loading) return <p className="status">Loading your mandalas…</p>
  if (total === 0) return null

  return (
    <div className="space-y-10">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Your Minted Mandalas
      </h2>

      <div className="space-y-4">
        {view.map((t) => (
          <MintedCard
            key={
              // stable key: prefer Source hash; fallback to name
              (t.attributes.find(a => a.trait_type === 'Source hash')?.value as string)
              ?? `name-${t.name}`
            }
            token={t}
          />
        ))}
      </div>

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
