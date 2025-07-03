// Game.tsx
import { useState, useEffect } from "react";
import PlayerCard from "./PlayerCard";
import Scoreboard from "./Scoreboard";
import * as XLSX from "xlsx";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ConfirmationBox } from "./ConfirmationBox";
import { ResultBox } from "./ResultBox";

type StatTuple = {
  pts: number;
  reb: number;
  ast: number;
  blk: number;
  stl: number;
  fga: number;
  fgm: number;
  tpa: number;
  tpm: number;
};

export default function Game() {
  const SUBMIT_CODE = "@MCBL2025";

  const [homeTeam, setHomeTeam] = useState("jjp");
  const [oppTeam, setOppTeam] = useState("ns");
  const [reset, setReset] = useState(false);
  const [playerList, setPlayerList] = useState<PlayerData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [playerStats, setPlayerStats] = useState<Record<string, StatTuple>>({});
  const [isPopUpOpen, setPopUpOpen] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [isSuccessPopUpOpen, setSuccesPopUpOpen] = useState(false);
  const [isSuccessful, setSuccessful] = useState(false);
  const [history, setHistory] = useState<Record<string, StatTuple>[]>([]);
  // a stack state that keeps track of every snapshot of the stat sheet as it is updated;
  // the updates are trickled down to the cards now because the playerCard reads its values off the central stat sheet, no longer manages its own state.
  // when handleStatChange is called, push onto stack, if undo, pop from the stack
  interface PlayerData {
    name: string;
    team: string;
  }

  useEffect(() => {
    async function loadXlsx() {
      try {
        const resp = await fetch("/players.xlsx");
        if (!resp.ok) {
          throw new Error(`Failed to fetch: ${resp.status} ${resp.statusText}`);
        }
        const arrayBuffer = await resp.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: PlayerData[] = XLSX.utils.sheet_to_json(worksheet, {
          defval: "",
          raw: false,
        }) as PlayerData[];
        setPlayerList(jsonData);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    }
    loadXlsx();
  }, []);

  useEffect(() => {
    if (playerList) {
      const initial: Record<string, StatTuple> = {};
      playerList
        .filter((player) => {
          return player.team === oppTeam || player.team === homeTeam ? true : false;
        })
        .forEach(({ name }) => {
          initial[name] = {
            pts: 0,
            reb: 0,
            ast: 0,
            blk: 0,
            stl: 0,
            fga: 0,
            fgm: 0,
            tpa: 0,
            tpm: 0,
          };
        });
      setPlayerStats(initial);
    }
  }, [playerList, oppTeam, homeTeam]);

  if (error) {
    return (
      <section className="">
        <div className="text-red-600">Error loading players: {error}</div>
      </section>
    );
  }

  if (playerList === null) {
    return (
      <section className="">
        <div>Loading players...</div>
      </section>
    );
  }

  const zeroStats: StatTuple = {
    pts: 0,
    reb: 0,
    ast: 0,
    blk: 0,
    stl: 0,
    fga: 0,
    fgm: 0,
    tpa: 0,
    tpm: 0,
  };

  const handleStatChange = (
    name: string,
    stat: keyof StatTuple | Array<keyof StatTuple>,
    delta: number
  ) => {
    setHistory((hist) => {
      const last = hist[hist.length - 1]; // get top of the stack
      if (last && shallowEqual(last, playerStats)) return hist; // if both are the same values, then just return
      return [...hist, playerStats]; // push new value to the top
    });
    setPlayerStats((prev) => {
      const old = prev[name] || {
        pts: 0,
        reb: 0,
        ast: 0,
        blk: 0,
        stl: 0,
        fga: 0,
        fgm: 0,
        tpa: 0,
        tpm: 0,
      };

      const updated = { ...old };

      if (Array.isArray(stat)) {
        stat.forEach((stat) => {
          updated[stat] = (updated[stat] ?? 0) + delta;
        });
      } else {
        updated[stat] = (updated[stat] ?? 0) + delta;
      }
      return {
        ...prev,
        [name]: updated,
      };
    });
  };

  const undo = () => {
    setHistory((hist) => {
      if (hist.length === 0) return hist;
      const last = hist[hist.length - 1]; // get the top of the stack
      setPlayerStats(last);
      return hist.slice(0, -1); // pop the top of the stack
    });
  };
  // helper function to compare two playerStats record
  function shallowEqual(a: Record<string, any>, b: Record<string, any>) {
    const ka = Object.keys(a),
      kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    return ka.every((k) => a[k] === b[k]);
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCodeInput(e.target.value);
  };

  const homeScore = Object.entries(playerStats)
    .filter(([n]) => {
      const player = playerList.find((p) => p.name === n);
      return player?.team === homeTeam;
    })
    .reduce((sum, [, stats]) => sum + stats.tpm + stats.fgm, 0);

  const opponentScore = Object.entries(playerStats)
    .filter(([name]) => {
      const player = playerList.find((p) => p.name === name);
      return player?.team === oppTeam;
    })
    .reduce((sum, [, stats]) => sum + stats.pts, 0);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.id == "home") {
      setHomeTeam(e.target.value);
    } else if (e.target.id == "opp") {
      setOppTeam(e.target.value);
    }
  };

  const handleReset = (bool: boolean) => {
    setReset(bool);
  };

  const submitGame = async () => {
    if (codeInput === SUBMIT_CODE) {
      try {
        const date = new Date(Date.now()).toISOString();
        const teams = {
          team1: homeTeam,
          team2: oppTeam,
          score: [homeScore, opponentScore],
          winner: homeScore > opponentScore ? homeTeam : oppTeam,
        };
        const gameData = { ...playerStats, date, teams };
        const docRef = await addDoc(collection(db, "games"), gameData);
        console.log("Success", docRef.id);
        setPopUpOpen(false);
        setSuccessful(true);
        setSuccesPopUpOpen(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setSuccessful(false);
      setSuccesPopUpOpen(true);
    }
  };

  return (
    <div className="space-y-6 p-4 mt-6 rounded-lg">
      <div className="flex gap-2 justify-between">
        <div className="flex gap-4">
          {" "}
          <button
            onClick={() => handleReset(true)}
            className="border border-gray-400 border-2 rounded-md p-3 bg-gray-100 text-text-secondary font-medium hover:bg-gray-200 transition"
          >
            Reset
          </button>
          <button
            onClick={undo}
            disabled={history.length === 0}
                    className="
          fixed bottom-6 right-6 
          bg-gray-800 text-white 
          p-4 rounded-full shadow-lg 
          hover:bg-gray-700 
          disabled:opacity-50 disabled:cursor-not-allowed
          transition
        "
          >
            Undo
          </button>
        </div>

        <button
          onClick={() => setPopUpOpen(true)}
          className="border border-dark_green border-2 rounded-md p-3 bg-dark_grey text-white font-medium hover:bg-gray-700 transition"
        >
          Submit
        </button>
      </div>
      <div className="flex justify-between w-full font-medium">
        <select
          className="rounded-lg origin-top-right p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
          id="home"
          onChange={handleSelectChange}
        >
          <option value="jjp">Jah Jah Pelicans</option>
          <option value="ns">Not Sure</option>
          <option value="lls">Lapu Lapu Soldiers</option>
          <option value="dt">Chang Bangers</option>
        </select>
        <select
          className="rounded-lg origin-top-right p-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden"
          id="opp"
          defaultValue="ns"
          onChange={handleSelectChange}
        >
          <option value="jjp">Jah Jah Pelicans</option>
          <option value="ns">Not Sure</option>
          <option value="lls">Lapu Lapu Soldiers</option>
          <option value="dt">Chang Bangers</option>
        </select>
      </div>

      <Scoreboard
        homeName={homeTeam}
        homeScore={homeScore}
        opponentName={oppTeam}
        opponentScore={opponentScore}
      />

      <div className="grid grid-cols-3 gap-4">
        {playerList
          .filter((player) => {
            return player.team === homeTeam ? true : false;
          })
          .map((player) => (
            <PlayerCard
              name={player.name}
              team="home"
              onStatChange={handleStatChange}
              stats={playerStats[player.name] ?? zeroStats}
              reset={reset}
              resetState={handleReset}
            />
          ))}
        {playerList
          .filter((player) => {
            return player.team === oppTeam ? true : false;
          })
          .map((player) => (
            <PlayerCard
              name={player.name}
              team="opponent"
              onStatChange={handleStatChange}
              stats={playerStats[player.name] ?? zeroStats}
              reset={reset}
              resetState={handleReset}
            />
          ))}
      </div>
      <ConfirmationBox
        isOpen={isPopUpOpen}
        onClose={() => setPopUpOpen(false)}
        onSubmit={() => submitGame()}
      >
        <div className="flex flex-col gap-3">
          <h2 className="text-2xl font-semibold mb-2">Enter confirmation code</h2>
          <p>Please confirm with the confirmation code that you would like to proceed.</p>
          <label>
            {" "}
            <input
              value={codeInput}
              onChange={handleInputChange}
              className="border border-black w-full"
            ></input>
          </label>
        </div>
      </ConfirmationBox>
      <ResultBox isOpen={isSuccessPopUpOpen} onClose={() => setSuccesPopUpOpen(false)}>
        <div className="flex flex-col">{isSuccessful ? "SUCCESS" : "INCORRECT CODE"}</div>
      </ResultBox>
    </div>
  );
}
