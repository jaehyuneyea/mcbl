import { statKeys, type StatTuple } from "../hooks/PlayerData";

type StatCardProps = {
  stats: [string, StatTuple];
  rank: number;
};

export default function StatsCard({ stats, rank }: StatCardProps) {
  const [player, s] = stats;
  const fga = s.fga === 0 ? 1 : s.fga;
  const tpa = s.tpa === 0 ? 1 : s.tpa;
  const fgPct = ((s.fgm / fga) * 100).toFixed(1);
  const tpPct = ((s.tpm / tpa) * 100).toFixed(1);

  return (
    <tr className="text-base transition-colors even:bg-white odd:bg-gray-50 hover:bg-gray-100">
      <td className="px-3 py-3 text-text-tertiary font-medium">{rank}</td>
      <td className="px-4 py-3 font-semibold text-text-secondary whitespace-nowrap">{player}</td>
      {statKeys.map((key) => (
        <td key={key} className="px-3 py-3 text-right font-medium tabular-nums text-text-primary">
          {s[key]}
        </td>
      ))}
      <td className="px-3 py-3 text-right font-medium tabular-nums text-text-tertiary">{fgPct}%</td>
      <td className="px-3 py-3 text-right font-medium tabular-nums text-text-tertiary">{tpPct}%</td>
    </tr>
  );
}
