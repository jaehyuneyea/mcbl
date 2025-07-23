import { useEffect, useState } from "react";
import IndividualGame from "./IndividualGame";
import { fetchGameData } from "../hooks/PlayerData";
import type { DocumentData } from "firebase/firestore";
export default function GameSection() {
  const [gameData, setGameData] = useState<DocumentData[] | null>(null);
  let lastDate = "";
  useEffect(() => {
    fetchGameData()
      .then((game) => {
        setGameData(game);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);
  if (gameData === null || gameData.length === 0) {
    return <div>Loading…</div>;
  }

  return (
 <div>
    {gameData.map((game) => {
      const thisDate = new Date(game.date).toLocaleDateString();
      const showDivider = thisDate !== lastDate;
      lastDate = thisDate;

      return (
        <div key={game.id}>
          {showDivider && (
            <div className="my-4 text-center text-gray-500">
              — {thisDate} —
            </div>
          )}
          <IndividualGame game={game} />
        </div>
      );
    })}
  </div>
  );
}
