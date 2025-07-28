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
    <div id="preview-section">
      <h2 className="section-title">Your Minted Mandalas</h2>

      {tokens.map((t, i) => (
        <div key={i} className="preview-container">
          <div
            className="svg-preview"
            /* image is already base64-encoded SVG */
            dangerouslySetInnerHTML={{ __html: atob(t.image.split(',')[1]) }}
          />
          <div className="traits">
            <h3>{t.name}</h3>
            <p>{t.description}</p>
            <ul>
              {t.attributes.map(a => (
                <li key={a.trait_type}>
                  <strong>{a.trait_type}:</strong> {String(a.value)}
                  <RarityBadge trait={a.trait_type} value={a.value} />
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
