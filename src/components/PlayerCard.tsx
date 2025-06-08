// PlayerCard.tsx
import { useEffect, useState } from "react";
import James from "../assets/james.png";
import David from "../assets/david.png";
import Nate from "../assets/nate.png";
import Sonny from "../assets/sonny.png";
import Jae from "../assets/jae_hyune.png";
import Jirah from "../assets/jirah.png";
import Matthew from "../assets/matthew.png";
import Rayan from "../assets/rayan.png";
import Lex from "../assets/lex.png";
import Vincent from "../assets/vincent.png";
import Harvir from "../assets/harvir.png";
import Brandon from "../assets/brandon.png";

type Team = "home" | "opponent";

type PlayerCardProps = {
  name: string;
  team: Team;
  onStatChange: (name: string, stat: "pts" | "reb" | "ast", delta: number) => void;
  reset: boolean;
  resetState: (bool: boolean) => void;
};

export default function PlayerCard({
  name,
  onStatChange,
  reset,
  resetState,
}: PlayerCardProps) {
  const [pts, setPts] = useState(0);
  const [reb, setReb] = useState(0);
  const [ast, setAst] = useState(0);

  const change = (stat: "pts" | "reb" | "ast", delta: number) => {
    if (stat === "pts") setPts((p) => p + delta);
    if (stat === "reb") setReb((r) => r + delta);
    if (stat === "ast") setAst((a) => a + delta);

    onStatChange(name, stat, delta);
  };

  const playerToImageMap = new Map<string, string>([
    ["James Lee", James],
    ["David Chang", David],
    ["Jae Hyune Yea", Jae],
    ["Brandon Wong", Brandon],
    ["Lex Rowheder", Lex],
    ["Nathean Moore", Nate],
    ["Jirah Almario", Jirah],
    ["Sonny Nguyen", Sonny],
    ["Vincent Kang", Vincent],
    ["Harvir Dhaliwal", Harvir],
    ["Matthew Kim", Matthew],
    ["Rayan Bilkhu", Rayan],
  ]);

  useEffect(() => {
    if (reset == true) {
      onStatChange(name, "pts", -pts);
      onStatChange(name, "reb", -reb);
      onStatChange(name, "ast", -ast);
      setPts(0);
      setReb(0);
      setAst(0);
      resetState(false);
    }
  }, [reset]);

  return (
    <div className="border-3 border-black shadow-lg rounded-lg p-4 flex flex-col items-center h-[600px] justify-between">
      <div className="flex w-full h-1/2">
        <img
          className="flex w-full h-full object-cover rounded-lg"
          src={playerToImageMap.get(name)}
        ></img>
      </div>
      <div className="text-[32px] font-medium">{name}</div>
      <div className="flex w-full items-center border-5 justify-around w-8">
        {(["pts", "reb", "ast"] as const).map((stat) => (
          <div className="mt-2 flex flex-col text-center items-center gap-2">
            <button key={stat} onClick={() => change(stat, +1)} className="p-5 bg-green-500 text-white rounded">
              +
            </button>
            <span className="text-lg font-medium">{stat === "pts" ? pts : stat === "reb" ? reb : ast} {stat}</span>
            <button key={stat} onClick={() => change(stat, -1)} className="p-5 bg-red-500 text-white rounded">
              –
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
