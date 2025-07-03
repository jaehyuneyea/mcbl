// Scoreboard.tsx
type ScoreboardProps = {
  homeScore: number;
  homeName: string;
  opponentScore: number;
  opponentName: string;
};
export const nameMap = new Map<string, string>([
  ["jjp", "Jah Jah Pelicans"],
  ["ns", "Not Sure"],
  ["lls", "Lapu Lapu Soldiers"],
  ["dt", "Chang Bangers"],
]);
export default function Scoreboard({
  homeScore,
  homeName,
  opponentName,
  opponentScore,
}: ScoreboardProps) {
  return (
    <section className="max-w-7xl mx-auto  gap-8 py-8 px-4">
      <div className="flex justify-between font-medium text-center">
        <div className="flex flex-col gap-6">
          <span className="text-4xl font-bold text-gray-800">{nameMap.get(homeName)}</span>
          <span className="text-6xl font-extrabold text-gray-800">{homeScore}</span>
        </div>
        <div className="flex flex-col gap-6">
          <span className="text-4xl font-bold text-gray-800">{nameMap.get(opponentName)}</span>
          <span className="text-6xl font-extrabold text-gray-800">{opponentScore}</span>
        </div>
      </div>
    </section>
  );
}
