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
  onStatChange: (
    name: string,
    stat: "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm",
    delta: number
  ) => void;
  reset: boolean;
  resetState: (bool: boolean) => void;
};

export default function PlayerCard({ name, onStatChange, reset, resetState }: PlayerCardProps) {
  const [pts, setPts] = useState(0);
  const [reb, setReb] = useState(0);
  const [ast, setAst] = useState(0);
  const [blk, setBlk] = useState(0);
  const [stl, setStl] = useState(0);
  const [fga, setFga] = useState(0);
  const [fgm, setFgm] = useState(0);
  const [tpa, setTpa] = useState(0);
  const [tpm, setTpm] = useState(0);

  const change = (
    stat: "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm",
    delta: number
  ) => {
    if (stat === "reb") setReb((r) => r + delta);
    if (stat === "ast") setAst((a) => a + delta);
    if (stat === "blk") setBlk((a) => a + delta);
    if (stat === "stl") setStl((a) => a + delta);
    if (stat === "fga") {
      setFga((a) => a + delta);
    }
    if (stat === "fgm") {
      setFga((a) => a + delta);
      setFgm((a) => a + delta);
      setPts((a) => a + 1);
      onStatChange(name, "fga", delta);
      onStatChange(name, "fgm", delta);
      onStatChange(name, "pts", delta);
    }
    if (stat === "tpa") {
      setTpa((a) => a + delta);
    }
    if (stat === "tpm") {
      setTpa((a) => a + delta);
      setTpm((a) => a + delta);
      setPts((a) => a + 2 * delta);
      onStatChange(name, "tpa", delta);
      onStatChange(name, "tpm", delta);
      onStatChange(name, "pts", delta * 2);
    }
    if (stat !== "tpm" && stat !== "fgm") {
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

      setPts(0);
      setReb(0);
      setAst(0);
      setBlk(0);
      setStl(0);
      setFga(0);
      setFgm(0);
      setTpa(0);
      setTpm(0);

      resetState(false);
    }
  }, [reset]);

  return (
    <div className="border-3 border-black shadow-lg rounded-lg p-4 flex flex-col items-center h-[700px] justify-between">
      <div className="flex w-full h-1/2">
        <img
          className="flex w-full h-full object-cover rounded-lg"
          src={playerToImageMap.get(name)}
        ></img>
      </div>
      <div className="text-[32px] font-medium">{name}</div>
      <div className="flex w-full items-center border-5 justify-around w-8">
        {(["pts", "reb", "ast", "blk", "stl"] as const).map((stat) => (
          <div className="mt-2 flex flex-col text-center items-center">
            <button
              key={stat}
              onClick={() => change(stat, +1)}
              className="p-3 bg-green-500 text-white rounded"
            >
              +
            </button>
            <span className="text-lg font-medium">
              {stat === "pts"
                ? pts
                : stat === "reb"
                ? reb
                : stat === "ast"
                ? ast
                : stat === "blk"
                ? blk
                : stl}{" "}
              {stat}
            </span>
            <button
              key={stat}
              onClick={() => change(stat, -1)}
              className="p-3 bg-red-500 text-white rounded"
            >
              –
            </button>
          </div>
        ))}
      </div>
      <div className="flex w-full justify-around">
        <div className="flex flex-col">
          <button
            onClick={() => change("fgm", +1)}
            key="fgm"
            className="p-3 bg-green-500 text-white rounded"
          >
            Make
          </button>
          <span className="text-lg font-medium">
            {fgm} / {fga} FG
          </span>
          <button
            onClick={() => change("fga", +1)}
            key="fga"
            className="p-3 bg-red-500 text-white rounded"
          >
            Miss
          </button>
        </div>
        <div className="flex flex-col">
          <button
            onClick={() => change("tpm", +1)}
            key="tpm"
            className="p-3 bg-green-500 text-white rounded"
          >
            Make
          </button>
          <span className="text-lg font-medium">
            {tpm} / {tpa} 3PT
          </span>
          <button
            onClick={() => change("tpa", +1)}
            key="tpa"
            className="p-3 bg-red-500 text-white rounded"
          >
            Miss
          </button>
        </div>
      </div>
    </div>
  );
}
