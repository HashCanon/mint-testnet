import { useMemo } from 'react'
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
  tokens: TokenMeta[]          // page slice (not the whole list)
  totalCount: number           // total tokens count for pager
  page: number                 // current page (1-based)
  onPageChange: (p: number) => void
  loading?: boolean
  itemsPerPage?: number
}

const COMMON_ONCHAIN_DESC =
  'HashCanon is a fully on-chain mandala: a deterministic glyph where entropy becomes form. ' +
  'A 256-bit cryptographic seed unfolds into self-contained SVG art, following the visual principles of the I Ching. ' +
  'No IPFS. No servers. Only Ethereum.'

function buildPages(current: number, totalPages: number): (number | string)[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const out: (number | string)[] = [1]
  const start = Math.max(2, current - 1)
  const end = Math.min(totalPages - 1, current + 1)
  if (start > 2) out.push('…')
  for (let p = start; p <= end; p++) out.push(p)
  if (end < totalPages - 1) out.push('…')
  out.push(totalPages)
  return out
}

export function MintedMandalas({
  tokens,
  totalCount,
  page,
  onPageChange,
  loading,
  itemsPerPage = 10,
}: MintedMandalasProps) {
  const perPage = Math.max(1, itemsPerPage)
  const pageCount = Math.max(1, Math.ceil((totalCount || 0) / perPage))
  const pageItems = useMemo(() => buildPages(page, pageCount), [page, pageCount])
  const showPager = pageCount > 1

  if (loading) return <p className="status">Loading your mandalas…</p>
  if (!totalCount) return null

  return (
    <div className="space-y-8">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Your Minted Mandalas
      </h2>

      <div className="text-sm md:text-base leading-relaxed space-y-2">
        <p>{COMMON_ONCHAIN_DESC}</p>
        <p className="text-muted-foreground">
          <em>Common on-chain description for the entire collection.</em>
        </p>
      </div>

      <div className="space-y-6">
        {tokens.map(t => (
          <MintedCard
            key={
              (t.attributes.find(a => a.trait_type === 'Source hash')?.value as string) ??
              `name-${t.name}`
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
                onClick={(e) => { e.preventDefault(); onPageChange(Math.max(1, page - 1)) }}
                aria-disabled={page === 1}
                className={page === 1 ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {pageItems.map((p, idx) =>
              typeof p === 'number' ? (
                <PaginationItem key={`p-${p}-${idx}`}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); onPageChange(p) }}
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
                onClick={(e) => { e.preventDefault(); onPageChange(Math.min(pageCount, page + 1)) }}
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
