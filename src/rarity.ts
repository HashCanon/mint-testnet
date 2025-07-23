/** Constant table of rarity based on the results of 3 simulation runs */
export const rarityStars: Record<string, Record<string, string>> = {
    Balanced: {
      true:  '★★★★☆',
      false: '★☆☆☆☆',
    },
    Passages: {
      0:'★★★★★', 1:'★★★★★', 2:'★★★★☆', 3:'★★★☆☆',
      4:'★★☆☆☆', 5:'★★☆☆☆', 6:'★★☆☆☆', 7:'★★★☆☆',
      8:'★★★★☆', 9:'★★★★★',10:'★★★★★',11:'★★★★★',
    },
  }
  
/** Return a string with stars or `null` if there is no data */
  export function getRarityStars(trait: string, value: string|number|boolean) {
    const t = rarityStars[trait]
    return t ? t[String(value)] ?? null : null
  }
  