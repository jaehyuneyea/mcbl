// MCBL Mayhem — end-of-run stat sheet.
//
// Shown once the run is over, win or lose: aggregated totals across every
// playoff game, a round-by-round breakdown, and the MVP of the run.

import type { MayhemCard } from "./engine";
import type { GameResult, PlayerBox, PlayoffRound } from "./sim";
import { PlayerFace, yearTag } from "./MayhemShared";

export type RunGame = { round: PlayoffRound; oppName: string; result: GameResult };

const ROUND_NAME: Record<PlayoffRound, string> = {
  QF: "Quarterfinals",
  SF: "Semifinals",
  F: "Finals",
};

/**
 * Same weighting the Records page uses for its JAH score, so the MVP here is
 * measured the way the rest of the site already measures a performance.
 */
function impactScore(l: PlayerBox["line"]): number {
  return (
    l.pts +
    l.tpm * 2 +
    l.reb * 0.5 +
    l.ast +
    l.blk * 1.5 +
    l.stl * 1.5 -
    (l.fga - l.fgm) * 0.5
  );
}

type Totals = PlayerBox["line"] & { gp: number };

function aggregate(history: RunGame[]) {
  const byId = new Map<string, { card: MayhemCard; totals: Totals }>();
  for (const g of history) {
    for (const { card, line } of g.result.myBox) {
      if (!byId.has(card.id)) {
        byId.set(card.id, {
          card,
          totals: { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, gp: 0 },
        });
      }
      const t = byId.get(card.id)!.totals;
      t.gp += 1;
      t.pts += line.pts;
      t.reb += line.reb;
      t.ast += line.ast;
      t.stl += line.stl;
      t.blk += line.blk;
      t.fgm += line.fgm;
      t.fga += line.fga;
      t.tpm += line.tpm;
      t.tpa += line.tpa;
    }
  }
  return [...byId.values()].map((e) => ({ ...e, impact: impactScore(e.totals) }));
}

/** Per-game average, which is what a playoff stat line should read as. */
function avg(total: number, gp: number): string {
  return gp > 0 ? (total / gp).toFixed(1) : "0.0";
}

function StatHead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="bg-gray-200 text-gray-600 text-[11px] font-semibold uppercase tracking-wider">
        <th className="px-3 py-2 text-left">Player</th>
        {cols.map((c) => (
          <th key={c} className="px-2 py-2 text-right">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function RunSummary({ history }: { history: RunGame[] }) {
  if (history.length === 0) return null;
  const rows = aggregate(history).sort((a, b) => b.impact - a.impact);
  const mvp = rows[0];
  const gp = history.length;
  const per = (total: number) => (total / mvp.totals.gp).toFixed(1);

  return (
    <div className="w-full flex flex-col gap-6 text-left">
      {/* MVP of the run */}
      <div className="bg-white rounded-xl border border-yellow-200 shadow-sm px-5 py-4">
        <div className="flex items-center gap-4">
          <PlayerFace name={mvp.card.name} className="w-16 h-16" />
          <div className="flex-1">
            <div className="text-[11px] font-bold text-yellow-600 uppercase tracking-widest">
              🏅 Playoff MVP
            </div>
            <div className="text-xl font-bold text-text-secondary leading-tight">
              {mvp.card.name}{" "}
              <span className="text-gray-400 font-semibold">{yearTag(mvp.card.year)}</span>
            </div>
            <div className="text-xs text-gray-500 font-medium mt-0.5 tabular-nums">
              {per(mvp.totals.pts)} PPG · {per(mvp.totals.reb)} RPG · {per(mvp.totals.ast)} APG ·{" "}
              {per(mvp.totals.stl)} SPG · {per(mvp.totals.blk)} BPG
            </div>
          </div>
        </div>
      </div>

      {/* Aggregated across the whole run */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Playoff Averages — {gp} {gp === 1 ? "game" : "games"}
        </span>
        <div className="overflow-x-auto rounded-lg border border-gray-100">
          <table className="table-auto w-full bg-white">
            <StatHead cols={["GP", "PPG", "RPG", "APG", "SPG", "BPG", "FG", "3PT", "IMPACT"]} />
            <tbody className="divide-y divide-gray-100">
              {rows.map(({ card, totals, impact }) => (
                <tr key={card.id} className="text-sm even:bg-white odd:bg-gray-50">
                  <td className="px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">
                    {card.name} <span className="text-gray-400">{yearTag(card.year)}</span>
                    {card.id === mvp.card.id && (
                      <span className="ml-2 rounded bg-yellow-300 px-1 text-[10px] font-bold text-yellow-900">
                        MVP
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-gray-400">{totals.gp}</td>
                  <td className="px-2 py-2 text-right tabular-nums font-bold text-text-primary">
                    {avg(totals.pts, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                    {avg(totals.reb, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                    {avg(totals.ast, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                    {avg(totals.stl, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-primary">
                    {avg(totals.blk, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-tertiary">
                    {avg(totals.fgm, totals.gp)}-{avg(totals.fga, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums text-text-tertiary">
                    {avg(totals.tpm, totals.gp)}-{avg(totals.tpa, totals.gp)}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums font-semibold text-text-secondary">
                    {avg(impact, totals.gp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <span className="text-[11px] text-gray-400">
          Per-game averages across the run. Impact weights scoring, playmaking and defense against
          wasted shots — the same formula the Records page uses to pick a game MVP.
        </span>
      </div>

      {/* Round by round */}
      <div className="flex flex-col gap-3">
        <span className="text-sm font-semibold uppercase tracking-wider text-text-secondary">
          Round by Round
        </span>
        {history.map((g) => (
          <div key={g.round} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider truncate">
                {ROUND_NAME[g.round]} vs {g.oppName}
              </span>
              <span
                className={`text-xs font-bold tabular-nums flex-shrink-0 ${
                  g.result.won ? "text-emerald-600" : "text-red-400"
                }`}
              >
                {g.result.won ? "W" : "L"} {g.result.myScore}–{g.result.oppScore}
                {g.result.overtime ? " (OT)" : ""}
              </span>
            </div>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="table-auto w-full bg-white">
                <StatHead cols={["PTS", "REB", "AST", "STL", "BLK", "FG", "3PT"]} />
                <tbody className="divide-y divide-gray-100">
                  {g.result.myBox.map(({ card, line }) => (
                    <tr key={card.id} className="text-sm even:bg-white odd:bg-gray-50">
                      <td className="px-3 py-1.5 font-semibold text-text-secondary whitespace-nowrap">
                        {card.name} <span className="text-gray-400">{yearTag(card.year)}</span>
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums font-bold text-text-primary">
                        {line.pts}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-primary">{line.reb}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-primary">{line.ast}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-primary">{line.stl}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-primary">{line.blk}</td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-tertiary">
                        {line.fgm}-{line.fga}
                      </td>
                      <td className="px-2 py-1.5 text-right tabular-nums text-text-tertiary">
                        {line.tpm}-{line.tpa}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
