// MCBL Mayhem — play-by-play line pools. Every line is "{player} did {action}".
// {p} = the player, {a} = the assister, {t} = the team name.

export const ONE_POINTERS = [
  "{p} finishes a tough layup inside",
  "{p} banks in the mid-range jumper",
  "{p} spins baseline and lays it in",
  "{p} muscles through contact and scores",
  "{p} knocks down the elbow jumper",
  "{p} scoops it home off the drive",
  "{p} sneaks backdoor for an easy bucket",
  "{p} tips in the offensive rebound",
  "{p} floats one over the defense",
  "{p} cashes the pull-up jumper",
  "{p} eurosteps through traffic for the finish",
  "{p} drops the baby hook in the post",
  "{p} snakes to the rim and finishes",
  "{p} gets the friendly roll on a tough runner",
];

// Scoring lines for players with no jumper at all — every bucket comes at the
// rim, so none of these can mention a jump shot.
export const INTERIOR_FINISHES = [
  "{p} finishes it right at the rim",
  "{p} muscles it in close",
  "{p} lays it in off the glass",
  "{p} backs his man down and finishes",
  "{p} tips in the miss",
  "{p} finishes through contact inside",
  "{p} seals his man and drops it in",
  "{p} catches it deep and goes straight up with it",
  "{p} cleans up the offensive glass",
  "{p} bullies his way to the rim and converts",
];

export const TWO_POINTERS = [
  "{p} drills a deep three!",
  "{p} splashes one from way downtown!",
  "{p} pulls up from distance… BANG!",
  "{p} lets it fly from the logo — GOOD!",
  "{p} is heating up from beyond the arc!",
  "{p} sidesteps into a smooth triple!",
  "{p} answers with a dagger three!",
  "{p} rises and buries the deep ball!",
  "{p} banks in a prayer from deep!",
  "{p} catches and shoots — nothing but net!",
];

export const ASSISTED_ONES = [
  "{a} finds {p} cutting for the easy finish",
  "{a} threads the needle to {p} for the score",
  "{p} scores off a slick dime from {a}",
  "{a} kicks it to {p} who lays it home",
  "{a} lobs it up and {p} finishes strong",
];

export const ASSISTED_TWOS = [
  "{a} swings it to {p} — SPLASH from deep!",
  "{p} spots up off {a}'s feed and drains the triple!",
  "{a} drives and kicks to {p} for a wide-open three!",
];

export const STEALS = [
  "{p} picks the pocket clean!",
  "{p} jumps the passing lane for the steal!",
  "{p} strips it away at half court!",
  "{p} reads the pass and takes it the other way!",
];

export const BLOCKS = [
  "{p} swats it into next week!",
  "{p} says NOT TODAY with a huge rejection!",
  "{p} pins it off the backboard!",
  "{p} meets him at the summit — denied!",
];

export const BOARDS = [
  "{p} rips down a monster rebound",
  "{p} owns the glass on that possession",
  "{p} skies over everyone for the board",
  "{p} keeps the possession alive with a hustle rebound",
];

export const MISSES = [
  "{p} bricks a deep heat check",
  "{p} rims out from three",
  "{p} forces one up — no good",
  "{p} loses the handle on the iso",
];


// Only fires while a Bard surge is running, and only AFTER the announcement.
// Split by playstyle so the surge reads like that player finally getting to do
// the thing he is built for, rather than a generic hype line.
export const LIFTED_BY_STYLE: Record<string, string[]> = {
  // Bigs: paint beasts, tanks, rebounders
  big: [
    "{p} plucks the shot clean out of the air on the way up",
    "{p} backs his man halfway into the benches off one bump and lays it in",
    "{p} rips the board away with one hand and goes straight back up with it",
    "{p} seals his man under the rim and simply will not be moved",
    "{p} catches it deep, turns, and dunks the will out of the defense",
    "{p} bodies two defenders off the block and finishes anyway",
    "{p} grabs it over everyone and puts it straight back in their faces",
    "{p} plants himself in the paint and dares anyone to move him",
  ],
  // Ball handlers and small guards
  guard: [
    "{p} breaks his defender's ankles and strolls in for the finish",
    "{p} puts him in a blender and leaves him on the floor",
    "{p} crosses him so hard the help defender flinches too",
    "{p} snatches the crossover back and is gone before anyone reacts",
    "{p} splits all three defenders like they were cones",
    "{p} hesitates, goes, and the defender is still standing where he was",
    "{p} shakes him clean out of his shoes and finishes untouched",
  ],
  // Shooters
  shooter: [
    "{p} pulls from four feet behind the line without a second thought",
    "{p} lets it go before his feet are even set — and it is pure",
    "{p} shoots it over an outstretched hand like the defender isn't there",
    "{p} steps into one from the parking lot and buries it",
    "{p} fires off the catch with zero hesitation and drills it",
    "{p} is shooting from anywhere he wants right now",
  ],
  // Creators and passers
  passer: [
    "{p} throws a pass that had no business being completed",
    "{p} sees the play two possessions before anyone else does",
    "{p} wraps it around the defender's back to the cutter",
    "{p} whips it cross-court on a rope for the open look",
    "{p} conducts the whole possession and it ends exactly how he wanted",
  ],
  // Defenders
  defender: [
    "{p} is guarding all three of them at once right now",
    "{p} swallows the drive whole and takes it the other way",
    "{p} meets him at the rim and sends it into the fence",
    "{p} has completely shut down that entire side of the floor",
    "{p} jumps the lane like he knew the play call",
  ],
  // Anyone without a strong archetype
  generic: [
    "{p} attacks the rim with a confidence he does not normally have",
    "{p} goes straight at his defender instead of backing out — and finishes",
    "{p} is playing like a completely different player right now",
    "{p} demands the ball and takes it right through the contact",
    "{p} plays way above himself and finishes over two defenders",
    "{p} hunts his shot for once, and it pays off",
    "{p} is unrecognisable right now — completely off the leash",
  ],
};

// The moment the surge kicks in — everything after this is boosted.
export const BARD_ACTIVATION = [
  "{p} erupts on the sideline and the whole squad catches fire!",
  "{p} screams something at his teammates and something visibly changes!",
  "{p} has this team believing — they are playing free now!",
  "{p} whips the whole squad into a frenzy!",
  "{p} lights a fire under this team and you can see it take hold!",
];

// Two-man game between a designated passer and roller.
export const PNR_LINES = [
  "{a} turns the corner off the screen and drops it to {p} for the finish",
  "{a} and {p} run the pick and roll to perfection",
  "{a} draws both defenders and slips it to {p} rolling free",
  "{p} rolls hard off {a}'s screen and finishes at the rim",
  "{a} rejects the screen, re-attacks, and finds {p} on the roll",
  "{a} and {p} play two-man basketball and the defense has no answer",
];

export const TIP_OFF = [
  "Both squads at the line — here we go!",
  "The ball is up and MCBL Mayhem is underway!",
  "Check ball. Winners stay on.",
];

export const CLUTCH = [
  "{p} wants the ball with the game on the line…",
  "Crunch time — {t} tightens up on defense…",
  "You can feel the tension at the park…",
];

export function fill(
  template: string,
  vars: { p?: string; a?: string; t?: string }
): string {
  return template
    .replace(/\{p\}/g, vars.p ?? "")
    .replace(/\{a\}/g, vars.a ?? "")
    .replace(/\{t\}/g, vars.t ??  "");
}
