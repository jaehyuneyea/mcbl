import { useEffect, useState } from "react";
import IndividualGame from "./IndividualGame";
import { fetchGameData } from "../hooks/PlayerData";
import type { DocumentData } from "firebase/firestore";
export default function GameSection() {
  const [gameData, setGameData] = useState<DocumentData[] | null>(null);
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
    <div className="flex flex-col w-full gap-3 px-3 py-6">
      {gameData.map((result) => (
        <IndividualGame game={result} />
      ))}
    </div>
  );
}
