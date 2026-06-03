import { type DocumentData } from "firebase/firestore";
import { nameMap } from "./Scoreboard";
import { useState } from "react";
import { DetailedStatBox } from "./DetailedStatBox";
import { statKeys } from "../hooks/PlayerData";

type IndividualGameProps = {
  game: DocumentData;
};

export default function IndividualGame({ game }: IndividualGameProps) {
  const [isPopUpOpen, setPopUpOpen] = useState(false);
  if (game.length === 0) {
    return <div>Loading…</div>;
  }

  const teams = Object.entries(game).filter((entry) => entry[0] === "teams");
  const stats = Object.entries(game).filter(
    (entry) => entry[0] !== "teams" && entry[0] !== "date"
  );

  const playerData = stats.map(([playerName, playerStats]) => {
    const jahScoreNum = Number(calculateJahScore(playerStats));
    return { playerName, playerStats, jahScore: jahScoreNum };
  });

  const maxJah = Math.max(...playerData.map((p) => p.jahScore));
  const minJah = Math.min(...playerData.map((p) => p.jahScore));

  const date = game.date;
  const utcDate = new Date(Date.parse(date.valueOf()));

  const pstString = utcDate.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  function calculateJahScore(playerStats: any) {
    let jahScore = 0;
    jahScore += playerStats.pts * 1;
    jahScore += playerStats.tpm * 2;
    jahScore += playerStats.reb * 0.5;
    jahScore += playerStats.ast * 1;
    jahScore += playerStats.blk * 1.5;
    jahScore += playerStats.stl * 1.5;
    jahScore -= (playerStats.fga - playerStats.fgm) * 0.25;
    jahScore -= (playerStats.fga - playerStats.fgm) * 0.25;
    return jahScore.toFixed(0);
  }

  const results = teams[0][1];
  const winner = results.winner;
  const score = results.score;
  const team1 = results.team1;
  const team2 = results.team2;

  return (
    <div
      onClick={() => setPopUpOpen(true)}
      className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 hover:shadow-md cursor-pointer transition-shadow"
    >
      <div className="flex items-center justify-between">
        <div className="w-2/5">
          <span
            className={`text-base font-semibold ${
              winner === team1 ? "text-text-secondary" : "text-gray-400"
            }`}
          >
            {nameMap.get(team1)}
          </span>
        </div>

        <div className="flex items-center gap-3 text-2xl font-bold tabular-nums">
          <span className={winner === team1 ? "text-text-secondary" : "text-gray-300"}>
            {score[0]}
          </span>
          <span className="text-gray-300 text-base font-normal">—</span>
          <span className={winner === team2 ? "text-text-secondary" : "text-gray-300"}>
            {score[1]}
          </span>
        </div>

        <div className="w-2/5 text-right">
          <span
            className={`text-base font-semibold ${
              winner === team2 ? "text-text-secondary" : "text-gray-400"
            }`}
          >
            {nameMap.get(team2)}
          </span>
        </div>
      </div>

      <DetailedStatBox isOpen={isPopUpOpen} onClose={() => setPopUpOpen(false)}>
        <div>
          {/* Score header */}
          <div className="flex items-start justify-between mb-5 pb-5 border-b border-gray-100">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {nameMap.get(team1)}
              </span>
              <span
                className={`text-5xl font-bold tabular-nums ${
                  winner === team1 ? "text-text-secondary" : "text-gray-300"
                }`}
              >
                {score[0]}
              </span>
            </div>
            <span className="text-xs text-gray-400 self-center">{pstString}</span>
            <div className="flex flex-col gap-1 text-right">
              <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                {nameMap.get(team2)}
              </span>
              <span
                className={`text-5xl font-bold tabular-nums ${
                  winner === team2 ? "text-text-secondary" : "text-gray-300"
                }`}
              >
                {score[1]}
              </span>
            </div>
          </div>

          {/* Stats table */}
          <div className="w-full overflow-x-auto rounded-lg overflow-hidden border border-gray-100">
            <table className="table-auto w-full">
              <thead>
                <tr className="bg-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                  <th className="px-3 py-2.5 text-left">Player</th>
                  {statKeys.map((key) => (
                    <th key={key} className="px-3 py-2.5 text-right">
                      {key.toUpperCase()}
                    </th>
                  ))}
                  <th className="px-3 py-2.5 text-right">FG%</th>
                  <th className="px-3 py-2.5 text-right">3P%</th>
                  <th className="px-3 py-2.5 text-right">JAH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {playerData.map(({ playerName, playerStats, jahScore }) => (
                  <tr
                    key={playerName}
                    className="text-base transition-colors even:bg-white odd:bg-gray-50 hover:bg-gray-100"
                  >
                    <td className="px-3 py-2.5 font-semibold text-text-secondary whitespace-nowrap">
                      {playerName}
                      {jahScore === maxJah && (
                        <span className="ml-2 rounded bg-yellow-300 px-1 text-xs font-bold">
                          MVP
                        </span>
                      )}
                      {jahScore === minJah && (
                        <span className="ml-2 rounded bg-red-100 text-red-500 px-1 text-xs font-semibold">
                          BUM
                        </span>
                      )}
                    </td>
                    {statKeys.map((key) => (
                      <td key={key} className="px-3 py-2.5 text-right tabular-nums text-text-primary font-medium">
                        {playerStats[key]}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-tertiary font-medium">
                      {((playerStats.fgm / (playerStats.fga === 0 ? 1 : playerStats.fga)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-tertiary font-medium">
                      {((playerStats.tpm / (playerStats.tpa === 0 ? 1 : playerStats.tpa)) * 100).toFixed(1)}%
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-text-tertiary font-medium">
                      {calculateJahScore(playerStats)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </DetailedStatBox>
    </div>
  );
}
