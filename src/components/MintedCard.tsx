// src/components/MintedCard.tsx
import { memo } from 'react'
import { SvgInline } from './SvgInline'
import { RarityBadge } from './RarityBadge'

type Attribute = { trait_type: string; value: string | number | boolean }
export type TokenMeta = {
  name: string
  description: string   // kept in type, but not rendered
  image: string
  attributes: Attribute[]
}

/** Pure card without description (keeps layout unchanged). */
export const MintedCard = memo(function MintedCard({ token }: { token: TokenMeta }) {
  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      <SvgInline dataUrl={token.image} className="w-[256px] h-[256px] shrink-0" title={token.name} />
      <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-2 break-words">
        <h3 className="text-lg font-semibold">{token.name}</h3>
        {/* no per-card description by design */}
        <ul className="space-y-1 break-words">
          {token.attributes.map(a => (
            <li key={a.trait_type}>
              <strong>{a.trait_type}:</strong> {String(a.value)}{' '}
              <RarityBadge trait={a.trait_type} value={a.value} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
})
