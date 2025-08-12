// src/components/MintedCard.tsx
import { memo, useMemo } from 'react'
import { SvgInline } from './SvgInline'
import { RarityBadge } from './RarityBadge'

type Attribute = { trait_type: string; value: string | number | boolean }
export type TokenMeta = {
  name: string
  description: string
  image: string
  attributes: Attribute[]
}

/** Pure card for a single minted mandala (memoized). */
export const MintedCard = memo(function MintedCard({ token }: { token: TokenMeta }) {
  // decode once per token; SvgInline still writes via ref to avoid React diffing
  const htmlDataUrl = token.image

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start w-full">
      <SvgInline
        dataUrl={htmlDataUrl}
        className="w-[256px] h-[256px] shrink-0"
        title={token.name}
      />
      <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-2 break-words">
        <h3 className="text-lg font-semibold">{token.name}</h3>
        <p>{token.description}</p>
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
