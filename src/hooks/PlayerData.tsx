import { collection, getDocs } from "firebase/firestore";

import { db } from "../firebase";
export const gameData = await getDocs(collection(db, "games"));
const gameList:object[] = [];
export const test = await gameData.forEach((doc) => {
    const data = doc.data();
    gameList.push(data);
})

export type StatTuple = Record<"pts"|"reb"|"ast"|"blk"|"stl"|"fga"|"fgm"|"tpa"|"tpm", number>;
type GameStats = Record<string, StatTuple>;

export const statKeys: (keyof StatTuple)[] = [
  "pts","reb","ast","blk","stl","fga","fgm","tpa","tpm"
];

// frequency map of the number of games each player played
const gamesPlayed = new Map<string, number>();

const gameStats = gameList.map((game) => {
    const players = Object.keys(game).filter(key => key !== "date" && key !== "teams").reduce((obj, key) => {
        obj[key] = game[key];
        return obj;
    }, {});
    return players;
});

export const totals: GameStats = gameStats.reduce((acc, game) => {
  for (const [player, stats] of Object.entries(game)) {
    // ensure there’s a slot for this player
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

export const average = Object.entries(totals).map(([playerName, playerTotals]) => {
    const avgStats = statKeys.reduce((acc, key) => {
        acc[key] = (playerTotals[key] / gamesPlayed.get(playerName)).toFixed(1);
        return acc;
    }, {} as StatTuple);

    return [playerName, avgStats] as [string, StatTuple];
})

export default function PlayerData() {}
