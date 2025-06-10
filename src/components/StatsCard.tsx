import type { StatTuple } from "../hooks/PlayerData";

type StatCardProps = {
  stats: [string, StatTuple];
};
export default function StatsCard({ stats }: StatCardProps) {
  const [player, s] = stats;
  const fga = s.fga === 0 ? 1 : s.fga;
  const tpa = s.tpa === 0 ? 1 : s.tpa;
  const fgPct = ((s.fgm / fga) * 100).toFixed(1);
  const tpPct = ((s.tpm / tpa) * 100).toFixed(1);

  return (
    <tr className="text-text-primary font-medium text-lg even:bg-white odd:bg-gray-100">
      {/* Player name */}
      <td className="px-3 py-1 text-left">{player}</td>

      {/* Each raw stat */}
      {Object.entries(s).map(([_, val]) => (
        <td key={_} className="px-2 py-1 text-right">
          {val}
        </td>
      ))}

      {/* Percentages */}
      <td className="px-2 py-1 text-right">{fgPct}</td>
      <td className="px-2 py-1 text-right">{tpPct}</td>
    </tr>
  );
}
