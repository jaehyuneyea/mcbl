import { useEffect, useState } from "react";
import { fetchAvailableYears, loadPlayerStats, statKeys, type SeasonType, type StatTuple } from "../hooks/PlayerData";
import StatsCard from "./StatsCard";

const SEASON_OPTIONS: { label: string; value: SeasonType }[] = [
  { label: "Regular", value: "regular" },
  { label: "Playoffs", value: "playoffs" },
];

export default function StatsSection() {
  const [average, setAverage] = useState<[string, StatTuple][]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [seasonType, setSeasonType] = useState<SeasonType>("regular");

  useEffect(() => {
    fetchAvailableYears(seasonType).then((years) => {
      setAvailableYears(years);
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        setSelectedYear(years.includes(currentYear) ? currentYear : years[years.length - 1]);
      } else {
        setSelectedYear(null);
      }
    });
  }, [seasonType]);

  useEffect(() => {
    if (!selectedYear) return;
    setLoading(true);
    loadPlayerStats(selectedYear, seasonType)
      .then((data) => setAverage(data))
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, [selectedYear, seasonType]);

  const sorted = [...average].sort(([, a], [, b]) => b.pts - a.pts);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-text-secondary">Season Averages</h2>
        <div className="flex items-center gap-3">
          {/* Season type toggle */}
          <div className="flex rounded-full border border-gray-200 bg-white overflow-hidden">
            {SEASON_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setSeasonType(value)}
                className={`px-4 py-1.5 text-sm font-semibold transition-all duration-200 ${
                  seasonType === value
                    ? "bg-gray-600 text-white"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Year pills */}
          <div className="flex gap-2">
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                  selectedYear === year
                    ? "bg-gray-600 text-white shadow-sm"
                    : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="animate-pulse text-sm text-text-tertiary">Loading stats…</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-sm text-gray-400">No {seasonType} season games found for {selectedYear}.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-3 py-3 text-left w-8">#</th>
                  <th className="px-4 py-3 text-left">Player</th>
                  {statKeys.map((key) => (
                    <th key={key} className="px-3 py-3 text-right">
                      {key.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right">FG%</th>
                  <th className="px-3 py-3 text-right">3P%</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sorted.map((statLine, idx) => (
                  <StatsCard key={statLine[0]} stats={statLine} rank={idx + 1} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
