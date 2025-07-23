// src/components/RarityBadge.tsx
import React from 'react'
import { getRarityStars } from '../rarity'

interface Props {
  trait: string
  value: string | number | boolean
  withPrefix?: boolean   // показывает « | Rarity: »
}

export const RarityBadge: React.FC<Props> = ({
  trait,
  value,
  withPrefix = true,
}) => {
  const stars = getRarityStars(trait, value)

  return (
    <>
      {withPrefix && <span className="rarity-prefix"> | Rarity:&nbsp;</span>}
      <span className="rarity">{stars}</span>
    </>
  )
}
