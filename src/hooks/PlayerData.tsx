import { collection, getDocs, orderBy, query, type DocumentData } from "firebase/firestore";

import { db } from "../firebase";
export type StatTuple = Record<
  "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm" | "fta" | "ftm",
  number
>;
type GameStats = Record<string, StatTuple>;

export const statKeys: (keyof StatTuple)[] = [
  "pts",
  "reb",
  "ast",
  "blk",
  "stl",
  "fga",
  "fgm",
  "tpa",
  "tpm",
  "fta",
  "ftm"
];

export async function fetchGameData(): Promise<DocumentData[]> {

  const gamesQuery = query(
    collection(db, "games"),
    orderBy("date", "desc")
  );

  return getDocs(gamesQuery)
  .then((snapshot) => {
    return snapshot.docs.map((d) => d.data() as DocumentData);
  })
}

export async function loadPlayerStats(): Promise<[string, StatTuple][]> {
  const gamesPlayed = new Map<string, number>();

  return fetchGameData()
    .then((gameList) => {
      const gameStats = gameList.map((game) => {
        const players = Object.keys(game)
          .filter((key) => key !== "date" && key !== "teams")
          .reduce((obj, key) => {
            obj[key] = game[key];
            return obj;
          }, {} as GameStats);
        return players;
      });
      return gameStats;
    })
    .then((gameStats) => {
      const totals = gameStats.reduce((acc, game) => {
        for (const [player, stats] of Object.entries(game)) {
          if (!acc[player]) {
            acc[player] = statKeys.reduce((zeroes, key) => {
              zeroes[key] = 0;
              return zeroes;
            }, {} as StatTuple);
          }
          gamesPlayed.set(player, (gamesPlayed.get(player) ?? 0) + 1);
          // add each stat
          for (const key of statKeys) {
            acc[player][key] += stats[key] || 0;
          }
        }
        return acc;
      }, {} as GameStats);
      return totals;
    })
    .then((totals) => {
      return Object.entries(totals).map(([playerName, playerTotals]) => {
        const avgStats = statKeys.reduce((acc, key) => {
          const gp = gamesPlayed.get(playerName)!;
          acc[key] = parseFloat((playerTotals[key] / gp).toFixed(1));
          return acc;
        }, {} as StatTuple);
        // console.log(gamesPlayed);
        return [playerName, avgStats] as [string, StatTuple];
      });
    });
}

export default function PlayerData() {}
