import { useEffect, useState } from "react";
import { fetchGameData } from "../hooks/PlayerData";
import {
  buildPlayerPool,
  generateOpponent,
  teamNameFor,
  type MayhemCard,
  type MayhemTeam,
} from "../mayhem/engine";
import {
  simulatePlayoffGame,
  simulateSeason,
  type GameResult,
  type PlayoffRound,
  type SeasonGame,
} from "../mayhem/sim";
import {
  BigButton,
  BoxScoreTable,
  DraftCard,
  MiniPlayer,
  TeamFaces,
  TeamTraits,
  yearTag,
} from "../mayhem/MayhemShared";

const ROUND_LABEL: Record<PlayoffRound, string> = {
  QF: "Quarterfinals",
  SF: "Semifinals",
  F: "Finals",
};
const NEXT_ROUND: Record<PlayoffRound, PlayoffRound | null> = { QF: "SF", SF: "F", F: null };

type Phase = "loading" | "intro" | "draft" | "season" | "playoffs" | "champion" | "eliminated";

type PlayoffHistoryEntry = { round: PlayoffRound; oppName: string; result: GameResult };

type PlayoffState = {
  round: PlayoffRound;
  opponent: MayhemTeam;
  stage: "matchup" | "live" | "final";
  result: GameResult | null;
  history: PlayoffHistoryEntry[];
};

function dealOptions(pool: MayhemCard[], picked: MayhemCard[]): MayhemCard[] {
  // Keyed on the card rather than the person: you can roster Jirah '''23 and
  // Jirah '''26 together, you just can'''t draft the exact same card twice.
  const taken = new Set(picked.map((p) => p.id));
  const options: MayhemCard[] = [];
  let guard = 0;
  while (options.length < 3 && guard++ < 800) {
    const card = pool[Math.floor(Math.random() * pool.length)];
    if (taken.has(card.id)) continue;
    taken.add(card.id);
    options.push(card);
  }
  return options;
}

function StepTracker({ phase }: { phase: Phase }) {
  const steps = ["Draft", "Season", "Playoffs"];
  const activeIndex =
    phase === "draft" ? 0 : phase === "season" ? 1 : phase === "intro" || phase === "loading" ? -1 : 2;
  return (
    <div className="flex items-center justify-center gap-2">
      {steps.map((step, i) => (
        <div key={step} className="flex items-center gap-2">
          {i > 0 && <div className="w-8 h-px bg-gray-300" />}
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              i === activeIndex
                ? "bg-gray-800 text-white"
                : i < activeIndex
                ? "bg-gray-300 text-gray-600"
                : "bg-white border border-gray-200 text-gray-400"
            }`}
          >
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Mayhem() {
  const [pool, setPool] = useState<MayhemCard[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");

  // draft
  const [picks, setPicks] = useState<MayhemCard[]>([]);
  const [options, setOptions] = useState<MayhemCard[]>([]);
  const [rerolls, setRerolls] = useState(3);
  const [pending, setPending] = useState<MayhemCard | null>(null);

  // season + playoffs
  const [myTeam, setMyTeam] = useState<MayhemTeam | null>(null);
  const [season, setSeason] = useState<SeasonGame[] | null>(null);
  const [revealedGames, setRevealedGames] = useState(0);
  const [po, setPo] = useState<PlayoffState | null>(null);
  const [revealedTicks, setRevealedTicks] = useState(0);
  const [usedNames] = useState(() => new Set<string>());

  useEffect(() => {
    let cancelled = false;
    fetchGameData("all")
      .then((games) => buildPlayerPool(games))
      .then((cards) => {
        if (cancelled) return;
        setPool(cards);
        setPhase((p) => (p === "loading" ? "intro" : p));
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoadError("Couldn't load MCBL history. Check your connection and refresh.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // reveal regular-season results one by one
  useEffect(() => {
    if (phase !== "season" || !season || revealedGames >= season.length) return;
    const id = setInterval(() => setRevealedGames((n) => Math.min(n + 1, season.length)), 650);
    return () => clearInterval(id);
  }, [phase, season, revealedGames]);

  // reveal playoff commentary tick by tick
  useEffect(() => {
    if (!po || po.stage !== "live" || !po.result) return;
    const total = po.result.ticks.length;
    if (revealedTicks >= total) {
      setPo((prev) => (prev && prev.stage === "live" ? { ...prev, stage: "final" } : prev));
      return;
    }
    const id = setInterval(() => setRevealedTicks((n) => Math.min(n + 1, total)), 1700);
    return () => clearInterval(id);
  }, [po, revealedTicks]);

  const startDraft = () => {
    if (!pool) return;
    usedNames.clear();
    setPicks([]);
    setRerolls(3);
    setPending(null);
    setMyTeam(null);
    setSeason(null);
    setRevealedGames(0);
    setPo(null);
    setRevealedTicks(0);
    setOptions(dealOptions(pool, []));
    setPhase("draft");
  };

  const confirmPick = () => {
    if (!pool || !pending) return;
    const newPicks = [...picks, pending];
    setPending(null);
    setPicks(newPicks);
    if (newPicks.length === 3) {
      setMyTeam({ name: teamNameFor(newPicks, usedNames), players: newPicks });
      setPhase("season");
    } else {
      setOptions(dealOptions(pool, newPicks));
    }
  };

  const reroll = () => {
    if (!pool || rerolls <= 0) return;
    setRerolls(rerolls - 1);
    setOptions(dealOptions(pool, picks));
  };

  const runSeason = () => {
    if (!pool || !myTeam) return;
    setSeason(simulateSeason(myTeam, pool, usedNames));
    setRevealedGames(0);
  };

  const enterPlayoffs = () => {
    if (!pool || !myTeam) return;
    setPo({
      round: "QF",
      opponent: generateOpponent(pool, "QF", usedNames, new Set(myTeam.players.map((p) => p.id))),
      stage: "matchup",
      result: null,
      history: [],
    });
    setRevealedTicks(0);
    setPhase("playoffs");
  };

  const tipOff = () => {
    if (!myTeam || !po) return;
    const result = simulatePlayoffGame(myTeam, po.opponent, po.round);
    setRevealedTicks(1);
    setPo({
      ...po,
      stage: "live",
      result,
      history: [...po.history, { round: po.round, oppName: po.opponent.name, result }],
    });
  };

  const advance = () => {
    if (!pool || !po || !po.result || !myTeam) return;
    if (!po.result.won) {
      setPhase("eliminated");
      return;
    }
    const next = NEXT_ROUND[po.round];
    if (!next) {
      setPhase("champion");
      return;
    }
    setRevealedTicks(0);
    setPo({
      round: next,
      opponent: generateOpponent(pool, next, usedNames, new Set(myTeam.players.map((p) => p.id))),
      stage: "matchup",
      result: null,
      history: po.history,
    });
  };

  const seasonRecord = season
    ? `${season.filter((g) => g.won).length} – ${season.filter((g) => !g.won).length}`
    : "";

  // ---------- screens ----------

  if (loadError) {
    return (
      <Shell phase={phase}>
        <div className="text-center py-16 text-red-500 font-medium">{loadError}</div>
      </Shell>
    );
  }

  if (phase === "loading" || !pool) {
    return (
      <Shell phase={phase}>
        <div className="flex items-center justify-center py-24">
          <span className="animate-pulse text-sm text-text-tertiary">
            Loading every MCBL season ever played…
          </span>
        </div>
      </Shell>
    );
  }

  if (phase === "intro") {
    return (
      <Shell phase={phase}>
        <div className="flex flex-col items-center gap-8 py-10 text-center">
          <div>
            <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-800 tracking-tight">
              MCBL MAYHEM
            </h1>
            <p className="mt-3 text-gray-500 font-medium max-w-xl mx-auto">
              Draft a fantasy squad from every version of every player in MCBL history, then take
              them on a championship run.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4 w-full max-w-3xl">
            {[
              ["1 · Draft", "Pick 3 players from randomized trios of past-season cards. You get 3 rerolls — use them wisely."],
              ["2 · Season", "Your squad grinds a 6-game regular season against the rest of the league."],
              ["3 · Playoffs", "Quarterfinals, Semis, Finals. Every round gets tougher. Win it all for the trophy."],
            ].map(([title, body]) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 text-left">
                <div className="text-sm font-bold text-text-secondary uppercase tracking-wider">{title}</div>
                <p className="mt-1.5 text-sm text-gray-500">{body}</p>
              </div>
            ))}
          </div>
          <BigButton onClick={startDraft}>Start the Draft →</BigButton>
        </div>
      </Shell>
    );
  }

  if (phase === "draft") {
    return (
      <Shell phase={phase}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-text-secondary">
                Draft — Pick {picks.length + 1} of 3
              </h2>
              <p className="text-sm text-gray-400 font-medium">
                Tap a card to draft that version of the player.
              </p>
            </div>
            <button
              onClick={reroll}
              disabled={rerolls <= 0}
              className="rounded-lg px-5 py-2.5 font-semibold bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              🎲 Reroll{" "}
              <span className="tabular-nums">
                ({rerolls} left)
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {options.map((card) => (
              <DraftCard key={card.id} card={card} onClick={() => setPending(card)} />
            ))}
          </div>

          {picks.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col gap-3">
              <div className="flex items-center gap-6 flex-wrap">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Your squad
                </span>
                {picks.map((p) => (
                  <MiniPlayer key={p.id} card={p} />
                ))}
              </div>
              <TeamTraits cards={picks} />
            </div>
          )}
        </div>

        {pending && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setPending(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm flex flex-col gap-4 max-h-[88vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-text-secondary text-center flex-shrink-0">
                Draft {pending.name} ({yearTag(pending.year)})?
              </h3>
              {/* Scrolls on short screens — a five-strength card is tall */}
              <div className="overflow-y-auto min-h-0">
                <DraftCard card={pending} detailed />
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={() => setPending(null)}
                  className="flex-1 rounded-lg px-4 py-2.5 font-semibold bg-white border border-gray-200 text-gray-500 hover:border-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPick}
                  className="flex-1 rounded-lg px-4 py-2.5 font-semibold bg-gray-800 text-white hover:bg-gray-700 transition"
                >
                  Draft ✓
                </button>
              </div>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  if (phase === "season" && myTeam) {
    const allRevealed = season !== null && revealedGames >= season.length;
    return (
      <Shell phase={phase}>
        <div className="flex flex-col items-center gap-8">
          <div className="text-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Introducing
            </span>
            <h2 className="text-3xl font-extrabold text-gray-800">{myTeam.name}</h2>
          </div>
          <TeamFaces cards={myTeam.players} size="w-20 h-20" />
          <TeamTraits cards={myTeam.players} />

          {!season ? (
            <BigButton onClick={runSeason}>Simulate Regular Season →</BigButton>
          ) : (
            <div className="w-full max-w-md flex flex-col gap-2">
              {season.slice(0, revealedGames).map((g, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-100 shadow-sm px-4 py-2.5 flex items-center justify-between"
                >
                  <span
                    className={`w-6 text-sm font-extrabold ${
                      g.won ? "text-emerald-600" : "text-red-400"
                    }`}
                  >
                    {g.won ? "W" : "L"}
                  </span>
                  <span className="text-sm font-bold tabular-nums text-text-secondary">
                    {g.myScore} – {g.oppScore}
                  </span>
                  <span className="text-sm text-gray-400 font-medium text-right flex-1 ml-4 truncate">
                    vs {g.oppName}
                  </span>
                </div>
              ))}
              {allRevealed && (
                <div className="flex flex-col items-center gap-4 mt-4">
                  <div className="text-center">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
                      Regular season record
                    </span>
                    <div className="text-5xl font-extrabold tabular-nums text-gray-800">
                      {seasonRecord}
                    </div>
                  </div>
                  <BigButton onClick={enterPlayoffs}>Enter the Playoffs →</BigButton>
                </div>
              )}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if (phase === "playoffs" && myTeam && po) {
    const shownTicks = po.result ? po.result.ticks.slice(0, revealedTicks) : [];
    const liveScore = shownTicks.length
      ? shownTicks[shownTicks.length - 1]
      : { myScore: 0, oppScore: 0 };
    return (
      <Shell phase={phase}>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              MCBL Playoffs
            </span>
            <h2 className="text-3xl font-extrabold text-gray-800">{ROUND_LABEL[po.round]}</h2>
          </div>

          {/* scoreboard */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 text-center">
                <div className="text-sm sm:text-base font-bold text-text-secondary truncate">
                  {myTeam.name}
                </div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  You
                </div>
              </div>
              <div className="flex items-center gap-3 text-5xl font-extrabold tabular-nums">
                <span className="text-gray-800">{po.stage === "matchup" ? "–" : liveScore.myScore}</span>
                <span className="text-gray-300 text-2xl font-medium">:</span>
                <span className="text-gray-800">{po.stage === "matchup" ? "–" : liveScore.oppScore}</span>
              </div>
              <div className="flex-1 text-center">
                <div className="text-sm sm:text-base font-bold text-text-secondary truncate">
                  {po.opponent.name}
                </div>
                <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
                  {ROUND_LABEL[po.round]} opponent
                </div>
              </div>
            </div>
          </div>

          {po.stage === "matchup" && (
            <div className="flex flex-col items-center gap-6">
              <div className="grid sm:grid-cols-2 gap-4 w-full">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                    {myTeam.name}
                  </span>
                  <TeamFaces cards={myTeam.players} />
                  <TeamTraits cards={myTeam.players} />
                </div>
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center">
                    {po.opponent.name}
                  </span>
                  <TeamFaces cards={po.opponent.players} />
                  <TeamTraits cards={po.opponent.players} />
                </div>
              </div>
              <BigButton onClick={tipOff}>🏀 Tip Off</BigButton>
            </div>
          )}

          {po.stage !== "matchup" && po.result && (
            <div className="flex flex-col gap-4">
              {po.stage === "live" && (
                <div className="flex justify-center">
                  <button
                    onClick={() => setRevealedTicks(po.result!.ticks.length)}
                    className="text-xs font-semibold text-gray-400 hover:text-gray-600 uppercase tracking-wider"
                  >
                    Skip to final ⏩
                  </button>
                </div>
              )}

              {/* play-by-play feed */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1.5">
                {[...shownTicks].reverse().map((tick, i) => (
                  <div
                    key={shownTicks.length - i}
                    className={`flex items-baseline gap-3 px-2 py-1.5 rounded-lg ${
                      i === 0 && po.stage === "live" ? "bg-gray-50" : ""
                    }`}
                  >
                    <span
                      className={`tabular-nums text-sm font-bold w-14 flex-shrink-0 ${
                        tick.ot
                          ? i === 0
                            ? "text-indigo-600"
                            : "text-indigo-300"
                          : i === 0
                          ? "text-gray-800"
                          : "text-gray-300"
                      }`}
                    >
                      {tick.myScore}–{tick.oppScore}
                      {tick.ot && <span className="ml-1 text-[9px] align-top">OT</span>}
                    </span>
                    <span
                      className={`text-sm ${
                        tick.flaw
                          ? i === 0
                            ? "text-red-600 font-semibold"
                            : "text-red-400 font-medium"
                          : tick.strength || tick.heated
                          ? i === 0
                            ? "text-emerald-600 font-semibold"
                            : "text-emerald-500 font-medium"
                          : i === 0
                          ? "text-text-secondary font-medium"
                          : "text-gray-400"
                      }`}
                    >
                      {/* A bucket the hot hand helped produce */}
                      {tick.heated && (
                        <span title="Heat check — riding a hot streak" className="mr-1">
                          🔥
                        </span>
                      )}
                      {tick.text}
                    </span>
                  </div>
                ))}
              </div>

              {po.stage === "final" && (
                <div className="flex flex-col gap-5">
                  {po.result.chaosBy && (
                    <div className="rounded-xl px-6 py-3 text-center bg-purple-50 border border-purple-200">
                      <span className="text-sm font-extrabold text-purple-700 uppercase tracking-wider">
                        🌀 Chaos — {po.result.chaosBy.name} took the game over
                      </span>
                    </div>
                  )}
                  <div
                    className={`rounded-xl px-6 py-4 text-center font-extrabold text-xl ${
                      po.result.won
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        : "bg-red-50 text-red-500 border border-red-100"
                    }`}
                  >
                    FINAL{po.result.overtime ? " (OT)" : ""} —{" "}
                    {po.result.won ? "You win" : "You lose"} {po.result.myScore} –{" "}
                    {po.result.oppScore}
                  </div>
                  <div className="grid lg:grid-cols-2 gap-4">
                    <BoxScoreTable title={myTeam.name} box={po.result.myBox} highlight />
                    <BoxScoreTable title={po.opponent.name} box={po.result.oppBox} />
                  </div>
                  <div className="flex justify-center">
                    <BigButton onClick={advance}>
                      {!po.result.won
                        ? "Continue"
                        : po.round === "F"
                        ? "🏆 Claim the Trophy"
                        : `Advance to the ${ROUND_LABEL[NEXT_ROUND[po.round]!]} →`}
                    </BigButton>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Shell>
    );
  }

  if ((phase === "champion" || phase === "eliminated") && myTeam && po) {
    const lastGame = po.history[po.history.length - 1];
    return (
      <Shell phase={phase}>
        <div className="flex flex-col items-center gap-7 py-8 text-center">
          {phase === "champion" ? (
            <>
              <div className="text-7xl animate-bounce">🏆</div>
              <div>
                <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-800">
                  MCBL CHAMPIONS!
                </h2>
                <p className="mt-2 text-gray-500 font-medium">
                  The {myTeam.name} take the finals {lastGame?.result.myScore} –{" "}
                  {lastGame?.result.oppScore} over the {lastGame?.oppName}.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="text-6xl">😔</div>
              <div>
                <h2 className="text-4xl font-extrabold text-gray-800">Season Over</h2>
                <p className="mt-2 text-gray-500 font-medium">
                  The {myTeam.name} fall {lastGame?.result.myScore} – {lastGame?.result.oppScore} to
                  the {lastGame?.oppName}, eliminated in the {ROUND_LABEL[po.round]}.
                </p>
              </div>
            </>
          )}

          <TeamFaces cards={myTeam.players} size="w-20 h-20" />
          <TeamTraits cards={myTeam.players} />

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-4 w-full max-w-md flex flex-col gap-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              The run
            </span>
            {season && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Regular season</span>
                <span className="font-bold tabular-nums text-text-secondary">{seasonRecord}</span>
              </div>
            )}
            {po.history.map((h) => (
              <div key={h.round} className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">
                  {ROUND_LABEL[h.round]} vs {h.oppName}
                </span>
                <span
                  className={`font-bold tabular-nums ${
                    h.result.won ? "text-emerald-600" : "text-red-400"
                  }`}
                >
                  {h.result.won ? "W" : "L"} {h.result.myScore}–{h.result.oppScore}
                </span>
              </div>
            ))}
          </div>

          <BigButton onClick={startDraft}>
            {phase === "champion" ? "Run It Back →" : "Try Again →"}
          </BigButton>
        </div>
      </Shell>
    );
  }

  return null;
}

function Shell({ phase, children }: { phase: Phase; children: React.ReactNode }) {
  return (
    <div className="max-w-5xl p-4 mx-auto self-stretch flex flex-col bg-gray-100 min-h-[80vh]">
      <div className="mt-4 mb-6 flex flex-col gap-4">
        <StepTracker phase={phase} />
      </div>
      {children}
    </div>
  );
}
