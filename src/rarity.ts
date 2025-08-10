// utils/rarity.ts
// Constant rarity tables + empirical bins for Crown. 256-bit version.

export type HashBits = 256 | 160;

/* ───────── Evenness (0.00–1.00) → stars ───────── */
function starsEvenness256(r: number): string {
  // defensive guard – mathematically unreachable but keeps noise out
  if (r < 0 || r > 1) return '★★★★★+';

  if (r >= 0.99) return '★★☆☆☆';   // 1.00 and hypothetical 0.99
  if (r >= 0.93) return '☆☆☆☆☆';   // modal right wing 0.93–0.98
  if (r >= 0.89) return '★☆☆☆☆';   // 0.89–0.92
  if (r >= 0.83) return '★★☆☆☆';   // 0.83–0.88
  if (r >= 0.78) return '★★★☆☆';   // 0.78–0.82
  if (r >= 0.72) return '★★★★☆';   // 0.72–0.77
  if (r >= 0.68) return '★★★★★';   // 0.68–0.71 (rare)
  return '★★★★★+';                 // < 0.68 (ultra-rare)
}

/** Constant table of rarity for discrete traits */
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
    '5':  '★★☆☆☆', // mode ~ most common
    '6':  '★★☆☆☆',
    '7':  '★★★☆☆',
    '8':  '★★★★☆',
    '9':  '★★★★★',
    '10': '★★★★★',
    '11': '★★★★★',
  },
};

/* ───────── Crown rarity (empirical bins, 256-bit) ───────── */
const crownFreq256: Record<string, number> = {
  '2:1': 0.000956, '2:2': 0.001811, '2:3': 0.002747, '2:4': 0.002665,
  '2:5': 0.001404, '2:6': 0.001200, '2:7': 0.000549, '2:8': 0.000244,
  '2:9': 0.000081, '2:10': 0.000020,

  '3:1': 0.051290, '3:2': 0.095276, '3:3': 0.125977, '3:4': 0.122884,
  '3:5': 0.091451, '3:6': 0.055257, '3:7': 0.028361, '3:8': 0.013143,
  '3:9': 0.004313, '3:10': 0.001526, '3:11': 0.000509, '3:12': 0.000203,
  '3:13': 0.000020,

  '4:1': 0.145203, '4:2': 0.016866, '4:3': 0.000997, '4:4': 0.000041,

  '5:1': 0.182678, '5:2': 0.020345, '5:3': 0.001831, '5:4': 0.000163,

  '6:1': 0.013529, '6:2': 0.000081,
  '7:1': 0.013936, '7:2': 0.000041,
  '8:1': 0.001099, '9:1': 0.000997,
  '10:1': 0.000081, '11:1': 0.000020, '13:1': 0.000020,

  '—': 0.000183, // no symmetry detected
} as const;

function starsCrown256(k: string): string {
  const p = crownFreq256[k];
  if (p === undefined) return '★★★★★+'; // unseen/out-of-sample
  if (p >= 0.12)   return '☆☆☆☆☆'; // modal classes
  if (p >= 0.05)   return '★☆☆☆☆'; // common
  if (p >= 0.018)  return '★★☆☆☆'; // uncommon
  if (p >= 0.005)  return '★★★☆☆'; // rare
  if (p >= 0.0012) return '★★★★☆'; // very rare
  return '★★★★★';                  // ultra-rare
}

/* ───────── API ───────── */
export function getRarityStars(
  trait: string,
  value: string | number | boolean,
): string | null {
  if (trait === 'Source hash') return '';

  if (trait === 'Evenness') {
    const r = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(r)) return '★★★★★+';
    return starsEvenness256(r); // HashCanon tokens are 256-bit
  }

  if (trait === 'Crown') {
    return starsCrown256(String(value)); // "5:1", "3:4", or "—"
  }

  const table = rarityStars[trait];
  if (!table) return null;

  const stars = table[String(value)];
  return stars ?? table.default ?? '★★★★★+';
}
