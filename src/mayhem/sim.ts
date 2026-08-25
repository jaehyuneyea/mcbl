// MCBL Mayhem — season + playoff game simulation.
//
// A playoff game is decided by the hidden team ratings (favourites usually win,
// upsets stay possible), then a believable point-by-point timeline is built and
// grouped into 10-15 ticks of live commentary. Box scores accumulate from the
// same events, so player stat lines always add up to the final score.

import type { MayhemCard, MayhemTeam } from "./engine";
import { generateOpponent, pick, teamStrength, winProbability } from "./engine";
import { staminaFactor } from "./weaknesses";
import { sizeEdge } from "./physique";
import { SURGE_STRENGTH_AMP } from "./engine";
import type { Strength } from "./strengths";
import {
  ASSISTED_ONES, ASSISTED_TWOS, BLOCKS, BOARDS, INTERIOR_FINISHES, MISSES,
  BARD_ACTIVATION, LIFTED_BY_STYLE, ONE_POINTERS, PNR_LINES, STEALS, TIP_OFF,
  TWO_POINTERS, fill,
} from "./commentary";

export type PlayoffRound = "QF" | "SF" | "F";

export type BoxLine = {
  pts: number; reb: number; ast: number; stl: number; blk: number;
  fgm: number; fga: number; tpm: number; tpa: number;
};

export type PlayerBox = { card: MayhemCard; line: BoxLine };

// `flaw` marks a line triggered by a player's signature weakness — the UI
// highlights these so they stand out. `ot` marks extra-time possessions.
export type Tick = {
  myScore: number;
  oppScore: number;
  text: string;
  flaw?: boolean;
  strength?: boolean;
  /** A bucket that a hot streak helped produce. */
  heated?: boolean;
  /** Scored while a Bard had the squad lifted — shown in yellow. */
  lifted?: boolean;
  ot?: boolean;
};

export type GameResult = {
  won: boolean;
  myScore: number;
  oppScore: number;
  overtime: boolean;
  chaosBy?: { name: string; year: number };
  ticks: Tick[];
  myBox: PlayerBox[];
  oppBox: PlayerBox[];
};

export type SeasonGame = {
  oppName: string;
  won: boolean;
  myScore: number;
  oppScore: number;
};

const rand = Math.random;
// Flattens scoring share across a lineup (1 = raw averages, lower = flatter).
const USAGE_COMPRESSION = 0.65;
// How much harder a Bard-lifted squad attacks while the window is open.
// A Bard surge spikes everything by this much on activation, then bleeds off
// this much per possession until it is spent — or he sets it off again.
const BARD_PEAK = 0.6;
const BARD_DECAY = 0.06;

/** Boost still active at possession i, given when the surges fired. */
function bardBoostAt(i: number, activations: number[]): number {
  let best = 0;
  for (const start of activations) {
    if (i < start) continue;
    best = Math.max(best, BARD_PEAK - BARD_DECAY * (i - start));
  }
  return Math.max(0, best);
}
const jitter = (lo: number, hi: number) => lo + rand() * (hi - lo);
// Small per-game form swing so identical matchups don't always break the same way.
const formNoise = () => (rand() - 0.5) * 10;

function weightedPick<T>(items: T[], weight: (item: T) => number): T {
  const weights = items.map((it) => Math.max(0.0001, weight(it)));
  let roll = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[items.length - 1];
}

// Rough count of expected points, roughly like a real MCBL game (rounds go to 11/15/21).
function loserScore(target: number, closeness: number): number {
  const raw = Math.round(target * (0.28 + 0.75 * closeness + jitter(-0.1, 0.1)));
  return Math.max(3, Math.min(target - 2, raw));
}

// ---------- regular season ----------

export function simulateSeason(
  my: MayhemTeam,
  pool: MayhemCard[],
  usedNames: Set<string>
): SeasonGame[] {
  const games: SeasonGame[] = [];
  const myIds = new Set(my.players.map((p) => p.id));
  for (let i = 0; i < 6; i++) {
    const opp = generateOpponent(pool, "season", usedNames, myIds);
    const pWin = winProbability(teamStrength(my.players) + formNoise(), teamStrength(opp.players) + formNoise());
    const won = rand() < pWin;
    const closeness = won ? 1 - pWin : pWin;
    const losing = loserScore(11, closeness);
    games.push({
      oppName: opp.name,
      won,
      myScore: won ? 11 : losing,
      oppScore: won ? losing : 11,
    });
  }
  return games;
}

// ---------- playoff game ----------

type ScoreEvent = {
  kind: "score";
  side: 0 | 1; // 0 = my team, 1 = opponent
  player: MayhemCard;
  value: 1 | 2;
  assister?: MayhemCard;
  /** Set when Inferno/Microwave meaningfully boosted this shot. */
  heated?: boolean;
  /** Taken during a Chaos takeover — these never miss. */
  chaosShot?: boolean;
  /** Scored while a Bard had the squad lifted. */
  lifted?: boolean;
  /** Produced by the two-man game between a passer and a roller. */
  pnr?: boolean;
  /** This possession is where a Bard surge kicks in. */
  bardStart?: boolean;
};
type FlavorEvent = {
  kind: "stl" | "blk" | "reb" | "miss" | "flaw" | "strength";
  side: 0 | 1;
  player: MayhemCard;
  strength?: Strength;
  /** The Bard call-out itself, as opposed to an ordinary strength moment. */
  bardCall?: boolean;
};
type Ev = ScoreEvent | FlavorEvent;

function buildTeamScoreEvents(
  team: MayhemTeam,
  side: 0 | 1,
  total: number,
  opts: {
    closeGame?: boolean;
    /** Whether a Bard is on this squad and fired at all this game. */
    bardActive?: boolean;
    /** Filled in with the average surge across the segment, for the box score. */
    bardOut?: { avgBoost: number };
    /** Once this player takes over, every remaining bucket is his. */
    chaosCard?: MayhemCard | null;
  } = {}
): ScoreEvent[] {
  const players = team.players;
  // Consecutive-make tracking for Inferno / Microwave. A make lengthens that
  // player's streak; everyone else cools off a step.
  const streak = new Map<string, number>();
  // Split the team total into 1-point makes and 2-point deep balls based on
  // how three-happy the roster actually was.
  const volSum = players.reduce((s, p) => s + p.profile.scoreVol, 0);
  // Players with no jumper at all can never take a deep ball, so a lineup made
  // entirely of them generates zero two-pointers.
  const shooters = players.filter((p) => !p.weakness.interiorOnly);
  const rawShare =
    shooters.length === 0
      ? 0
      : Math.min(
          0.5,
          Math.max(
            0.02,
            players.reduce((s, p) => s + p.profile.threeShare * p.profile.scoreVol, 0) /
              (volSum || 1)
          )
        );
  // While the Bard has them lifted the squad shoots like their weaknesses
  // aren't there, so the deep-ball count has to account for that stretch.
  const cleanVolSum = players.reduce((s, p) => s + p.profile.scoreVolClean, 0);
  const cleanShare = Math.min(
    0.5,
    players.reduce((s, p) => s + p.profile.threeShareClean * p.profile.scoreVolClean, 0) /
      (cleanVolSum || 1)
  );
  // Rough share of the segment spent inside the window.
  const windowFrac = opts.bardActive ? 0.3 : 0;
  const teamThreeShare = rawShare * (1 - windowFrac) + cleanShare * windowFrac;
  let twos = Math.round(((total * teamThreeShare) / (1 + teamThreeShare)) * jitter(0.7, 1.2));
  twos = Math.max(0, Math.min(Math.floor(total / 2), twos));
  const ones = total - twos * 2;

  const values: (1 | 2)[] = [
    ...Array.from({ length: twos }, () => 2 as const),
    ...Array.from({ length: ones }, () => 1 as const),
  ];
  // shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  // Surges can only be placed now that the possession count is known. One or
  // two per game, each spiking then decaying over the following possessions.
  const activations: number[] = [];
  if (opts.bardActive && values.length > 0) {
    const count = 1 + (rand() < 0.4 ? 1 : 0);
    for (let k = 0; k < count; k++) {
      activations.push(Math.floor(rand() * Math.max(1, values.length * 0.75)));
    }
  }
  if (opts.bardOut) {
    const sum = values.reduce((acc, _v, i) => acc + bardBoostAt(i, activations), 0);
    opts.bardOut.avgBoost = values.length > 0 ? sum / values.length : 0;
  }

  // A Chaos takeover starts partway through and runs to the final buzzer.
  const chaosFrom =
    opts.chaosCard && values.length > 0
      ? Math.floor(values.length * (0.3 + rand() * 0.3))
      : -1;

  return values.map((value, i) => {
    if (chaosFrom >= 0 && i >= chaosFrom) {
      // He shoots on every possession from here, and every one drops.
      return { kind: "score", side, player: opts.chaosCard!, value, chaosShot: true };
    }
    // Stamina bites as the game wears on: fading players take fewer of the
    // late buckets, and Rayan-types front-load their whole night.
    const progress = values.length > 1 ? i / (values.length - 1) : 0;
    // Inside a Bard window the squad's weaknesses stop applying, so even the
    // no-jumper players can let one go and nobody fades.
    const bardBoost = bardBoostAt(i, activations);
    // Weaknesses stay switched off for as long as any surge is still running.
    const lifted = bardBoost > 0;
    // Deep balls can only come from players who actually have a jump shot.
    const candidates = lifted || shooters.length === 0 ? players : value === 2 ? shooters : players;
    const player = weightedPick(candidates, (p) => {
      // "Never tired" ignores the fade entirely, which is a real edge late on.
      const gas = lifted || p.effects.neverTired ? 1 : staminaFactor(p.weakness.stamina, progress);
      // A poor shooter can still heave one in, but it should be a genuine rarity.
      const deepFloor = lifted ? 0.08 : p.weakness.noThree ? 0.004 : 0.08;
      // Lifted: weaknesses off AND the player's own strengths amplified.
      const rawVol = lifted ? p.profile.scoreVolSurge : p.profile.scoreVol;
      // Compress usage so the alpha doesn't swallow a 21-point game. Raw
      // averages come from 11-point games, so using them straight lets the top
      // scorer take ~78% of a longer one; the exponent keeps him clearly first
      // without erasing his teammates.
      const vol = Math.pow(rawVol, USAGE_COMPRESSION);
      const share = lifted ? p.profile.threeShareClean : p.profile.threeShare;
      const base = value === 2 ? vol * (share + deepFloor) : vol;
      // Heat check: each make in a row makes the next one likelier.
      const heat = 1 + p.effects.hotHand * Math.min(4, streak.get(p.id) ?? 0);
      // Mamba: pure volume. Every shot he has taken this game — make or miss —
      // nudges his aggression and his odds up a little further.
      const volume = 1 + p.effects.volumeRamp * Math.min(8, i);
      // A lifted squad plays several notches more aggressively than usual.
      const aggression = 1 + bardBoost;
      // Clutch players want the ball late, and want it most in a tight game.
      const late = Math.max(0, progress - 0.65) / 0.35;
      const clutch = 1 + p.effects.clutch * late * (opts.closeGame ? 1 : 0.4);
      return base * gas * heat * clutch * volume * aggression;
    });
    // Each hot-hand archetype has its own bar: an Inferno visibly catches fire
    // sooner than a Microwave does.
    const runBefore = streak.get(player.id) ?? 0;
    const heated = player.effects.hotHand > 0 && runBefore >= player.effects.heatAt;
    // A streak is consecutive makes and nothing else. The moment somebody else
    // scores, the hot player'''s run is over and his multiplier drops to 1.
    for (const p of players) {
      if (p.id === player.id) streak.set(p.id, (streak.get(p.id) ?? 0) + 1);
      else streak.set(p.id, 0);
    }
    const ev: ScoreEvent = { kind: "score", side, player, value, heated, lifted };
    if (activations.includes(i)) ev.bardStart = true;
    // Pick and roll: a designated roller finishing off a designated passer.
    // Only fires when the team actually has both halves of the pairing.
    const passers = players.filter(
      (p) => p.effects.pnrRole === "passer" && p.id !== player.id
    );
    const isRoll =
      player.effects.pnrRole === "roller" && passers.length > 0 && value === 1 && rand() < 0.45;
    if (isRoll) {
      ev.assister = weightedPick(passers, (p) => p.profile.ast + 0.3);
      ev.pnr = true;
      return ev;
    }
    // A Floor General turns more of the team's possessions into assisted looks.
    const assistBonus = players.reduce((m, p) => Math.max(m, p.effects.assistRate), 0);
    if (rand() < (value === 2 ? 0.3 : 0.38) + assistBonus) {
      const mates = players.filter((p) => p.id !== player.id);
      ev.assister = weightedPick(mates, (p) => p.profile.ast + 0.15);
    }
    return ev;
  });
}

// Plain shuffle-merge for a segment that ends level — nobody's bucket is
// reserved for last, because regulation finishes tied.
function interleave(a: Ev[], b: Ev[]): Ev[] {
  const out: Ev[] = [];
  const x = [...a];
  const y = [...b];
  while (x.length + y.length > 0) {
    if (x.length === 0) out.push(y.shift()!);
    else if (y.length === 0) out.push(x.shift()!);
    else out.push(rand() < x.length / (x.length + y.length) ? x.shift()! : y.shift()!);
  }
  return out;
}

// Interleave winner/loser scoring so the winning bucket is always the last event.
function mergeTimelines(winnerEvents: Ev[], loserEvents: Ev[]): Ev[] {
  const merged: Ev[] = [];
  const w = [...winnerEvents];
  const l = [...loserEvents];
  while (w.length + l.length > 0) {
    if (w.length === 0) {
      merged.push(l.shift()!);
    } else if (l.length === 0 || w.length === 1) {
      // keep the winner's final bucket for the end of the game
      if (l.length > 0) merged.push(l.shift()!);
      else merged.push(w.shift()!);
    } else {
      const fromWinner = rand() < w.length / (w.length + l.length);
      merged.push(fromWinner ? w.shift()! : l.shift()!);
    }
  }
  return merged;
}

// Prefer a template this game hasn't used yet, so a single broadcast never
// repeats the same line twice. `ns` namespaces the bookkeeping only — the
// returned string is always the raw template.
function pickFresh(pool: string[], used: Set<string>, ns = ""): string {
  const unused = pool.filter((t) => !used.has(ns + t));
  const chosen = pick(unused.length > 0 ? unused : pool);
  used.add(ns + chosen);
  return chosen;
}

// Which lifted-line pools suit a player, based on what he is actually good at.
const STYLE_MAP: Record<string, string[]> = {
  big: ["paint_beast", "tank", "rebound_machine", "rebound_hustler"],
  guard: ["shifty", "slithery", "juggernaut"],
  shooter: ["inferno", "microwave", "three_level", "mamba"],
  passer: ["incisive_passer", "floor_general", "pnr_maestro"],
  defender: ["perimeter_lockdown", "perimeter_prison", "rim_protector"],
};

function liftedPoolFor(card: MayhemCard): string[] {
  const ids = new Set(card.strengths.map((s) => s.id));
  const pool: string[] = [];
  for (const [style, markers] of Object.entries(STYLE_MAP)) {
    if (markers.some((m) => ids.has(m))) pool.push(...LIFTED_BY_STYLE[style]);
  }
  return pool.length > 0 ? pool : LIFTED_BY_STYLE.generic;
}

function describe(ev: Ev, tag: (c: MayhemCard) => string, used: Set<string>): string {
  if (ev.kind === "score") {
    const p = tag(ev.player);
    if (ev.pnr && ev.assister) {
      return fill(pickFresh(PNR_LINES, used), { p, a: tag(ev.assister) });
    }
    // Lifted players get lines that suit their game — a paint beast bullies,
    // a guard breaks ankles — rather than one generic hype pool.
    if (ev.lifted && !ev.assister) {
      return fill(pickFresh(liftedPoolFor(ev.player), used, "lift:"), { p });
    }
    if (ev.assister) {
      const a = tag(ev.assister);
      return fill(pickFresh(ev.value === 2 ? ASSISTED_TWOS : ASSISTED_ONES, used), { p, a });
    }
    // No-jumper players only ever finish inside, so they get their own pool.
    const onePool = ev.player.weakness.interiorOnly ? INTERIOR_FINISHES : ONE_POINTERS;
    return fill(pickFresh(ev.value === 2 ? TWO_POINTERS : onePool, used), { p });
  }
  const p = tag(ev.player);
  if (ev.kind === "stl") return fill(pickFresh(STEALS, used), { p });
  if (ev.kind === "blk") return fill(pickFresh(BLOCKS, used), { p });
  if (ev.kind === "reb") return fill(pickFresh(BOARDS, used), { p });
  if (ev.kind === "strength" && ev.bardCall) {
    return fill(pickFresh(BARD_ACTIVATION, used, "bardcall:"), { p: tag(ev.player) });
  }
  if (ev.kind === "strength" && ev.strength) {
    const ns = `${ev.side}:${ev.player.id}:${ev.strength.id} `;
    return fill(pickFresh(ev.strength.lines, used, ns), { p });
  }
  if (ev.kind === "flaw") {
    // Scope per player so two players sharing a weakness don't starve each
    // other of lines, and so the same card on both benches stays distinct.
    const ns = `${ev.side}:${ev.player.id} `;
    return fill(pickFresh(ev.player.weakness.lines, used, ns), { p });
  }
  return fill(pickFresh(MISSES, used), { p });
}

// Glue Guys lift their teammates, and a Chaos takeover turns one player
// unguardable for the night. Cards are cloned so the shared pool is never
// mutated — ids and names are preserved so box scores still line up.
function effectiveTeam(team: MayhemTeam): MayhemTeam {
  const glue = team.players.reduce((g, p) => Math.max(g, p.effects.glue), 0);
  const glueSource = team.players.find((p) => p.effects.glue > 0);
  const players = team.players.map((card) => {
    let profile = { ...card.profile };
    // The Glue Guy boosts everyone but himself.
    if (glue > 0 && glueSource && card.id !== glueSource.id) {
      const g = 1 + glue;
      profile = {
        ...profile,
        scoreVol: profile.scoreVol * g,
        reb: profile.reb * g,
        ast: profile.ast * g,
        stl: profile.stl * g,
        blk: profile.blk * g,
        fgPct: Math.min(0.65, profile.fgPct * g),
      };
    }
    // Chaos deliberately does NOT touch the profile: his shot tendency stays
    // exactly what it always is. The takeover is handled in the event stream,
    // where he simply takes — and makes — every remaining shot.
    return { ...card, profile };
  });
  return { ...team, players };
}

function poissonish(expected: number): number {
  const base = Math.floor(expected);
  return base + (rand() < expected - base ? 1 : 0);
}

export function simulatePlayoffGame(
  myRaw: MayhemTeam,
  oppRaw: MayhemTeam,
  round: PlayoffRound
): GameResult {
  const target = round === "F" ? 21 : 15;

  // Chaos check first — if it fires, the takeover decides the game outright.
  let chaosCard: MayhemCard | null = null;
  let chaosSide: 0 | 1 | null = null;
  for (const [side, team] of [[0, myRaw], [1, oppRaw]] as [0 | 1, MayhemTeam][]) {
    for (const p of team.players) {
      if (p.effects.chaosChance > 0 && rand() < p.effects.chaosChance) {
        chaosCard = p;
        chaosSide = side;
        break;
      }
    }
    if (chaosCard) break;
  }

  const my = effectiveTeam(myRaw);
  const opp = effectiveTeam(oppRaw);

  // Being the bigger squad is a real but bounded edge.
  const physicalEdge = sizeEdge(myRaw.players, oppRaw.players);
  const pMy = winProbability(
    teamStrength(myRaw.players) + physicalEdge + formNoise(),
    teamStrength(oppRaw.players) + formNoise()
  );
  const won = chaosSide !== null ? chaosSide === 0 : rand() < pMy;

  // A takeover ices the game, so it is never a nailbiter.
  const closeness = chaosSide !== null ? 0.18 : won ? 1 - pMy : pMy;
  let winScore = target;
  let loseScore = loserScore(target, closeness);
  let overtime = false;
  let tieScore = 0;

  if (chaosSide === null && loseScore >= target - 3) {
    const roll = rand();
    if (roll < 0.35) {
      // Regulation ends dead level and the game needs extra time.
      overtime = true;
      tieScore = target;
      const otWin = 2 + Math.floor(rand() * 3); // 2-4
      const otLose = Math.max(0, otWin - 1 - Math.floor(rand() * 2)); // always fewer
      winScore = tieScore + otWin;
      loseScore = tieScore + otLose;
    } else if (roll < 0.7) {
      // Has to be won by two.
      winScore = target + 1 + Math.floor(rand() * 3);
      loseScore = winScore - 2;
    }
  }

  const myScore = won ? winScore : loseScore;
  const oppScore = won ? loseScore : winScore;

  // Drops defense/hustle beats and signature-weakness moments into a segment.
  // `flawBoost` is the +15% bump on how often weaknesses show up on camera.
  const bardSide: 0 | 1 | null = my.players.some((p) => p.effects.bard)
    ? 0
    : opp.players.some((p) => p.effects.bard)
    ? 1
    : null;
  // A Bard fires roughly half the time. When he does, his teammates play
  // without their weaknesses for a 3-5 possession stretch.
  const bardCard =
    bardSide === null
      ? null
      : (bardSide === 0 ? my : opp).players.find((p) => p.effects.bard) ?? null;
  const bardFired = bardCard !== null && rand() < 0.5;
  const bardFor = (side: 0 | 1) => bardFired && side === bardSide;
  // Filled in by the scoring builder so the box score can reflect the surge.
  const myBard = { avgBoost: 0 };
  const oppBard = { avgBoost: 0 };

  const addColour = (
    segment: Ev[],
    flavorCount: number,
    flawCount: number,
    strengthCount: number
  ) => {
    for (let i = 0; i < flavorCount; i++) {
      const side = (rand() < 0.5 ? 0 : 1) as 0 | 1;
      const team = side === 0 ? my : opp;
      const roll = rand();
      const kind = roll < 0.35 ? "reb" : roll < 0.6 ? "stl" : roll < 0.85 ? "blk" : "miss";
      const surge = 1 + (side === 0 ? myBard.avgBoost : oppBard.avgBoost);
      const player = weightedPick(team.players, (p) =>
        kind === "reb" ? p.profile.reb * surge :
        kind === "stl" ? (p.profile.stl + 0.1) * surge :
        kind === "blk" ? (p.profile.blk + 0.05) * surge :
        3 - p.profile.fgPct * 5
      );
      const idx = 1 + Math.floor(rand() * Math.max(1, segment.length - 1));
      segment.splice(Math.min(idx, segment.length), 0, { kind, side, player });
    }
    for (let i = 0; i < flawCount; i++) {
      const side = (rand() < 0.5 ? 0 : 1) as 0 | 1;
      const team = side === 0 ? my : opp;
      // A lifted squad simply doesn't show its flaws for that stretch.
      if (bardFired && side === bardSide && rand() < 0.35) continue;
      // And a player mid-takeover certainly isn't showing his — a "still
      // hunting the first one" line reads absurd next to a perfect night.
      const flawCandidates =
        chaosCard && side === chaosSide
          ? team.players.filter((p) => p.id !== chaosCard.id)
          : team.players;
      if (flawCandidates.length === 0) continue;
      const player = weightedPick(flawCandidates, (p) => p.weakness.flawWeight);
      // Gas-tank flaws belong in the back half, where they'd actually bite.
      const span = Math.max(1, segment.length - 1);
      const idx = player.weakness.stamina
        ? 1 + Math.floor(span * (0.5 + rand() * 0.5))
        : 1 + Math.floor(rand() * span);
      // Never past the final bucket — the game should end on the winning score.
      segment.splice(Math.min(idx, Math.max(1, segment.length - 1)), 0, {
        kind: "flaw",
        side,
        player,
      });
    }
    for (let i = 0; i < strengthCount; i++) {
      const side = (rand() < 0.5 ? 0 : 1) as 0 | 1;
      const team = side === 0 ? my : opp;
      // Takeover-only strengths stay silent unless the takeover is actually
      // happening — otherwise a quiet night would still read like one.
      const isTakingOver = (p: MayhemCard) =>
        !!chaosCard && p.id === chaosCard.id && side === chaosSide;
      const availableFor = (p: MayhemCard) =>
        isTakingOver(p) ? p.strengths : p.strengths.filter((st) => !st.chaosChance);
      const eligible = team.players.filter((p) => availableFor(p).length > 0);
      if (eligible.length === 0) continue;
      // A player mid-takeover dominates the highlight reel.
      const player = weightedPick(eligible, (p) =>
        isTakingOver(p) ? 12 : Math.max(0.5, availableFor(p).length)
      );
      const options = availableFor(player);
      const strength = isTakingOver(player)
        ? options.find((st) => st.chaosChance) ?? pick(options)
        : pick(options);
      const span = Math.max(1, segment.length - 1);
      // Clutch moments belong late; everything else can land anywhere.
      const idx = strength.clutch
        ? 1 + Math.floor(span * (0.7 + rand() * 0.3))
        : 1 + Math.floor(rand() * span);
      segment.splice(Math.min(idx, Math.max(1, segment.length - 1)), 0, {
        kind: "strength",
        side,
        player,
        strength,
      });
    }
  };

  const FLAW_BOOST = 1.15;
  let timeline: Ev[];
  let otTimeline: Ev[] = [];

  const closeGame = closeness > 0.32;
  const chaosFor = (side: 0 | 1) => (chaosSide === side ? chaosCard : null);
  const myOpts = { closeGame, bardActive: bardFor(0), bardOut: myBard, chaosCard: chaosFor(0) };
  const oppOpts = { closeGame, bardActive: bardFor(1), bardOut: oppBard, chaosCard: chaosFor(1) };

  if (overtime) {
    // Regulation: both sides climb to the same number, so it ends level.
    timeline = interleave(
      buildTeamScoreEvents(my, 0, tieScore, myOpts),
      buildTeamScoreEvents(opp, 1, tieScore, oppOpts)
    );
    // Extra time: the winner's bucket has to land last, and it is always tight.
    const otMine = buildTeamScoreEvents(my, 0, myScore - tieScore, { closeGame: true });
    const otTheirs = buildTeamScoreEvents(opp, 1, oppScore - tieScore, { closeGame: true });
    otTimeline = won ? mergeTimelines(otMine, otTheirs) : mergeTimelines(otTheirs, otMine);
    // Top the segment up so extra time always has enough beats to fill 5 ticks.
    const otShort = Math.max(0, 6 - otTimeline.length);
    addColour(otTimeline, 1 + Math.floor(rand() * 2) + otShort, 1, 1 + Math.floor(rand() * 2));
  } else {
    const myEvents = buildTeamScoreEvents(my, 0, myScore, myOpts);
    const oppEvents = buildTeamScoreEvents(opp, 1, oppScore, oppOpts);
    timeline = won ? mergeTimelines(myEvents, oppEvents) : mergeTimelines(oppEvents, myEvents);
  }

  addColour(
    timeline,
    3 + Math.floor(rand() * 4),
    Math.round((3 + Math.floor(rand() * 3)) * FLAW_BOOST),
    4 + Math.floor(rand() * 3)
  );

  // The surge has to be announced BEFORE anything it boosts. Each activation
  // gets its own call-out inserted directly ahead of the possession it starts.
  if (bardFired && bardCard && bardSide !== null) {
    const bardStrength = bardCard.strengths.find((st) => st.bard)!;
    for (let i = timeline.length - 1; i >= 0; i--) {
      const ev = timeline[i];
      if (ev.kind !== "score" || !ev.bardStart || ev.side !== bardSide) continue;
      timeline.splice(i, 0, {
        kind: "strength",
        side: bardSide,
        player: bardCard,
        strength: bardStrength,
        bardCall: true,
      });
    }
  }

  // A takeover is a marquee moment — make sure the feed always shows it.
  if (chaosCard && chaosSide !== null) {
    const chaosStrength = chaosCard.strengths.find((st) => st.chaosChance)!;
    for (let i = 0; i < 2; i++) {
      const span = Math.max(1, timeline.length - 1);
      const idx = 1 + Math.floor(span * (0.35 + rand() * 0.55));
      timeline.splice(Math.min(idx, Math.max(1, timeline.length - 1)), 0, {
        kind: "strength",
        side: chaosSide,
        player: chaosCard,
        strength: chaosStrength,
      });
    }
  }

  // Tag names with their season whenever the same person appears more than
  // once in the game — including twice on the same roster.
  const nameCounts = new Map<string, number>();
  for (const p of [...my.players, ...opp.players]) {
    nameCounts.set(p.name, (nameCounts.get(p.name) ?? 0) + 1);
  }
  const tag = (c: MayhemCard) =>
    (nameCounts.get(c.name) ?? 0) > 1 ? `${c.name} ('${String(c.year).slice(2)})` : c.name;

  // ----- group the timeline into commentary ticks -----
  // Roughly one beat per event, so games run to the mid-20s and every weakness
  // moment gets room to surface. Tip-off counts toward the on-screen total.
  const tickCount = Math.max(15, Math.min(25, Math.round(timeline.length / 1.35)));
  const usedLines = new Set<string>();
  const ticks: Tick[] = [{ myScore: 0, oppScore: 0, text: pickFresh(TIP_OFF, usedLines) }];
  // Keyed by side as well as card, since the same card can legitimately be
  // rostered by both teams — without the side they'd share one stat line.
  const boxes = new Map<string, PlayerBox>();
  const boxKey = (side: 0 | 1, card: MayhemCard) => `${side}:${card.id}`;
  const boxFor = (side: 0 | 1, card: MayhemCard) => {
    const key = boxKey(side, card);
    if (!boxes.has(key)) {
      boxes.set(key, {
        card,
        line: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0 },
      });
    }
    return boxes.get(key)!;
  };
  // make sure every player shows up in the box score even with a quiet game
  my.players.forEach((p) => boxFor(0, p));
  opp.players.forEach((p) => boxFor(1, p));

  let runningMy = 0;
  let runningOpp = 0;
  // Buckets scored during a takeover — these never missed.
  const chaosMakes = new Map<string, number>();

  const emitTicks = (segment: Ev[], count: number, isOt: boolean, isFinalSegment: boolean) => {
    let cursor = 0;
    for (let t = 0; t < count; t++) {
      const remainingTicks = count - t;
      const remainingEvents = segment.length - cursor;
      if (remainingEvents <= 0) break;
      const chunkSize = Math.max(1, Math.round(remainingEvents / remainingTicks));
      const chunk = segment.slice(cursor, cursor + chunkSize);
      cursor += chunkSize;
      if (chunk.length === 0) break;
      const isLastChunk = isFinalSegment && cursor >= segment.length;

      for (const ev of chunk) {
        if (ev.kind === "score") {
          if (ev.side === 0) runningMy += ev.value;
          else runningOpp += ev.value;
          const b = boxFor(ev.side, ev.player);
          b.line.pts += ev.value;
          b.line.fgm += 1;
          if (ev.chaosShot) chaosMakes.set(boxKey(ev.side, ev.player), (chaosMakes.get(boxKey(ev.side, ev.player)) ?? 0) + 1);
          if (ev.value === 2) b.line.tpm += 1;
          if (ev.assister) boxFor(ev.side, ev.assister).line.ast += 1;
        } else {
          const b = boxFor(ev.side, ev.player);
          if (ev.kind === "stl") b.line.stl += 1;
          else if (ev.kind === "blk") b.line.blk += 1;
          else if (ev.kind === "reb") b.line.reb += 1;
          else if (ev.kind === "miss") b.line.fga += 1;
          else if (ev.kind === "strength") {
            // Defensive strengths still show up in the box score.
            if (ev.strength?.blkMult) b.line.blk += 1;
            else if (ev.strength?.stlMult) b.line.stl += 1;
            else if (ev.strength?.rebMult) b.line.reb += 1;
          }
          // "flaw" events are pure narration — turnovers and mental lapses have
          // no box-score column here, and the volume fill below handles attempts.
        }
      }
      // Narrate the most recent action, but give a player's signature weakness
      // priority when one happened in this stretch — those are worth seeing.
      // A Bard call-out always wins its tick: everything it boosts comes after,
      // so it can never be the thing that gets dropped from the broadcast.
      const bardCallEv = chunk.find((e) => e.kind === "strength" && e.bardCall);
      const notable = chunk.filter((e) => e.kind === "flaw" || e.kind === "strength");
      // The game has to end on the winning bucket, never on a turnover.
      const closingScore = isLastChunk
        ? [...chunk].reverse().find((e) => e.kind === "score")
        : undefined;
      const headline =
        bardCallEv ??
        closingScore ??
        (notable.length > 0 && rand() < 0.65 ? pick(notable) : chunk[chunk.length - 1]);
      ticks.push({
        myScore: runningMy,
        oppScore: runningOpp,
        text: describe(headline, tag, usedLines),
        flaw: headline.kind === "flaw",
        strength: headline.kind === "strength",
        heated: headline.kind === "score" && !!headline.heated,
        lifted: headline.kind === "score" && !!headline.lifted,
        ot: isOt || undefined,
      });
    }
  };

  emitTicks(timeline, tickCount, false, !overtime);

  if (overtime) {
    ticks.push({
      myScore: runningMy,
      oppScore: runningOpp,
      text: `Regulation ends level at ${runningMy}—${runningOpp}. We're going to OVERTIME!`,
      ot: true,
    });
    emitTicks(otTimeline, 5, true, true);
  }

  // ----- fill out realistic volume stats around the recorded makes -----
  // Longer games mean more possessions, but sub-linearly — a 21-point finals
  // shouldn't double everyone's rebounds.
  const durationScale = Math.min(1.3, Math.pow((myScore + oppScore) / 22, 0.45));
  for (const [key, box] of boxes.entries()) {
    const { profile } = box.card;
    const l = box.line;
    // A Bard surge lifts everything, not just scoring: boards, steals, blocks
    // and shooting efficiency all ride it for as long as it lasts.
    const surge = key.startsWith("0:") ? myBard.avgBoost : oppBard.avgBoost;
    const surgeMult = 1 + surge;
    // A surge also amplifies the bonus half of the player's own strength
    // multipliers, scaled by how much of the game the surge actually covered.
    const amp = (statMult: number) => {
      if (surge <= 0 || statMult <= 1) return 1;
      const extra = (statMult - 1) * (SURGE_STRENGTH_AMP - 1) * Math.min(1, surge / BARD_PEAK);
      return 1 + extra;
    };
    const { effects } = box.card;
    const missFlavor = l.fga; // only narrated bricks so far
    const takeover = chaosMakes.get(key) ?? 0;
    if (takeover > 0) {
      // Every shot after activation went in, so his only misses are the
      // handful he put up before he caught fire.
      const before = l.fgm - takeover;
      const earlyMisses = poissonish(Math.max(0, before) * 1.6);
      l.fga = l.fgm + earlyMisses + missFlavor;
    } else {
      const volumeFga = poissonish((profile.fgaVol / surgeMult) * durationScale * jitter(0.8, 1.15));
      // hot scoring nights come with hot efficiency — cap the implied volume
      l.fga = Math.max(l.fgm + missFlavor, volumeFga, Math.ceil(l.fgm * 1.8));
    }
    const volumeTpa = poissonish(profile.tpaVol * durationScale * jitter(0.75, 1.2));
    // A player who only shot deep during a lifted stretch has no attempt volume
    // of his own, so give the make a miss or two around it rather than 1-for-1.
    const liftedExtra = l.tpm > 0 && profile.tpaVol < 0.2 ? poissonish(0.9) : 0;
    l.tpa = Math.max(l.tpm + liftedExtra, Math.min(l.fga, volumeTpa));
    l.tpa = Math.min(l.tpa, l.fga);
    l.reb += poissonish(profile.reb * surgeMult * amp(effects.rebMult) * durationScale * jitter(0.7, 1.05));
    l.stl += poissonish(profile.stl * surgeMult * amp(effects.stlMult) * durationScale * 0.7);
    l.blk += poissonish(profile.blk * surgeMult * amp(effects.blkMult) * durationScale * 0.6);
  }

  return {
    won,
    myScore,
    oppScore,
    overtime,
    chaosBy: chaosCard ? { name: chaosCard.name, year: chaosCard.year } : undefined,
    ticks,
    myBox: my.players.map((p) => boxes.get(boxKey(0, p))!),
    oppBox: opp.players.map((p) => boxes.get(boxKey(1, p))!),
  };
}
