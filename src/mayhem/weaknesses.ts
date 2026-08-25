// MCBL Mayhem — every player has one blaring weakness.
//
// A weakness does two things: it shaves a little off the player's hidden rating
// and reshapes how they behave in the sim (range, usage, stamina), and it
// unlocks commentary lines nobody else can trigger. The multipliers are
// deliberately gentle — a flaw should cost you games, not make a player unusable.
//
// The wording is an affectionate roast, not a takedown: these are real people.
// The numbers below are the balance knobs; the prose is just flavor.

export type StaminaCurve = "fade" | "earlyBurn";

export type Weakness = {
  label: string; // short badge text on the draft card
  detail: string; // one-line explanation
  ratingMult: number; // hidden overall penalty (0.86 - 0.98)
  noThree?: boolean; // suppresses three-point volume
  interiorOnly?: boolean; // no jumper at all — everything comes at the rim
  soft?: boolean; // shies away from contact in the paint on offense
  scoreMult?: number; // scales scoring usage
  passMult?: number; // scales how often they rack up assists
  stamina?: StaminaCurve;
  flawWeight: number; // relative chance of triggering a flaw event
  lines: string[]; // commentary only this player can produce
};

export const WEAKNESSES: Record<string, Weakness> = {
  "Vincent Kang": {
    label: "Tunnel Vision",
    detail: "Backs himself through any double — the pass is a last resort.",
    ratingMult: 0.95,
    passMult: 0.25,
    flawWeight: 1.5,
    lines: [
      "{p} waves off the open man and takes it on himself",
      "{p} splits the double and forces up a tough one",
      "{p} keeps it on a string — no pass coming this possession",
      "Triple-teamed, and {p} likes his chances anyway",
      "{p} dribbles into traffic and throws up a hopeful one",
    ],
  },
  "Jae Hyune Yea": {
    label: "Shot Selection · Motor",
    detail: "Hunts the tough look, and the legs go on long runs.",
    ratingMult: 0.94,
    stamina: "fade",
    flawWeight: 1.2,
    lines: [
      "{p} settles for a contested stepback with a cutter wide open",
      "{p} pulls the trigger early in the possession — off the mark",
      "{p} takes a breather on the way back down the floor",
      "{p} goes for the hero shot instead of the simple one",
      "{p} is catching his breath at the free throw line",
    ],
  },
  "Rayan Bilkhu": {
    label: "Fast Starter · Soft",
    detail:
      "Empties the tank early, scores only at the rim, and avoids the contact his frame is built for.",
    ratingMult: 0.90,
    noThree: true,
    interiorOnly: true,
    soft: true,
    stamina: "earlyBurn",
    flawWeight: 1.4,
    lines: [
      "{p} came out flying and is paying for it now",
      "{p} is running on empty and waves for a breather",
      "{p} lets his head drop after that one",
      "{p} is taking the slow route back up the floor",
      "{p} gave everything he had in the opening stretch",
      "{p} has the size to go through him and settles for a fade instead",
      "{p} shies away from the contact and loses the ball inside",
      "{p} gets deep position and then backs out of it",
    ],
  },
  "James Lee": {
    label: "No Range · Gets Moved",
    detail: "Lives inside the arc, and bigger bodies back him down.",
    ratingMult: 0.94,
    noThree: true,
    flawWeight: 1.1,
    lines: [
      "{p} tries one from deep — comes up short",
      "{p} gets backed down and can't hold his ground",
      "{p} gets sealed under the rim and concedes the bucket",
      "{p} passes up the open three to drive instead",
    ],
  },
  "Brandon Wong": {
    label: "Still Cooking",
    detail: "Plenty of volume, still waiting on the return.",
    ratingMult: 0.86,
    noThree: true,
    scoreMult: 0.75,
    passMult: 0.4,
    stamina: "fade",
    flawWeight: 2.6,
    lines: [
      "{p} lets another one fly — off the iron",
      "{p} loses the handle on the way up",
      "{p} drifts out of the play again",
      "{p} gets another look up, still hunting the first one",
      "{p} comes up just short from fifteen",
      "{p} calls for it, gets it, and gives it right back",
    ],
  },
  "Jirah Almario": {
    label: "Motor",
    detail: "Elite when fresh, but the legs fade on long runs.",
    ratingMult: 0.96,
    stamina: "fade",
    flawWeight: 0.9,
    lines: [
      "{p} is running on fumes after that stretch",
      "{p} slows it down — the legs have gone",
      "{p} short-arms the jumper on tired legs",
      "{p} could use a breather that isn't coming",
    ],
  },
  "David Chang": {
    label: "No Range",
    detail: "Everything good happens inside the arc.",
    ratingMult: 0.95,
    noThree: true,
    flawWeight: 0.9,
    lines: [
      "{p} steps out to the arc and it isn't close",
      "{p} is left wide open from deep and the defense will live with it",
      "{p} passes up the deep look — knows his spots",
      "{p} tries one from range and draws iron",
    ],
  },
  "Sonny Nguyen": {
    label: "Reads · Footwork",
    detail: "Loses the thread now and then, and the pivot foot wanders.",
    ratingMult: 0.92,
    flawWeight: 1.8,
    lines: [
      "{p} picks up the dribble and takes one extra — travel",
      "{p} shuffles the pivot foot, and the whistle goes",
      "{p} throws it where the cut was supposed to be",
      "{p} loses track of the play for a beat",
      "{p} gathers, hops, and hands it back to the defense",
    ],
  },
  "Nathean Moore": {
    label: "Reads · Hands · Soft",
    detail:
      "Big body and big boards, but the reads come late and he avoids contact in the paint.",
    ratingMult: 0.90,
    noThree: true,
    interiorOnly: true,
    soft: true,
    flawWeight: 1.7,
    lines: [
      "{p} has it slip off his hands and out of bounds",
      "{p} can't corral the easy catch under the rim",
      "{p} runs into his own teammate on the cut",
      "{p} bobbles the rebound away",
      "{p} is turned the wrong way when the pass arrives",
      "{p} has position and size on him, then fades away from the contact",
      "{p} gets bumped once inside and gives up the possession",
      "{p} avoids the body and puts up a soft one instead",
    ],
  },
  "Gabriel Cho": {
    label: "No Range · Gets In His Head",
    detail: "No outside shot, and the misses start to weigh on him.",
    ratingMult: 0.93,
    noThree: true,
    flawWeight: 1.4,
    lines: [
      "{p} misses again and you can see it getting to him",
      "{p} bricks another and starts forcing it",
      "{p} tries one from three and thinks better of it too late",
      "{p} is pressing now — that's three straight",
    ],
  },
  "Lex Rowheder": {
    label: "Passive",
    detail: "Won't pull the trigger, and only scores at the rim.",
    ratingMult: 0.92,
    noThree: true,
    interiorOnly: true,
    scoreMult: 0.85,
    flawWeight: 1.6,
    lines: [
      "{p} is open and passes it up anyway",
      "{p} watches the play develop from the corner",
      "{p} hesitates on the catch and the window shuts",
      "{p} looks to give it up to anyone else",
      "{p} had the lane and kicked it back out",
    ],
  },
  "Brenin Moore": {
    label: "Wears It · Chirps",
    detail: "Gets caught up with his teammates instead of the play.",
    ratingMult: 0.93,
    flawWeight: 1.7,
    lines: [
      "{p} loses it while chirping at his own teammate",
      "{p} is still on about the last possession and gets beat backdoor",
      "{p} throws his hands up rather than getting back",
      "{p} turns it over mid-sentence",
      "{p} stops to complain and it costs them",
    ],
  },
  "Connor Maclean": {
    label: "Motor · No Range",
    detail: "No outside shot, and not much left in the tank.",
    ratingMult: 0.91,
    noThree: true,
    stamina: "fade",
    flawWeight: 1.5,
    lines: [
      "{p} lets one go from deep — not really his shot",
      "{p} is winded and waves the offense on",
      "{p} trails the play, still catching his breath",
      "{p} has hands on knees before the ball crosses half",
    ],
  },
  "Harvir Dhaliwal": {
    label: "No Range · Shot Selection",
    detail: "Takes the tough ones, from the spots he'd rather avoid.",
    ratingMult: 0.93,
    noThree: true,
    flawWeight: 1.4,
    lines: [
      "{p} forces up a three that wasn't there",
      "{p} takes a contested long two with plenty on the clock",
      "{p} passes up the layup for a fadeaway",
      "{p} takes exactly the shot the defense offered him",
    ],
  },
  "Matthew Kim": {
    label: "Motor",
    detail: "Owns the glass, but scores only at the rim and tires late.",
    ratingMult: 0.92,
    noThree: true,
    interiorOnly: true,
    scoreMult: 0.8,
    stamina: "fade",
    flawWeight: 1.5,
    lines: [
      "{p} grabs the offensive board but can't convert the putback",
      "{p} is running low on gas",
      "{p} gets it deep in the paint and gets stuck",
      "{p} muscles into position and can't quite finish",
    ],
  },
};

// Fallback so an unknown name never crashes the sim.
export const DEFAULT_WEAKNESS: Weakness = {
  label: "Streaky",
  detail: "Runs hot and cold with no warning.",
  ratingMult: 0.96,
  flawWeight: 0.8,
  lines: ["{p} forces a tough one and comes up empty"],
};

export function weaknessFor(name: string): Weakness {
  return WEAKNESSES[name] ?? DEFAULT_WEAKNESS;
}

// Stamina multiplier applied to a player's scoring usage as the game wears on.
// progress runs 0 (tip-off) -> 1 (final bucket).
export function staminaFactor(curve: StaminaCurve | undefined, progress: number): number {
  if (!curve) return 1;
  // Burns everything early, then craters.
  if (curve === "earlyBurn") return 1.35 - 0.85 * progress;
  // Steady fade over the course of the game.
  return 1.08 - 0.38 * progress;
}
