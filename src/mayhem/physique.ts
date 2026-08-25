// MCBL Mayhem — hidden physical profiles.
//
// Height and weight are never shown to the player. They exist so the sim can
// reason about mismatches: who wins a rebound in traffic, who can finish
// through contact, and whether one squad is simply bigger than the other.
//
// These deliberately do NOT re-derive a player's box-score averages — the real
// stats already reflect their size. Physique only drives *relative* effects,
// so a big man's rebounding isn't counted twice.

export type Physique = {
  heightIn: number;
  weightLb: number;
  /** Composite size index, centred near 0 for a median MCBL player. */
  bulk: number;
};

const RAW: Record<string, [number, number]> = {
  // name: [height in inches, weight in lb]
  "Rayan Bilkhu": [72, 205],
  "Jae Hyune Yea": [68, 165],
  "James Lee": [66, 150],
  "David Chang": [66, 150],
  "Nathean Moore": [74, 190],
  "Gabriel Cho": [70, 150],
  "Vincent Kang": [72, 170],
  "Lex Rowheder": [74, 180],
  "Harvir Dhaliwal": [69, 150],
  "Jirah Almario": [69, 190],
  "Matthew Kim": [71, 170],
  "Sonny Nguyen": [67, 170],
  "Brenin Moore": [73, 180],
  "Brandon Wong": [64, 120],
};

// Connor Maclean has no listed measurements, so he sits at league median
// rather than being accidentally treated as tiny.
const DEFAULT_PHYSIQUE: [number, number] = [70, 170];

const MEDIAN_HEIGHT = 70;
const MEDIAN_WEIGHT = 168;

function bulkOf(heightIn: number, weightLb: number): number {
  // Height and mass contribute roughly equally; the divisors put a typical
  // spread inside about -1.5 .. +1.5.
  return (heightIn - MEDIAN_HEIGHT) / 5 + (weightLb - MEDIAN_WEIGHT) / 35;
}

export function physiqueFor(name: string): Physique {
  const [heightIn, weightLb] = RAW[name] ?? DEFAULT_PHYSIQUE;
  return { heightIn, weightLb, bulk: bulkOf(heightIn, weightLb) };
}

/** Average size of a lineup — used for team-vs-team mismatches. */
export function teamBulk(players: { physique: Physique }[]): number {
  if (players.length === 0) return 0;
  return players.reduce((s, p) => s + p.physique.bulk, 0) / players.length;
}

/**
 * Rating-point swing from a size mismatch, from the first team's point of view.
 * Capped so being bigger is an edge, never a decider.
 */
export function sizeEdge(
  mine: { physique: Physique }[],
  theirs: { physique: Physique }[]
): number {
  const delta = teamBulk(mine) - teamBulk(theirs);
  return Math.max(-9, Math.min(9, delta * 6));
}
