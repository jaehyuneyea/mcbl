import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { nameMap } from "./Scoreboard";
import PlayerProfileModal from "./PlayerProfileModal";

const imageModules = import.meta.glob<string>("../assets/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});

function getImage(name: string): string | undefined {
  const parts = name.toLowerCase().split(" ");
  return (
    imageModules[`../assets/${parts[0]}.png`] ??
    imageModules[`../assets/${parts[0]}_${parts[1]}.png`]
  );
}

type PlayerData = { name: string; team: string };

const TEAM_ORDER = ["jjp", "ns", "lls", "dt"];

export default function PlayersSection() {
  const [playerList, setPlayerList] = useState<PlayerData[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerData | null>(null);

  useEffect(() => {
    async function load() {
      const resp = await fetch("/players.xlsx");
      const buf = await resp.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<PlayerData>(ws, { defval: "", raw: false });
      setPlayerList(rows);
    }
    load();
  }, []);

  const byTeam = TEAM_ORDER.reduce<Record<string, PlayerData[]>>((acc, code) => {
    acc[code] = playerList.filter((p) => p.team === code);
    return acc;
  }, {});

  return (
    <div className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TEAM_ORDER.map((teamCode) => {
          const players = byTeam[teamCode];
          if (!players || players.length === 0) return null;
          return (
            <div
              key={teamCode}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-3"
            >
              {/* Team header */}
              <div className="flex items-center gap-2 pb-1 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                  {nameMap.get(teamCode)}
                </span>
              </div>

              {/* Player rows */}
              <div className="flex flex-col gap-2">
                {players.map((player) => {
                  const img = getImage(player.name);
                  return (
                    <div
                      key={player.name}
                      onClick={() => setSelectedPlayer(player)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      {img ? (
                        <img
                          src={img}
                          alt={player.name}
                          className="w-14 h-14 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-gray-400">
                          {player.name.charAt(0)}
                        </div>
                      )}
                      <span className="flex-1 text-xl font-semibold text-text-secondary">
                        {player.name}
                      </span>
                      <span className="text-gray-300">›</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {selectedPlayer && (
        <PlayerProfileModal
          playerName={selectedPlayer.name}
          team={selectedPlayer.team}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
