import { useEffect, useState } from "react";
import { DetailedStatBox } from "./DetailedStatBox";
import { nameMap } from "./Scoreboard";
import {
  loadPlayerStats,
  loadPlayerStatsByYear,
  statKeys,
  type StatTuple,
  type StatTupleWithGP,
} from "../hooks/PlayerData";

const imageModules = import.meta.glob<string>("../assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

function getImage(name: string): string | undefined {
  const parts = name.toLowerCase().split(" ");
  return (
    imageModules[`../assets/${parts[0]}.png`] ??
    imageModules[`../assets/${parts[0]}_${parts[1]}.png`]
  );
}

type StatCategory = { label: string; value: string; score: number };

function getTopStats(s: StatTuple): StatCategory[] {
  const fgPct = s.fgm / (s.fga || 1);
  const tpPct = s.tpm / (s.tpa || 1);
  const categories: StatCategory[] = [
    { label: "PTS",  value: String(s.pts),                    score: s.pts * 1 },
    { label: "REB",  value: String(s.reb),                    score: s.reb * 0.5 },
    { label: "AST",  value: String(s.ast),                    score: s.ast * 2 },
    { label: "BLK",  value: String(s.blk),                    score: s.blk * 3 },
    { label: "STL",  value: String(s.stl),                    score: s.stl * 3 },
    { label: "FG%",  value: (fgPct * 100).toFixed(1) + "%",   score: fgPct * 15 },
    { label: "3P%",  value: (tpPct * 100).toFixed(1) + "%",   score: tpPct * 20 },
    { label: "FGA",  value: String(s.fga),                    score: s.fga * 0.2 },
    { label: "3PA",  value: String(s.tpa),                    score: s.tpa * 0.4 },
  ];
  return categories.sort((a, b) => b.score - a.score).slice(0, 3);
}

type Props = {
  playerName: string;
  team: string;
  onClose: () => void;
};

export default function PlayerProfileModal({ playerName, team, onClose }: Props) {
  const [careerStats, setCareerStats] = useState<StatTuple | null>(null);
  const [statsByYear, setStatsByYear] = useState<Record<number, StatTupleWithGP>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadPlayerStats(),
      loadPlayerStatsByYear(playerName),
    ]).then(([allPlayers, byYear]) => {
      const entry = allPlayers.find(([name]) => name === playerName);
      setCareerStats(entry ? entry[1] : null);
      setStatsByYear(byYear);
    }).finally(() => setLoading(false));
  }, [playerName]);

  const sortedYears = Object.keys(statsByYear).map(Number).sort((a, b) => b - a);
  const mostRecentStats = sortedYears.length > 0 ? statsByYear[sortedYears[0]] : careerStats;
  const top3 = mostRecentStats ? getTopStats(mostRecentStats) : [];

  const img = getImage(playerName);

  return (
    <DetailedStatBox isOpen onClose={onClose}>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <span className="animate-pulse text-sm text-text-tertiary">Loading…</span>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Profile header */}
          <div className="flex items-center gap-4">
            {img ? (
              <img
                src={img}
                alt={playerName}
                className="w-20 h-20 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-2xl font-semibold text-gray-400">
                {playerName.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold text-text-secondary">{playerName}</h2>
              <span className="text-sm text-gray-400 font-medium">{nameMap.get(team)}</span>
            </div>
          </div>

          {/* Top 3 hero stats */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-xl overflow-hidden">
              {top3.map(({ label, value }) => (
                <div key={label} className="flex flex-col items-center py-4 px-2">
                  <span className="text-3xl font-bold tabular-nums text-text-secondary">
                    {value}
                  </span>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-1">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Year-by-year table */}
          <div className="overflow-x-auto rounded-lg overflow-hidden border border-gray-100">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-left">Year</th>
                  <th className="px-3 py-2.5 text-right">GP</th>
                  {statKeys.map((key) => (
                    <th key={key} className="px-3 py-2.5 text-right">
                      {key.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right">FG%</th>
                  <th className="px-3 py-2.5 text-right">3P%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedYears.map((year) => {
                  const s = statsByYear[year];
                  const fgPct = ((s.fgm / (s.fga || 1)) * 100).toFixed(1);
                  const tpPct = ((s.tpm / (s.tpa || 1)) * 100).toFixed(1);
                  return (
                    <tr
                      key={year}
                      className="text-base transition-colors even:bg-white odd:bg-gray-50 hover:bg-gray-100"
                    >
                      <td className="px-3 py-2.5 font-semibold text-text-secondary">{year}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-gray-400 font-medium">{s.gp}</td>
                      {statKeys.map((key) => (
                        <td key={key} className="px-3 py-2.5 text-right tabular-nums text-text-primary font-medium">
                          {s[key]}
                        </td>
                      ))}
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-tertiary font-medium">{fgPct}%</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-text-tertiary font-medium">{tpPct}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DetailedStatBox>
  );
}
