// components/MintedMandalas.tsx
import { RarityBadge } from './RarityBadge'

type Attribute = { trait_type: string; value: string | number | boolean }

export interface MintedMandalasProps {
  tokens: {
    name: string
    description: string
    image: string
    attributes: Attribute[]
  }[]
  loading?: boolean      
}

/** Renders gallery of already-minted mandalas. */
export function MintedMandalas({ tokens, loading }: MintedMandalasProps) {
  if (loading) return <p className="status">Loading your mandalas…</p>
  if (!tokens.length) return null

  return (
    <div className="space-y-10">
      <h2 className="text-center text-2xl font-semibold tracking-tight">
        Your Minted Mandalas
      </h2>
      <div className="space-y-4">
        {tokens.map((t, i) => (
          <div
            key={i}
            className="flex flex-col md:flex-row gap-6 items-start w-full"
          >
            <div
              className="w-[256px] h-[256px] shrink-0"
              dangerouslySetInnerHTML={{ __html: atob(t.image.split(',')[1]) }}
            />

            <div className="flex-1 min-w-0 text-sm leading-relaxed space-y-2 break-words">
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p>{t.description}</p>
              <ul className="space-y-1 break-words">
                {t.attributes.map(a => (
                  <li key={a.trait_type}>
                    <strong>{a.trait_type}:</strong> {String(a.value)}{' '}
                    <RarityBadge trait={a.trait_type} value={a.value} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      
    </div>
  )
}
