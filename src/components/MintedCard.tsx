// src/components/MintedCard.tsx
import { memo } from 'react'
import { SvgInline } from './SvgInline'
import { RarityBadge } from './RarityBadge'

type Attribute = { trait_type: string; value: string | number | boolean }
export type TokenMeta = {
  name: string
  description: string
  image: string
  attributes: Attribute[]
}

/** Pure card without description (keeps layout unchanged). */
export const MintedCard = memo(function MintedCard({ token }: { token: TokenMeta }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      <SvgInline dataUrl={token.image} className="w-[256px] h-[256px] shrink-0" title={token.name} />
      <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-2">
        <h3 className="text-lg font-semibold">{token.name}</h3>
        <ul className="space-y-1">
          {token.attributes.map(a => {
            const isHash = a.trait_type === 'Source hash'
            return (
              <li key={a.trait_type} className="break-words">
                <strong>{a.trait_type}:</strong>{' '}
                {/* break long hashes without widening the page */}
                <span className={isHash ? 'break-all font-mono text-xs md:text-sm' : undefined}>
                  {String(a.value)}
                </span>{' '}
                <RarityBadge trait={a.trait_type} value={a.value} />
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
})
