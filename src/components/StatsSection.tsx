import { useEffect, useState } from "react";
import { loadPlayerStats, statKeys, type StatTuple } from "../hooks/PlayerData";
import StatsCard from "./StatsCard";

export default function StatsSection() {
  const [average, setAverage] = useState<[string, StatTuple][]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // kick off the promise and store the result
    loadPlayerStats()
      .then((data) => {
        setAverage(data);
      })
      .catch((err) => {
        console.error("Failed to load stats:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // ← run once on mount

  if (loading) {
    return <div>Loading…</div>;
  }
  const sorted = [...average].sort(([, aStats], [, bStats]) => bStats.pts - aStats.pts);
  return (
    <div className="flex justify-center items-center w-50 lg:w-full mx-auto p-6 ">
      <table className="table-auto w-full border-separate border-spacing-y-0.5">
        <thead>
          <tr className="bg-cookie">
            <th className="px-3 py-1 text-left">Player</th>
            {statKeys.map((key) => (
              <th key={key} className="w-1/12 px-2 py-1 text-right">
                {key.toUpperCase()}
              </th>
            ))}
            <th className="px-2 py-1 text-right">FG%</th>
            <th className="px-2 py-1 text-right">3P%</th>
          </tr>
        </thead>
          <tbody className="w-full">
            {sorted.map((statLine) => (
              <StatsCard key={statLine[0]} stats={statLine} />
            ))}
          </tbody>
      </table>
    </div>
  );
}
