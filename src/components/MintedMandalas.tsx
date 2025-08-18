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

import { Skeleton } from '@/components/ui/skeleton'

export interface MintedMandalasProps {
  tokens: TokenMeta[]          // page slice (not the whole list)
  totalCount: number           // total tokens count for pager
  page: number                 // current page (1-based)
  onPageChange: (p: number) => void
  loading?: boolean
  itemsPerPage?: number
}

const COMMON_ONCHAIN_DESC =
  'Some discription...'

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

export function MintedMandalas({ tokens, totalCount, page, onPageChange, loading, itemsPerPage = 10 }: MintedMandalasProps) {
  const perPage = Math.max(1, itemsPerPage)
  const pageCount = Math.max(1, Math.ceil((totalCount || 0) / perPage))
  const pageItems = useMemo(() => buildPages(page, pageCount), [page, pageCount])
  const showPager = pageCount > 1

  if (!totalCount && !loading) return null

  return (
    <div className="space-y-8 mt-6">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Your Minted Mandalas
      </h2>

      <div className="text-sm md:text-base leading-relaxed space-y-2">
        <p>{COMMON_ONCHAIN_DESC}</p>
        <p className="text-muted-foreground">
          <em>if needed.</em>
        </p>
      </div>

      {/* cards or skeletons */}
      <div className="space-y-6">
        {loading
          ? Array.from({ length: perPage }).map((_, i) => (
              <div key={`sk-${i}`} className="flex flex-col md:flex-row gap-6 items-start w-full">
                {/* image skeleton */}
                <Skeleton className="w-[256px] h-[256px] shrink-0" />
                {/* text skeletons */}
                <div className="flex-1 min-w-0 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))
          : tokens.map(t => (
              <MintedCard
                key={(t.attributes.find(a => a.trait_type === 'Source hash')?.value as string) ?? `name-${t.name}`}
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
                aria-disabled={page === 1 || loading}
                className={page === 1 || loading ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>

            {pageItems.map((p, idx) =>
              typeof p === 'number' ? (
                <PaginationItem key={`p-${p}-${idx}`}>
                  <PaginationLink
                    href="#"
                    onClick={(e) => { e.preventDefault(); if (!loading) onPageChange(p) }}
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
                aria-disabled={page === pageCount || loading}
                className={page === pageCount || loading ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  )
}
