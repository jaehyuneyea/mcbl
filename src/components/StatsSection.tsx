import { useEffect, useState } from "react";
import { fetchAvailableYears, loadPlayerStats, statKeys, type StatTuple } from "../hooks/PlayerData";
import StatsCard from "./StatsCard";

export default function StatsSection() {
  const [average, setAverage] = useState<[string, StatTuple][]>([]);
  const [loading, setLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  useEffect(() => {
    fetchAvailableYears().then((years) => {
      setAvailableYears(years);
      if (years.length > 0) {
        const currentYear = new Date().getFullYear();
        const defaultYear = years.includes(currentYear) ? currentYear : years[years.length - 1];
        setSelectedYear(defaultYear);
      }
    });
  }, []);

  useEffect(() => {
    if (availableYears.length === 0) return;
    setLoading(true);
    loadPlayerStats(selectedYear ?? undefined)
      .then((data) => setAverage(data))
      .catch((err) => console.error("Failed to load stats:", err))
      .finally(() => setLoading(false));
  }, [selectedYear, availableYears]);

  const sorted = [...average].sort(([, a], [, b]) => b.pts - a.pts);

  return (
    <div className="mt-6 flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-semibold text-text-secondary">Season Averages</h2>
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

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="animate-pulse text-sm text-text-tertiary">Loading stats…</span>
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
