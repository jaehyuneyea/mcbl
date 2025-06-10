import { average, statKeys } from "../hooks/PlayerData";
import StatsCard from "./StatsCard";

export default function StatsSection() {
  const sorted = [...average].sort(
    ([, aStats], [, bStats]) => bStats.pts - aStats.pts
  );
  return (
    <div className="flex justify-center items-center w-full mx-auto border">
      <table className="table-fixed w-full border-collapse">
        <thead>
          <tr className="bg-gray-100">
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
        <tbody>
          {sorted.map((statLine) => (
            <StatsCard key={statLine[0]} stats={statLine} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
