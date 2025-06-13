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

  const teams = Object.entries(game).filter((entry) => {
    return entry[0] === "teams";
  });

  const stats = Object.entries(game).filter((entry) => {
    return entry[0] !== "teams" && entry[0] !== "date";
  });

  const playerData = stats.map(([playerName, playerStats]) => {
    // calculateJahScore returns a string; turn it into a number
    const jahScoreNum = Number(calculateJahScore(playerStats));
    return { playerName, playerStats, jahScore: jahScoreNum };
  });

  // 2) Find the highest score
  const maxJah = Math.max(...playerData.map((p) => p.jahScore));

  const date = game.date;
  const utcDate = new Date(Date.parse(date.valueOf()));

  const pstString = utcDate.toLocaleString("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  console.log(pstString);

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
      onClick={() => {
        setPopUpOpen(true);
      }}
      className="w-full border text-3xl font-medium bg-white shadow-lg rounded-lg p-6 hover:cursor-pointer"
    >
      <div className="flex justify-between">
        <div className="w-1/3">
          <span className={winner === team1 ? "text-green-400" : "text-black"}>
            {nameMap.get(team1)}
          </span>
        </div>

        <div className="text-center w-1/3 text-4xl">
          <span>{score[0]}</span>
          <span>:</span>
          <span>{score[1]}</span>
        </div>
        <div className="w-1/3 text-right">
          <span className={winner === team2 ? "text-green-400" : "text-black"}>
            {nameMap.get(team2)}
          </span>
        </div>
      </div>
      <DetailedStatBox isOpen={isPopUpOpen} onClose={() => setPopUpOpen(false)}>
        <div className="text-sm">
          <div className="flex text-xl font-medium justify-between gap-6 mb-12 pb-12">
            <div className="flex flex-col gap-6">
              <span>{nameMap.get(team1)}</span>
              <span className="text-[52px]">{score[0]}</span>
            </div>
            <div className="text-sm">{pstString}</div>

            <div className="flex flex-col gap-6 text-right">
              <span>{nameMap.get(team2)}</span>
              <span className="text-[52px]">{score[1]}</span>
            </div>
          </div>
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
                <th className="px-2 py-1 text-right">JahScore</th>
              </tr>
            </thead>
            <tbody>
              {playerData.map(({ playerName, playerStats, jahScore }) => (
                <tr
                  key={playerName}
                  className="text-text-primary font-medium text-lg even:bg-white odd:bg-gray-100"
                >
                  {/* player’s name */}
                  <td className="first:rounded-l-lg px-3 py-1 text-left">{playerName}{jahScore === maxJah && (
                    <span className="ml-2 rounded bg-yellow-300 px-1 text-xs font-bold text-center">MVP</span>
                  )}</td>

                  {/* one cell per statKey, pulling the right number out of playerStats */}
                  {statKeys.map((key) => (
                    <td key={key} className="w-1/12 px-2 py-1 text-right">
                      {playerStats[key]}
                    </td>
                  ))}

                  {/* FG% and 3P% columns */}
                  <td className="px-2 py-1 text-right">
                    {(
                      (playerStats.fgm / (playerStats.fga === 0 ? 1 : playerStats.fga)) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                  <td className="last:rounded-r-lg px-2 py-1 text-right">
                    {(
                      (playerStats.tpm / (playerStats.tpa === 0 ? 1 : playerStats.tpa)) *
                      100
                    ).toFixed(1)}
                    %
                  </td>
                  <td className="last:rounded-r-lg px-2 py-1 text-right">
                    {calculateJahScore(playerStats)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailedStatBox>
    </div>
  );
}
