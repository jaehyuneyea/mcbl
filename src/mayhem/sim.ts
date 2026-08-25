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
import type { Strength } from "./strengths";
import {
  ASSISTED_ONES, ASSISTED_TWOS, BLOCKS, BOARDS, INTERIOR_FINISHES, MISSES,
  ONE_POINTERS, STEALS, TIP_OFF, TWO_POINTERS, fill,
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
};
type FlavorEvent = {
  kind: "stl" | "blk" | "reb" | "miss" | "flaw" | "strength";
  side: 0 | 1;
  player: MayhemCard;
  strength?: Strength;
};
type Ev = ScoreEvent | FlavorEvent;

function buildTeamScoreEvents(
  team: MayhemTeam,
  side: 0 | 1,
  total: number,
  opts: { closeGame?: boolean; bardPossessions?: number | null } = {}
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
  const windowFrac = opts.bardPossessions
    ? Math.min(0.6, opts.bardPossessions / Math.max(4, total))
    : 0;
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

  // The Bard window covers a run of consecutive possessions somewhere in the
  // sequence; we can only place it now that the event count is known.
  const bardWindow = (() => {
    const n = opts.bardPossessions ?? 0;
    if (!n || values.length === 0) return null;
    const start = Math.floor(rand() * Math.max(1, values.length - n));
    return { start, end: start + n - 1 };
  })();

  return values.map((value, i) => {
    // Stamina bites as the game wears on: fading players take fewer of the
    // late buckets, and Rayan-types front-load their whole night.
    const progress = values.length > 1 ? i / (values.length - 1) : 0;
    // Inside a Bard window the squad's weaknesses stop applying, so even the
    // no-jumper players can let one go and nobody fades.
    const w = bardWindow;
    const lifted = !!w && i >= w.start && i <= w.end;
    // Deep balls can only come from players who actually have a jump shot.
    const candidates = lifted || shooters.length === 0 ? players : value === 2 ? shooters : players;
    const player = weightedPick(candidates, (p) => {
      // "Never tired" ignores the fade entirely, which is a real edge late on.
      const gas = lifted || p.effects.neverTired ? 1 : staminaFactor(p.weakness.stamina, progress);
      // A poor shooter can still heave one in, but it should be a genuine rarity.
      const deepFloor = lifted ? 0.08 : p.weakness.noThree ? 0.004 : 0.08;
      const vol = lifted ? p.profile.scoreVolClean : p.profile.scoreVol;
      const share = lifted ? p.profile.threeShareClean : p.profile.threeShare;
      const base = value === 2 ? vol * (share + deepFloor) : vol;
      // Heat check: each make in a row makes the next one likelier.
      const heat = 1 + p.effects.hotHand * Math.min(4, streak.get(p.id) ?? 0);
      // Clutch players want the ball late, and want it most in a tight game.
      const late = Math.max(0, progress - 0.65) / 0.35;
      const clutch = 1 + p.effects.clutch * late * (opts.closeGame ? 1 : 0.4);
      return base * gas * heat * clutch;
    });
    // Each hot-hand archetype has its own bar: an Inferno visibly catches fire
    // sooner than a Microwave does.
    const runBefore = streak.get(player.id) ?? 0;
    const heated = player.effects.hotHand > 0 && runBefore >= player.effects.heatAt;
    // Update streaks: the scorer heats up, everyone else cools off.
    for (const p of players) {
      if (p.id === player.id) streak.set(p.id, (streak.get(p.id) ?? 0) + 1);
      else streak.set(p.id, Math.max(0, (streak.get(p.id) ?? 0) - 1));
    }
    const ev: ScoreEvent = { kind: "score", side, player, value, heated };
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

function describe(ev: Ev, tag: (c: MayhemCard) => string, used: Set<string>): string {
  if (ev.kind === "score") {
    const p = tag(ev.player);
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
function effectiveTeam(team: MayhemTeam, chaosId: string | null): MayhemTeam {
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
    if (chaosId && card.id === chaosId) {
      // Prime-Curry mode: unguardable, and the range restriction is lifted.
      profile = {
        ...profile,
        scoreVol: profile.scoreVol * 7 + 6,
        threeShare: 0.45,
        fgPct: 0.65,
        fgaVol: Math.max(profile.fgaVol, 12),
        tpaVol: Math.max(profile.tpaVol, 8),
      };
    }
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

  const my = effectiveTeam(myRaw, chaosSide === 0 ? chaosCard!.id : null);
  const opp = effectiveTeam(oppRaw, chaosSide === 1 ? chaosCard!.id : null);

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
  const bardLength = 3 + Math.floor(rand() * 3); // 3-5 possessions
  const bardFor = (side: 0 | 1) => (bardFired && side === bardSide ? bardLength : null);

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
      const player = weightedPick(team.players, (p) =>
        kind === "reb" ? p.profile.reb :
        kind === "stl" ? p.profile.stl + 0.1 :
        kind === "blk" ? p.profile.blk + 0.05 :
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
      const player = weightedPick(team.players, (p) => p.weakness.flawWeight);
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
  const myOpts = { closeGame, bardPossessions: bardFor(0) };
  const oppOpts = { closeGame, bardPossessions: bardFor(1) };

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

  // If the Bard lifted the squad, say so — the effect is invisible otherwise.
  if (bardFired && bardCard && bardSide !== null) {
    const span = Math.max(1, timeline.length - 1);
    const idx = 1 + Math.floor(span * (0.2 + rand() * 0.5));
    timeline.splice(Math.min(idx, Math.max(1, timeline.length - 1)), 0, {
      kind: "strength",
      side: bardSide,
      player: bardCard,
      strength: bardCard.strengths.find((st) => st.bard)!,
    });
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
      const notable = chunk.filter((e) => e.kind === "flaw" || e.kind === "strength");
      // The game has to end on the winning bucket, never on a turnover.
      const closingScore = isLastChunk
        ? [...chunk].reverse().find((e) => e.kind === "score")
        : undefined;
      const headline =
        closingScore ??
        (notable.length > 0 && rand() < 0.65 ? pick(notable) : chunk[chunk.length - 1]);
      ticks.push({
        myScore: runningMy,
        oppScore: runningOpp,
        text: describe(headline, tag, usedLines),
        flaw: headline.kind === "flaw",
        strength: headline.kind === "strength",
        heated: headline.kind === "score" && !!headline.heated,
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
  for (const box of boxes.values()) {
    const { profile } = box.card;
    const l = box.line;
    const missFlavor = l.fga; // only narrated bricks so far
    const volumeFga = poissonish(profile.fgaVol * durationScale * jitter(0.8, 1.15));
    // hot scoring nights come with hot efficiency — cap the implied volume
    l.fga = Math.max(l.fgm + missFlavor, volumeFga, Math.ceil(l.fgm * 1.8));
    const volumeTpa = poissonish(profile.tpaVol * durationScale * jitter(0.75, 1.2));
    // A player who only shot deep during a lifted stretch has no attempt volume
    // of his own, so give the make a miss or two around it rather than 1-for-1.
    const liftedExtra = l.tpm > 0 && profile.tpaVol < 0.2 ? poissonish(0.9) : 0;
    l.tpa = Math.max(l.tpm + liftedExtra, Math.min(l.fga, volumeTpa));
    l.tpa = Math.min(l.tpa, l.fga);
    l.reb += poissonish(profile.reb * durationScale * jitter(0.7, 1.05));
    l.stl += poissonish(profile.stl * durationScale * 0.7);
    l.blk += poissonish(profile.blk * durationScale * 0.6);
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
