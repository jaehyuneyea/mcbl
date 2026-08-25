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
