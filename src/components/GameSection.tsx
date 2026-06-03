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
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">{thisDate}</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
          )}
          <IndividualGame game={game} />
        </div>
      );
    })}
  </div>
  );
}
