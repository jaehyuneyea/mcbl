// MCBL Mayhem — every player also has standout strengths.
//
// Strengths are the mirror of weaknesses: they nudge the hidden rating up,
// reshape behaviour in the sim, and unlock green commentary nobody else can
// trigger. Their job is to let a player pull off the improbable — a bucket
// through three bodies, a block that had no business being made — so the
// play-by-play shows things a pure stat model would never produce.
//
// Archetypes are shared (several players are lockdown defenders), so they live
// in one catalog and each player just lists the ones they have.

export type Strength = {
  id: string;
  label: string;
  detail: string;
  bonus: number; // hidden rating contribution, before diminishing returns

  // --- mechanical hooks (all optional) ---
  hotHand?: number; // each consecutive make raises the next one's odds
  heatAt?: number; // consecutive makes needed before the heat check is visible
  clutch?: number; // extra scoring share late in tight games
  volumeRamp?: number; // aggression grows with every shot, make or miss
  pnr?: boolean; // runs pick and roll (role comes from PNR_ROLES)
  scoreMult?: number; // scoring usage
  passMult?: number; // assist frequency
  assistRate?: number; // raises how often the whole team scores off an assist
  rebMult?: number;
  stlMult?: number;
  blkMult?: number;
  fgPctBoost?: number; // additive shooting efficiency
  neverTired?: boolean; // immune to stamina fade
  glue?: number; // teammates get this much boost to everything
  bard?: boolean; // teammates get momentum after a good play
  chaosChance?: number; // per-game odds of taking the game over entirely
  freeThree?: boolean; // can shoot from deep even if the weakness says otherwise

  lines: string[];
};

export const STRENGTHS: Record<string, Strength> = {
  inferno: {
    id: "inferno",
    label: "Inferno",
    detail: "Every make raises the odds of the next one — and it keeps climbing.",
    bonus: 0.075,
    hotHand: 0.28,
    heatAt: 2,
    lines: [
      "{p} is absolutely scorching — that's another one",
      "{p} cannot miss right now, and he knows it",
      "{p} pulls from range without hesitating — the rim looks enormous",
      "Everything {p} throws at it is falling",
      "{p} has gone supernova and the defense has no answer",
    ],
  },
  microwave: {
    id: "microwave",
    label: "Microwave",
    detail: "Heats up in a hurry once the first one drops.",
    bonus: 0.035,
    hotHand: 0.14,
    heatAt: 4,
    lines: [
      "{p} is heating up in a hurry",
      "{p} buries another — he's found his rhythm",
      "{p} is feeling it now and lets the next one go",
      "That's back-to-back for {p}",
    ],
  },
  clutch: {
    id: "clutch",
    label: "Clutch",
    detail: "Wants the ball when the game is on the line, and closes it out.",
    bonus: 0.08,
    clutch: 0.7,
    lines: [
      "{p} calls for the ball with the game hanging — and delivers",
      "Ice water from {p} when it mattered most",
      "{p} takes the biggest shot of the night and buries it",
      "{p} wanted this moment, and he just closed the door",
    ],
  },
  incisive_passer: {
    id: "incisive_passer",
    label: "Incisive Passer",
    detail: "Finds passing angles that shouldn't exist.",
    bonus: 0.05,
    passMult: 1.55,
    lines: [
      "{p} threads it through two defenders into a window nobody saw",
      "{p} whips a no-look pass to the cutter — how did he see that?",
      "{p} slips it under the outstretched arms for the easy finish",
      "{p} finds the angle the defense swore was closed",
      "{p} bends a pass around the help for an open look",
    ],
  },
  shot_creator: {
    id: "shot_creator",
    label: "Shot Creator",
    detail: "Manufactures a good look out of nothing on iso possessions.",
    bonus: 0.05,
    scoreMult: 1.12,
    lines: [
      "{p} isolates, jabs, and creates something out of nothing",
      "{p} makes a dead possession good all by himself",
      "{p} shakes his man loose and gets exactly the look he wanted",
      "{p} manufactures a clean shot with the clock dying",
    ],
  },
  perimeter_lockdown: {
    id: "perimeter_lockdown",
    label: "Perimeter Lockdown",
    detail: "Very difficult to get by one-on-one.",
    bonus: 0.04,
    stlMult: 1.18,
    lines: [
      "{p} slides his feet perfectly and forces the turnover",
      "{p} smothers the iso — nowhere to go with it",
      "{p} strips it clean without fouling",
      "{p} has completely erased his man this possession",
      "{p} cuts off the drive and forces it back out",
    ],
  },
  perimeter_prison: {
    id: "perimeter_prison",
    label: "Perimeter Prison",
    detail: "Locks his man up so completely the offense stops going that way.",
    bonus: 0.08,
    stlMult: 1.55,
    lines: [
      "{p} has his man so locked up they've stopped running anything at him",
      "{p} takes it off him before the move even develops",
      "{p} suffocates the drive and forces a dead-ball turnover",
      "There is simply no way past {p} tonight",
    ],
  },
  floor_general: {
    id: "floor_general",
    label: "Floor General",
    detail:
      "Runs the offense and turns possessions into easy looks at a much higher rate.",
    bonus: 0.07,
    passMult: 1.35,
    assistRate: 0.16,
    fgPctBoost: 0.02,
    lines: [
      "{p} organises the whole possession and it ends in a clean look",
      "{p} calls the set, moves everyone into place, and it works exactly as drawn",
      "{p} turns a broken possession into an easy two feet from the rim",
      "{p} controls the tempo and gets his team the shot they wanted",
      "{p} manipulates the defense and hands over a wide-open look",
    ],
  },
  efficient: {
    id: "efficient",
    label: "Efficient",
    detail: "Only takes the shots worth taking.",
    bonus: 0.06,
    fgPctBoost: 0.06,
    lines: [
      "{p} waits for the right look and knocks it down",
      "{p} passes on the contested one and takes the clean one instead",
      "{p} hasn't wasted a possession all night",
      "{p} takes exactly the shot the offense was hunting",
    ],
  },
  glue_guy: {
    id: "glue_guy",
    label: "Glue Guy",
    detail: "Molds to whatever the team needs — everyone around him plays better.",
    bonus: 0.06,
    glue: 0.05,
    lines: [
      "{p} makes the little play that keeps the possession alive",
      "{p} does the unglamorous thing that wins the possession",
      "{p} slots into exactly the role this team needed",
      "{p} sets the screen, makes the extra pass, and never shows up in the box score",
    ],
  },
  never_tired: {
    id: "never_tired",
    label: "Never Tired",
    detail: "Runs the same in the last minute as the first.",
    bonus: 0.05,
    neverTired: true,
    lines: [
      "{p} is still sprinting the floor like it's the opening possession",
      "{p} hasn't slowed a step all game",
      "Everyone else is gassed — {p} is still going",
      "{p} beats everyone down the floor again, this late in the game",
    ],
  },
  tank: {
    id: "tank",
    label: "Tank",
    detail: "Immovable in the post, and nobody wants to guard him down there.",
    bonus: 0.07,
    scoreMult: 1.1,
    rebMult: 1.12,
    lines: [
      "{p} backs him all the way down and finishes through the contact",
      "Nobody is moving {p} off that block",
      "{p} absorbs the hit and still gets it to drop",
      "{p} seals deep and there's nothing the defense can do about it",
      "{p} bullies through two bodies to the rim",
    ],
  },
  three_level: {
    id: "three_level",
    label: "3-Level Scorer",
    detail: "Scores from anywhere on the floor, at will.",
    bonus: 0.07,
    scoreMult: 1.12,
    lines: [
      "{p} gets it at the rim, from mid, and from deep — pick your poison",
      "{p} answers from a completely different spot on the floor",
      "{p} is scoring from every level tonight",
      "{p} has no cold zone on this floor right now",
    ],
  },
  juggernaut: {
    id: "juggernaut",
    label: "Juggernaut",
    detail: "Fast and strong — barrels and slithers through traffic alike.",
    bonus: 0.08,
    scoreMult: 1.15,
    lines: [
      "{p} barrels through two defenders and still finishes",
      "{p} slithers through the traffic in the lane untouched",
      "{p} gets downhill and there is nothing anyone can do about it",
      "{p} takes the contact, keeps his balance, and lays it in",
    ],
  },
  rebound_hustler: {
    id: "rebound_hustler",
    label: "Rebound Hustler",
    detail: "Wins boards on effort alone — second and third jumps nobody else makes.",
    bonus: 0.05,
    rebMult: 1.18,
    lines: [
      "{p} beats two bigger bodies to the loose ball on pure effort",
      "{p} goes up a second and third time until it's his",
      "{p} dives on the floor and comes up with it",
      "{p} has no business getting that board, and gets it anyway",
      "{p} out-hustles everyone to the long rebound",
    ],
  },
  paint_beast: {
    id: "paint_beast",
    label: "Paint Beast",
    detail: "Owns the painted area at both ends — nobody wants him down there.",
    bonus: 0.08,
    scoreMult: 1.12,
    rebMult: 1.15,
    blkMult: 1.3,
    lines: [
      "{p} owns the paint on that possession — nobody else was getting near it",
      "{p} clears out the lane and finishes over the top",
      "{p} plants himself in the paint and simply takes it",
      "{p} dominates the interior at both ends on the same trip",
      "{p} makes the paint a no-go zone again",
    ],
  },
  rebound_machine: {
    id: "rebound_machine",
    label: "Rebound Machine",
    detail: "Fights for the ball until it is no longer in play.",
    bonus: 0.06,
    rebMult: 1.25,
    lines: [
      "{p} tips it to himself twice and comes down with it",
      "{p} refuses to let that possession die",
      "{p} rips it away in a crowd of three",
      "{p} keeps it alive, chases it down, and secures it",
      "{p} out-works everyone on the glass again",
    ],
  },
  warrior: {
    id: "warrior",
    label: "Warrior",
    detail: "Wins the physical possessions and plays through contact.",
    bonus: 0.05,
    scoreMult: 1.07,
    lines: [
      "{p} takes the hit and finishes anyway",
      "{p} wins the physical battle and comes up with it",
      "{p} refuses to go down on that drive",
      "{p} fights through the contact for the finish",
    ],
  },
  shifty: {
    id: "shifty",
    label: "Shifty",
    detail: "Gets by his man one-on-one whenever he wants.",
    bonus: 0.05,
    scoreMult: 1.08,
    lines: [
      "{p} crosses him over and he's gone",
      "{p} shakes his defender clean out of the play",
      "{p} changes direction and leaves him standing still",
      "{p} gets by his man like he wasn't even there",
    ],
  },
  rim_protector: {
    id: "rim_protector",
    label: "Rim Protector",
    detail: "A deadly presence at the rim — makes blocks that shouldn't happen.",
    bonus: 0.06,
    blkMult: 1.4,
    lines: [
      "{p} comes from nowhere to erase that at the rim",
      "{p} times it perfectly and sends it back the other way",
      "{p} was beaten on the drive and still recovered to block it",
      "{p} makes them think twice about coming inside again",
      "{p} pins it against the glass — no chance",
    ],
  },
  creative_finisher: {
    id: "creative_finisher",
    label: "Creative Finisher",
    detail: "Converts around the rim at angles most players cannot.",
    bonus: 0.06,
    scoreMult: 1.08,
    fgPctBoost: 0.05,
    lines: [
      "{p} contorts around the help and lays it in off the wrong foot",
      "{p} finishes on the far side of the rim with the defender draped on him",
      "{p} changes hands mid-air and drops it in",
      "{p} finds an angle at the rim that shouldn'''t have been there",
      "{p} hangs, waits out the shot blocker, and finishes soft off the glass",
    ],
  },
  pnr_maestro: {
    id: "pnr_maestro",
    label: "Pick & Roll Maestro",
    detail: "Deadly in the two-man game — lethal when paired with the right partner.",
    bonus: 0.06,
    pnr: true,
    lines: [
      "{p} reads the coverage perfectly out of the two-man game",
      "{p} comes off the screen and picks the defense apart",
      "{p} runs the pick and roll like he'''s done it a thousand times",
      "{p} gets exactly the switch he wanted off the screen",
    ],
  },
  circus: {
    id: "circus",
    label: "Circus",
    detail: "Somehow converts shots that had no business going in.",
    bonus: 0.05,
    scoreMult: 1.06,
    lines: [
      "{p} throws up something ridiculous — and it goes",
      "{p} banks in an absurd one off the wrong foot",
      "{p} falls away, off balance, and somehow drops it",
      "{p} scores it in a way you cannot coach or explain",
    ],
  },
  two_way: {
    id: "two_way",
    label: "Two-Way Player",
    detail: "Reliable on both ends, and each end feeds the other.",
    bonus: 0.07,
    scoreMult: 1.06,
    stlMult: 1.12,
    blkMult: 1.12,
    lines: [
      "{p} gets the stop and immediately turns it into offense",
      "{p} is affecting this game on both ends",
      "{p} makes the defensive play, then finishes the break himself",
      "{p} does it on both ends on the same trip down",
    ],
  },
  mamba: {
    id: "mamba",
    label: "Mamba Mentality",
    detail:
      "Makes the toughest shots on the floor, and the more he fires the more dangerous he gets — make or miss.",
    bonus: 0.095,
    scoreMult: 1.15,
    clutch: 0.9,
    volumeRamp: 0.07,
    lines: [
      "{p} rises through two bodies and drills the toughest shot of the night",
      "{p} takes the contested fadeaway and buries it anyway",
      "{p} wanted the hardest shot available and made it look routine",
      "{p} hits one through traffic that had no right to go in",
    ],
  },
  bard: {
    id: "bard",
    label: "Bard",
    detail:
      "When his energy catches, the whole squad surges — every stat and every tendency spikes 60%, then fades a little each possession until it wears off or he sets it off again.",
    bonus: 0.09,
    bard: true,
    lines: [
      "{p} has the whole team fired up — nobody is playing scared right now",
      "{p} lifts everyone around him and the flaws just melt away",
      "{p} gets in his teammates' ears and suddenly they can do no wrong",
      "{p} brings the energy and the whole squad is playing free",
    ],
  },
  slithery: {
    id: "slithery",
    label: "Slithery",
    detail: "Impossible to hold onto — spins off contact and gets through anyway.",
    bonus: 0.06,
    scoreMult: 1.1,
    lines: [
      "{p} spins right off the contact and slips through",
      "They try to grab {p} and he squirms free anyway",
      "{p} slides out of the double team like he was greased",
      "You cannot get a hold of {p} — through again",
    ],
  },
  chaos: {
    id: "chaos",
    label: "Chaos",
    detail:
      "Roughly once in thirty games he takes over completely — from that moment he shoots every possession and does not miss.",
    bonus: 0.05,
    chaosChance: 1 / 30,
    freeThree: true,
    lines: [
      "{p} pulls from the logo — and it goes. Something has changed.",
      "{p} hits another absurd one. He has not missed in minutes.",
      "{p} is doing things nobody has ever seen him do",
      "{p} cannot be guarded right now and nobody can explain it",
      "{p} drills it again — the whole park is losing its mind",
    ],
  },
};

// Which strengths each player carries.
export const PLAYER_STRENGTHS: Record<string, string[]> = {
  "Jae Hyune Yea": ["inferno", "clutch", "incisive_passer", "shot_creator", "pnr_maestro"],
  "James Lee": ["perimeter_lockdown", "incisive_passer", "efficient", "glue_guy", "never_tired"],
  "Rayan Bilkhu": ["tank", "rebound_hustler", "paint_beast", "pnr_maestro"],
  "Jirah Almario": ["microwave", "three_level", "juggernaut", "shot_creator", "incisive_passer", "pnr_maestro"],
  "Matthew Kim": ["rebound_machine", "perimeter_lockdown", "pnr_maestro"],
  "Sonny Nguyen": ["perimeter_lockdown", "warrior"],
  "David Chang": ["incisive_passer", "perimeter_prison", "floor_general", "shifty", "warrior", "pnr_maestro"],
  "Nathean Moore": ["rebound_machine", "paint_beast", "tank", "circus"],
  "Gabriel Cho": ["two_way", "perimeter_prison", "rim_protector", "never_tired"],
  "Vincent Kang": ["mamba", "microwave", "clutch", "shot_creator", "rim_protector"],
  "Harvir Dhaliwal": ["perimeter_lockdown", "creative_finisher", "bard"],
  "Lex Rowheder": ["slithery", "juggernaut", "rebound_machine"],
  "Brenin Moore": ["microwave", "three_level", "rim_protector", "creative_finisher"],
  "Brandon Wong": ["chaos"],
  "Connor Maclean": ["shot_creator", "glue_guy"],
};

// Who does what in the two-man game. A team only gets the pick-and-roll bonus
// when it has at least one of each.
export const PNR_ROLES: Record<string, "passer" | "roller"> = {
  "Jae Hyune Yea": "passer",
  "David Chang": "passer",
  "Jirah Almario": "passer",
  "Matthew Kim": "roller",
  "Rayan Bilkhu": "roller",
};

export function strengthsFor(name: string): Strength[] {
  return (PLAYER_STRENGTHS[name] ?? []).map((id) => STRENGTHS[id]).filter(Boolean);
}

// Aggregate effect of a player's strengths. Multipliers compound; the rating
// bonus uses diminishing returns so a five-strength player doesn't run away
// with it, and is capped outright.
export type StrengthEffects = {
  ratingMult: number;
  hotHand: number;
  heatAt: number;
  clutch: number;
  volumeRamp: number;
  pnrRole: "passer" | "roller" | null;
  scoreMult: number;
  passMult: number;
  assistRate: number;
  rebMult: number;
  stlMult: number;
  blkMult: number;
  fgPctBoost: number;
  neverTired: boolean;
  glue: number;
  bard: boolean;
  chaosChance: number;
  freeThree: boolean;
};

const DIMINISH = [1, 0.7, 0.5, 0.35, 0.25, 0.2];
const MAX_RATING_MULT = 1.22;

export function effectsOf(list: Strength[], playerName = ""): StrengthEffects {
  const eff: StrengthEffects = {
    ratingMult: 1,
    hotHand: 0,
    heatAt: 99,
    clutch: 0,
    volumeRamp: 0,
    pnrRole: null,
    scoreMult: 1,
    passMult: 1,
    assistRate: 0,
    rebMult: 1,
    stlMult: 1,
    blkMult: 1,
    fgPctBoost: 0,
    neverTired: false,
    glue: 0,
    bard: false,
    chaosChance: 0,
    freeThree: false,
  };
  // Biggest bonuses count fully, later ones progressively less.
  const sorted = [...list].sort((a, b) => b.bonus - a.bonus);
  let bonusTotal = 0;
  sorted.forEach((s, i) => {
    bonusTotal += s.bonus * (DIMINISH[i] ?? 0.15);
  });
  eff.ratingMult = Math.min(MAX_RATING_MULT, 1 + bonusTotal);

  for (const s of list) {
    eff.hotHand = Math.max(eff.hotHand, s.hotHand ?? 0);
    eff.heatAt = Math.min(eff.heatAt, s.heatAt ?? 99);
    eff.clutch = Math.max(eff.clutch, s.clutch ?? 0);
    eff.volumeRamp = Math.max(eff.volumeRamp, s.volumeRamp ?? 0);
    eff.scoreMult *= s.scoreMult ?? 1;
    eff.passMult *= s.passMult ?? 1;
    eff.assistRate = Math.max(eff.assistRate, s.assistRate ?? 0);
    eff.rebMult *= s.rebMult ?? 1;
    eff.stlMult *= s.stlMult ?? 1;
    eff.blkMult *= s.blkMult ?? 1;
    eff.fgPctBoost += s.fgPctBoost ?? 0;
    eff.neverTired = eff.neverTired || !!s.neverTired;
    eff.glue = Math.max(eff.glue, s.glue ?? 0);
    eff.bard = eff.bard || !!s.bard;
    eff.chaosChance = Math.max(eff.chaosChance, s.chaosChance ?? 0);
    eff.freeThree = eff.freeThree || !!s.freeThree;
  }
  if (list.some((s) => s.pnr)) eff.pnrRole = PNR_ROLES[playerName] ?? null;
  return eff;
}
