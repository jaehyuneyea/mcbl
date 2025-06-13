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
    <div className="flex text-[52px] justify-between font-medium w-full">
      <div className="flex flex-col gap-6">
        <span>{nameMap.get(homeName)}</span>
        <span>{homeScore}</span>
      </div>
      <div className="flex flex-col gap-6">
        <span>{nameMap.get(opponentName)}</span>
        <span>{opponentScore}</span>
      </div>
    </div>
  );
}
