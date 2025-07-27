// utils/rarity.ts (256-bit version)
// Constant rarity table + fallback “★★★★★+” for off-scale values.

/** Constant table of rarity based on 3 simulation runs */
export const rarityStars: Record<string, Record<string, string>> = {
  Balanced: {
    Yes: '★★★★☆',
    No:  '★☆☆☆☆',
  },
  Passages: {
    default: '★★★★★+', // anything ≥12 passages
    '0':  '★★★★★',
    '1':  '★★★★★',
    '2':  '★★★★☆',
    '3':  '★★★☆☆',
    '4':  '★★☆☆☆',
    '5':  '★★☆☆☆',
    '6':  '★★☆☆☆',
    '7':  '★★★☆☆',
    '8':  '★★★★☆',
    '9':  '★★★★★',
    '10': '★★★★★',
    '11': '★★★★★',
  },
};

/** Return a string with stars or `null` if there is no data. */
export function getRarityStars(
  trait: string,
  value: string | number | boolean,
): string | null {
  if (trait === 'Source hash') return '';

  const table = rarityStars[trait];
  if (!table) return null;

  const stars = table[String(value)];
  return stars ?? table.default ?? '★★★★★+';
}
