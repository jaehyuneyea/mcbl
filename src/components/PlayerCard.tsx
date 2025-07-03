// PlayerCard.tsx
import { useEffect } from "react";
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
import Basketball from "../assets/basketball-1.svg";
import x_icon from "../assets/x-symbol-svgrepo-com.svg";
import type { StatTuple } from "../hooks/PlayerData";

type Team = "home" | "opponent";

type PlayerCardProps = {
  name: string;
  team: Team;
  onStatChange: (
    name: string,
    stat: "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm",
    delta: number
  ) => void;
  stats: StatTuple;
  reset: boolean;
  resetState: (bool: boolean) => void;
};

export default function PlayerCard({
  name,
  onStatChange,
  stats,
  reset,
  resetState,
}: PlayerCardProps) {
  const { pts, reb, ast, blk, stl, fga, fgm, tpa, tpm } = stats;

  console.log(stats);

  const change = (
    stat: "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm",
    delta: number
  ) => {
    if (stat === "fgm") {
      onStatChange(name, "fga", delta);
      onStatChange(name, "fgm", delta);
      onStatChange(name, "pts", delta);
    }
    if (stat === "tpa") {
      onStatChange(name, "fga", delta);
      onStatChange(name, "tpa", delta);
    }
    if (stat === "tpm") {
      onStatChange(name, "fga", delta);
      onStatChange(name, "fgm", delta);
      onStatChange(name, "tpa", delta);
      onStatChange(name, "tpm", delta);
      onStatChange(name, "pts", delta * 2);
    }
    if (stat !== "tpm" && stat !== "fgm" && stat !== "tpa" && stat !== "pts") {
      onStatChange(name, stat, delta);
    }
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
      onStatChange(name, "blk", -blk);
      onStatChange(name, "stl", -stl);
      onStatChange(name, "fga", -fga);
      onStatChange(name, "fgm", -fgm);
      onStatChange(name, "tpa", -tpa);
      onStatChange(name, "tpm", -tpm);
      resetState(false);
    }
  }, [reset]);

  return (
    <div className="border shadow-xl bg-white rounded-xl p-4 flex flex-col items-center h-[500px] justify-between">
      <div className="flex w-full h-1/4 justify-around items-center rounded-full mt-5">
        <img
          className="flex items-center w-1/3 h-full object-cover rounded-full"
          src={playerToImageMap.get(name)}
        ></img>
        <div className="flex items-center text-[32px] text-center font-medium">{name}</div>
      </div>
      <div className="flex w-full items-center border-5 justify-around">
        {(["PTS", "REB", "AST", "BLK", "STL"] as const).map((stat) => (
          <div className="flex flex-col items-center">
            <span className="text-4xl font-medium">
              {stat === "PTS"
                ? pts
                : stat === "REB"
                ? reb
                : stat === "AST"
                ? ast
                : stat === "BLK"
                ? blk
                : stl}{" "}
            </span>
            <span className="text-lg font-medium text-text-secondary/60">{stat}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col w-full items-center gap-3 font-medium">
        <div className="flex w-full justify-around items-center">
          <button
            onClick={() => change("fgm", +1)}
            key="fgm"
            className="px-3 py-1 bg-dark_grey text-white rounded-2xl"
          >
            <div className="flex gap-2 px-2 py-1 justify-center">
              <img src={Basketball} className="fill-white w-[18px] "></img>
              Make
            </div>
          </button>
          <span className="text-xl w-1/3 text-center">
            {fgm} / {fga} FG
          </span>
          <button
            onClick={() => change("fga", +1)}
            key="fga"
            className="px-3 py-1 bg-light_grey text-dark_grey rounded-2xl"
          >
            <div className="flex gap-3 px-2 py-1 justify-center">
              <img src={x_icon} className="fill-white w-[18px] "></img>
              Miss
            </div>
          </button>
        </div>
        <div className="flex w-full justify-around items-center">
          <button
            onClick={() => change("tpm", +1)}
            key="tpm"
            className="px-3 py-1 bg-dark_grey text-white rounded-2xl"
          >
            <div className="flex gap-2 px-2 py-1 justify-center">
              <img src={Basketball} className="fill-white w-[18px]"></img>
              Make
            </div>
          </button>
          <span className="text-xl w-1/3 text-center">
            {tpm} / {tpa} 3PT
          </span>
          <button
            onClick={() => change("tpa", +1)}
            key="tpa"
            className="px-3 py-1 bg-light_grey text-dark_grey rounded-2xl"
          >
            <div className="flex gap-3 px-2 py-1 justify-center">
              <img src={x_icon} className="fill-white w-[18px]"></img>
              Miss
            </div>
          </button>
        </div>
      </div>
      <div className="flex w-full items-center border-5 justify-around">
        {(["reb", "ast", "blk", "stl"] as const).map((stat) => (
          <div className="flex flex-col items-center">
            <button
              key={stat}
              onClick={() => change(stat, +1)}
              className="px-5 py-1 bg-dark_grey text-white rounded-2xl"
            >
              +
            </button>
            <span className="text-lg font-medium text-text-secondary/60">
              {stat.toLocaleUpperCase()}
            </span>
            <button
              key={stat}
              onClick={() => change(stat, -1)}
              className="px-5 py-1 bg-light_grey text-dark_grey rounded-2xl"
            >
              –
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
