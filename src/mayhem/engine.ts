// MCBL Mayhem — player pool + hidden rating engine.
//
// Every (player, year) combo that appears in the games collection becomes a
// draftable card. Each card carries a hidden overall rating built from:
//   - per-game production (points, assists, steals, blocks, rebounds, efficiency)
//   - win influence: production that actually came in wins counts extra, so a
//     stat-stuffer on a losing team rates below the same stats on a winner
//   - a slight boost for players on that year's championship team
// The rating is never shown to the player — only real stats are displayed.
//
// Team strength then layers on roster-construction effects: chemistry between
// former teammates, and a penalty for a squad with nobody who can actually
// run an offense.

import { weaknessFor, type Weakness } from "./weaknesses";
import { effectsOf, strengthsFor, type Strength, type StrengthEffects } from "./strengths";
import { physiqueFor, type Physique } from "./physique";

// A Bard surge amplifies the bonus half of a teammate's strength multipliers.
export const SURGE_STRENGTH_AMP = 1.5;

const TEAM_NAMES: Record<string, string> = {
  jjp: "Jah Jah Pelicans",
  ns: "Vancouver Vincents",
  lls: "Lapu Lapu Soldiers",
  dt: "ChangHai Sharks",
};

// Minimal shape of a Firestore game document.
type GameDoc = Record<string, unknown> & {
  date?: string;
  teams?: { team1?: string; team2?: string; score?: number[]; playoffs?: boolean; winner?: string };
};

export type MayhemAvg = {
  pts: number;
  reb: number;
  ast: number;
  stl: number;
  blk: number;
  tpm: number;
  fgPct: number;
  tpPct: number;
};

export type MayhemCard = {
  id: string; // "Name|Year"
  name: string;
  year: number;
  teamCode: string;
  teamName: string;
  champion: boolean;
  gp: number;
  avg: MayhemAvg;
  rating: number; // hidden overall, ~40-99
  weakness: Weakness;
  strengths: Strength[];
  effects: StrengthEffects;
  physique: Physique; // hidden — drives mismatches, never displayed
  profile: {
    scoreVol: number; // relative chance this player takes the scoring event
    threeShare: number; // chance a made bucket is a deep ball (worth 2)
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    fgPct: number;
    fgaVol: number; // shots hoisted per game, for realistic box scores
    tpaVol: number;
    // "Clean" values ignore this player's weakness penalties. A Bard window
    // temporarily swaps them in, which is what "weaknesses stop mattering" means.
    scoreVolClean: number;
    scoreVolSurge: number;
    threeShareClean: number;
  };
};

export type MayhemTeam = {
  name: string;
  players: MayhemCard[];
};

// Which team each player suited up for, per year. Needed to credit wins,
// since game docs only store the two team codes and a flat list of players.
const ROSTERS: Record<number, Record<string, string>> = {
  2023: {
    "Jae Hyune Yea": "jjp", "Rayan Bilkhu": "jjp", "James Lee": "jjp",
    "Jirah Almario": "lls", "Matthew Kim": "lls", "Brandon Wong": "lls",
    "David Chang": "dt", "Brenin Moore": "dt", "Nathean Moore": "dt",
    "Vincent Kang": "ns", "Connor Maclean": "ns", "Lex Rowheder": "ns",
  },
  2025: {
    "Jae Hyune Yea": "jjp", "Rayan Bilkhu": "jjp", "James Lee": "jjp",
    "Jirah Almario": "lls", "Matthew Kim": "lls", "Sonny Nguyen": "lls",
    "David Chang": "dt", "Nathean Moore": "dt", "Brandon Wong": "dt",
    "Vincent Kang": "ns", "Lex Rowheder": "ns", "Harvir Dhaliwal": "ns",
  },
  2026: {
    "Jae Hyune Yea": "jjp", "Rayan Bilkhu": "jjp", "James Lee": "jjp",
    "Jirah Almario": "lls", "Matthew Kim": "lls", "Sonny Nguyen": "lls",
    "David Chang": "dt", "Nathean Moore": "dt", "Gabriel Cho": "dt",
    "Vincent Kang": "ns", "Lex Rowheder": "ns", "Harvir Dhaliwal": "ns",
  },
};

const STAT_KEYS = ["pts", "reb", "ast", "blk", "stl", "fga", "fgm", "tpa", "tpm"] as const;

type Totals = Record<(typeof STAT_KEYS)[number], number>;

// Weighted single-game contribution used for both production and win influence.
function contribution(s: Record<string, number>): number {
  return (
    (s.pts || 0) +
    0.9 * (s.ast || 0) +
    1.1 * (s.stl || 0) +
    1.1 * (s.blk || 0) +
    0.22 * (s.reb || 0)
  );
}

export function buildPlayerPool(raw: GameDoc[]): MayhemCard[] {
  // A few games were accidentally submitted multiple times — collapse them.
  const seen = new Set<string>();
  const games = raw.filter((g) => {
    const t = g.teams || {};
    const key = `${String(g.date).slice(0, 10)}|${t.team1}|${t.team2}|${(t.score || []).join("-")}|${t.playoffs}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  // Champion per year = winner of that year's final playoff game.
  const championByYear: Record<number, string> = {};
  const lastPlayoffDate: Record<number, string> = {};
  for (const g of games) {
    if (!g.teams?.playoffs || !g.date || !g.teams.winner) continue;
    const year = new Date(g.date).getFullYear();
    if (!lastPlayoffDate[year] || g.date > lastPlayoffDate[year]) {
      lastPlayoffDate[year] = g.date;
      championByYear[year] = g.teams.winner;
    }
  }

  type Acc = {
    totals: Totals;
    gp: number;
    winContrib: number;
    teamCode: string;
  };
  const acc: Record<string, Acc> = {};

  for (const g of games) {
    if (!g.date || !g.teams) continue;
    const year = new Date(g.date).getFullYear();
    const roster = ROSTERS[year] || {};
    for (const [player, stats] of Object.entries(g)) {
      if (player === "date" || player === "teams" || typeof stats !== "object") continue;
      const key = `${player}|${year}`;
      if (!acc[key]) {
        acc[key] = {
          totals: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Totals,
          gp: 0,
          winContrib: 0,
          teamCode: roster[player] || "",
        };
      }
      const a = acc[key];
      a.gp++;
      for (const k of STAT_KEYS) a.totals[k] += (stats as Record<string, number>)[k] || 0;
      const team = roster[player];
      const winner = g.teams.winner;
      // No winner recorded (tie) or unknown roster -> half credit.
      const winFactor = !team || !winner ? 0.5 : winner === team ? 1 : 0;
      a.winContrib += contribution(stats as Record<string, number>) * winFactor;
    }
  }

  const cards: (Omit<MayhemCard, "rating"> & { raw: number })[] = [];
  for (const [key, a] of Object.entries(acc)) {
    const [name, yearStr] = key.split("|");
    const year = Number(yearStr);
    const per = (k: (typeof STAT_KEYS)[number]) => a.totals[k] / a.gp;
    const fgPct = a.totals.fgm / (a.totals.fga || 1);
    const tpPct = a.totals.tpm / (a.totals.tpa || 1);

    const avg: MayhemAvg = {
      pts: per("pts"),
      reb: per("reb"),
      ast: per("ast"),
      stl: per("stl"),
      blk: per("blk"),
      tpm: per("tpm"),
      fgPct,
      tpPct,
    };

    const production =
      contribution({ pts: avg.pts, ast: avg.ast, stl: avg.stl, blk: avg.blk, reb: avg.reb }) +
      Math.max(0, fgPct - 0.2) * 6;
    const winInfluence = a.winContrib / a.gp;
    const champion = !!a.teamCode && championByYear[year] === a.teamCode;
    const weakness = weaknessFor(name);
    const strengths = strengthsFor(name);
    const effects = effectsOf(strengths, name);
    const physique = physiqueFor(name);
    // A big man who avoids contact converts far less of his frame into offense.
    const softMult = weakness.soft ? 0.85 : 1;
    let rawScore = 0.62 * production + 0.55 * winInfluence;
    if (champion) rawScore *= 1.06;
    rawScore *= weakness.ratingMult;
    rawScore *= effects.ratingMult;
    // Size only matters relative to the opponent, so it is applied at matchup
    // time rather than baked into the individual rating here.

    const fgm = a.totals.fgm;
    const baseThreeShare =
      fgm > 0
        ? Math.min(0.6, a.totals.tpm / fgm)
        : Math.min(0.5, a.totals.tpa / (a.totals.fga || 1));
    cards.push({
      id: key,
      name,
      year,
      teamCode: a.teamCode,
      teamName: TEAM_NAMES[a.teamCode] || "Free Agent",
      champion,
      gp: a.gp,
      avg,
      weakness,
      strengths,
      effects,
      physique,
      raw: rawScore,
      profile: {
        scoreVol: Math.max(0.15, avg.pts * (weakness.scoreMult ?? 1) * softMult * effects.scoreMult),
        // "Can't shoot threes" caps the deep-ball share regardless of history;
        // "no jumper at all" zeroes it — every bucket comes at the rim.
        threeShare: weakness.interiorOnly
          ? 0
          : weakness.noThree
          ? Math.min(baseThreeShare, 0.06)
          : baseThreeShare,
        reb: avg.reb * effects.rebMult,
        ast: avg.ast * (weakness.passMult ?? 1) * effects.passMult,
        stl: avg.stl * effects.stlMult,
        blk: avg.blk * effects.blkMult,
        fgPct: Math.min(0.6, Math.max(0.1, fgPct + effects.fgPctBoost)),
        // Efficiency means the same makes on fewer attempts.
        fgaVol: per("fga") * (1 - effects.fgPctBoost * 2),
        scoreVolClean: Math.max(0.15, avg.pts * effects.scoreMult),
        // During a Bard surge a teammate's own strengths are amplified too, so
        // the bonus portion of their scoring multiplier counts for half again.
        scoreVolSurge: Math.max(
          0.15,
          avg.pts * (1 + (effects.scoreMult - 1) * SURGE_STRENGTH_AMP)
        ),
        // While a Bard has them lifted, even a non-shooter is willing to let it
        // fly — the floor represents that, since their real share is often zero.
        threeShareClean: Math.max(baseThreeShare, 0.18),
        tpaVol: weakness.interiorOnly
          ? 0
          : weakness.noThree
          ? Math.min(per("tpa"), 1.2)
          : per("tpa"),
      },
    });
  }

  // Normalize hidden ratings onto a 40-99 scale across the whole pool.
  const raws = cards.map((c) => c.raw);
  const min = Math.min(...raws);
  const max = Math.max(...raws);
  const span = max - min || 1;
  return cards
    .map(({ raw: rawScore, ...card }) => ({
      ...card,
      rating: Math.round(40 + 59 * ((rawScore - min) / span)),
    }))
    .sort((a, b) => b.rating - a.rating);
}

// --- roster construction effects ---

// Two players are "former teammates" if there was ever a season where both
// suited up for the same franchise — regardless of which year's card you drafted.
export function haveBeenTeammates(nameA: string, nameB: string): boolean {
  // Two seasons of the same player know each other better than anyone.
  if (nameA === nameB) return true;
  for (const roster of Object.values(ROSTERS)) {
    const a = roster[nameA];
    const b = roster[nameB];
    if (a && b && a === b) return true;
  }
  return false;
}

export type Chemistry = "none" | "pair" | "full";

export function chemistryOf(players: MayhemCard[]): Chemistry {
  if (players.length < 2) return "none";
  let links = 0;
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (haveBeenTeammates(players[i].name, players[j].name)) links++;
    }
  }
  // Three players, three possible pairings — all three linked means the whole
  // squad has run together before.
  if (players.length === 3 && links === 3) return "full";
  return links > 0 ? "pair" : "none";
}

const CHEMISTRY_MULT: Record<Chemistry, number> = {
  none: 1,
  pair: 1.05,
  full: 1.15,
};

// A team needs someone who can actually initiate offense: either a genuine
// distributor or a clear alpha scorer. An all-big-man lineup with no engine
// gets punished no matter how good the individual stat lines look.
export function hasOffensiveEngine(players: MayhemCard[]): boolean {
  return players.some((p) => p.avg.ast >= 1.4 || p.avg.pts >= 5.0);
}

const NO_ENGINE_PENALTY = 0.85; // -15%

export function teamStrength(players: MayhemCard[]): number {
  const base = players.reduce((sum, p) => sum + p.rating, 0);
  const chem = CHEMISTRY_MULT[chemistryOf(players)];
  const balance = hasOffensiveEngine(players) ? 1 : NO_ENGINE_PENALTY;
  return Math.round(base * chem * balance);
}

// Elo-style logistic: even teams are a coin flip, and the favourite's edge
// grows with the rating gap without ever hitting a guarantee.
export function winProbability(strengthA: number, strengthB: number): number {
  return 1 / (1 + Math.pow(10, (strengthB - strengthA) / 60));
}

// --- random team generation ---

// Squads are named after their best player, alliteratively — the Jirah Jimbos,
// the Vincent Volibears. Mascots are bucketed by first letter so the name
// always alliterates with whoever is carrying the team.
const MASCOTS_BY_LETTER: Record<string, string[]> = {
  J: ["Jimbos", "Jackals", "Juggernauts", "Jetsetters", "Jokers", "Javelins"],
  R: ["Ramblers", "Renegades", "Riffraff", "Rockets", "Ronin", "Ragers"],
  V: ["Volibears", "Vikings", "Vandals", "Vipers", "Voyagers", "Vultures"],
  B: ["Bandits", "Bulldogs", "Bruisers", "Buckets", "Blazers", "Bombers"],
  D: ["Dynamos", "Daggers", "Drifters", "Ducks", "Demons", "Dragons"],
  S: ["Sultans", "Snipers", "Stallions", "Squires", "Spartans", "Stingrays"],
  N: ["Nomads", "Ninjas", "Narwhals", "Nighthawks", "Nukes", "Natives"],
  G: ["Gladiators", "Gargoyles", "Grizzlies", "Goblins", "Ghosts", "Gunners"],
  L: ["Lancers", "Legends", "Lynx", "Longhorns", "Lumberjacks", "Lasers"],
  C: ["Cyclones", "Cobras", "Crusaders", "Comets", "Cavaliers", "Chargers"],
  H: ["Hurricanes", "Hooligans", "Hawks", "Hustlers", "Hornets", "Hammers"],
  M: ["Mavericks", "Monstars", "Mustangs", "Marauders", "Miners", "Mambas"],
};

const GENERIC_MASCOTS = ["Ballers", "Legends", "Monstars", "Krakens", "Yetis", "Goats"];

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// The "face" of the squad: highest hidden rating, ties broken by scoring.
export function bestPlayer(players: MayhemCard[]): MayhemCard {
  return players.reduce((best, p) =>
    p.rating > best.rating || (p.rating === best.rating && p.avg.pts > best.avg.pts) ? p : best
  );
}

export function teamNameFor(players: MayhemCard[], used: Set<string>): string {
  const star = bestPlayer(players);
  const firstName = star.name.split(" ")[0];
  const letter = firstName.charAt(0).toUpperCase();
  const mascots = MASCOTS_BY_LETTER[letter] ?? GENERIC_MASCOTS;
  for (let i = 0; i < 40; i++) {
    const name = `${firstName} ${pick(mascots)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  // Every mascot for this letter is taken — fall back to the year for uniqueness.
  const name = `${firstName} ${pick(mascots)} '${String(star.year).slice(2)}`;
  used.add(name);
  return name;
}

// Random trio of cards with no repeated person. `excludeIds` keeps opponents
// from fielding the exact card you drafted, which would read as a clone in the
// play-by-play — a different season of the same player is still fair game.
export function randomTrio(pool: MayhemCard[], excludeIds?: Set<string>): MayhemCard[] {
  const eligible = excludeIds ? pool.filter((c) => !excludeIds.has(c.id)) : pool;
  const source = eligible.length >= 3 ? eligible : pool;
  const trio: MayhemCard[] = [];
  const usedIds = new Set<string>();
  let guard = 0;
  while (trio.length < 3 && guard++ < 500) {
    const card = pick(source);
    // Keyed on the card, not the person — two seasons of the same player can
    // legitimately share a roster.
    if (usedIds.has(card.id)) continue;
    usedIds.add(card.id);
    trio.push(card);
  }
  return trio;
}

// Opponents get tougher as the playoffs progress: sample several candidate
// squads and take a higher percentile each round.
export function generateOpponent(
  pool: MayhemCard[],
  round: "season" | "QF" | "SF" | "F",
  usedNames: Set<string>,
  excludeIds?: Set<string>
): MayhemTeam {
  const candidateCount = round === "season" ? 1 : round === "QF" ? 4 : round === "SF" ? 4 : 6;
  const candidates = Array.from({ length: candidateCount }, () =>
    randomTrio(pool, excludeIds)
  ).sort((a, b) => teamStrength(a) - teamStrength(b));
  const index = round === "QF" ? 1 : round === "SF" ? 2 : candidates.length - 1;
  const players = candidates[index];
  return { name: teamNameFor(players, usedNames), players };
}
