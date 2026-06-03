import { collection, getDocs, orderBy, query, type DocumentData } from "firebase/firestore";

import { db } from "../firebase";
export type StatTuple = Record<
  "pts" | "reb" | "ast" | "blk" | "stl" | "fga" | "fgm" | "tpa" | "tpm" | "fta" | "ftm",
  number
>;
type GameStats = Record<string, StatTuple>;

export type SeasonType = "all" | "regular" | "playoffs";

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

function filterBySeason(games: DocumentData[], seasonType: SeasonType): DocumentData[] {
  if (seasonType === "playoffs") return games.filter((g) => g.teams?.playoffs === true);
  if (seasonType === "regular") return games.filter((g) => !g.teams?.playoffs);
  return games;
}

export async function fetchGameData(seasonType: SeasonType = "all"): Promise<DocumentData[]> {
  const gamesQuery = query(
    collection(db, "games"),
    orderBy("date", "desc")
  );
  return getDocs(gamesQuery).then((snapshot) => {
    const docs = snapshot.docs.map((d) => d.data() as DocumentData);
    return filterBySeason(docs, seasonType);
  });
}

export async function fetchAvailableYears(seasonType: SeasonType = "all"): Promise<number[]> {
  return fetchGameData(seasonType).then((games) => {
    const years = new Set<number>();
    for (const game of games) {
      if (game.date) years.add(new Date(game.date).getFullYear());
    }
    return Array.from(years).sort((a, b) => a - b);
  });
}

export async function loadPlayerStats(year?: number, seasonType: SeasonType = "all"): Promise<[string, StatTuple][]> {
  const gamesPlayed = new Map<string, number>();

  return fetchGameData(seasonType)
    .then((gameList) => {
      const filtered = year
        ? gameList.filter((g) => g.date && new Date(g.date).getFullYear() === year)
        : gameList;
      const gameStats = filtered.map((game) => {
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
        return [playerName, avgStats] as [string, StatTuple];
      });
    });
}

export type StatTupleWithGP = StatTuple & { gp: number };

export async function loadPlayerStatsByYear(
  playerName: string,
  seasonType: SeasonType = "all"
): Promise<Record<number, StatTupleWithGP>> {
  return fetchGameData(seasonType).then((games) => {
    const byYear: Record<number, { totals: StatTuple; gp: number }> = {};
    for (const game of games) {
      const pStats = game[playerName];
      if (!pStats || !game.date) continue;
      const year = new Date(game.date).getFullYear();
      if (!byYear[year]) {
        byYear[year] = {
          totals: statKeys.reduce((z, k) => { z[k] = 0; return z; }, {} as StatTuple),
          gp: 0,
        };
      }
      byYear[year].gp++;
      for (const key of statKeys) byYear[year].totals[key] += pStats[key] || 0;
    }
    return Object.fromEntries(
      Object.entries(byYear).map(([y, { totals, gp }]) => [
        Number(y),
        {
          ...statKeys.reduce((avg, k) => {
            avg[k] = parseFloat((totals[k] / gp).toFixed(1));
            return avg;
          }, {} as StatTuple),
          gp,
        },
      ])
    );
  });
}

export default function PlayerData() {}
