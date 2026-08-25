// Seeds the untracked 2023 MCBL season into Firestore as hand-crafted box scores.
//
// 2023 lore:
//   - Jah Jah Pelicans (jjp): Rayan Bilkhu, Jae Hyune Yea (leader), James Lee.
//     3-0 regular season, won the championship 20-7 in the finals — the only
//     perfect undefeated MCBL run ever.
//   - Lapu Lapu Soldiers (lls): Jirah Almario, Matthew Kim, Brandon Wong.
//     2-1, lost the finals after playing semis + finals back-to-back.
//     Brandon shot plenty, scored nothing, played no defense.
//   - ChangHai Sharks (dt): Nathean Moore, David Chang, Brenin Moore.
//     1-2, out in the semis. Brenin = secondary stretch-four scorer.
//   - Vancouver Vincents (ns): Vincent Kang, Connor Maclean, Lex Rowheder.
//     0-3, out in the first round. Connor rarely passed, casual defense.
//
// Usage:
//   node scripts/seed2023.mjs --dry    # validate + print, no writes
//   node scripts/seed2023.mjs          # upload to Firestore
//   node scripts/seed2023.mjs --delete # remove all seeded 2023 docs
//
// Docs use deterministic IDs (mcbl2023-*) so the script is idempotent and
// the seeded season is easy to identify or remove later.

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(join(root, ".env"), "utf8")
    .split(/\r?\n/)
    .filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const KEY = env.VITE_API_KEY;
const BASE = "https://firestore.googleapis.com/v1/projects/mcbl-app/databases/(default)/documents";

// stat line: [pts, tpm, fga, tpa, reb, ast, stl, blk, fta]
// fgm is derived (pts - tpm), ftm is always 0 so pts === fgm + tpm holds.
const S = (pts, tpm, fga, tpa, reb, ast, stl, blk, fta = 0) => ({
  pts, tpm, fgm: pts - tpm, fga, tpa, reb, ast, stl, blk, fta, ftm: 0,
});

const GAMES = [
  // ---- Regular season, day 1 ----
  {
    id: "mcbl2023-rs1", date: "2023-06-11T19:05:00.000Z",
    team1: "jjp", team2: "lls", playoffs: false, fouls: [0, 0],
    box: {
      "Jae Hyune Yea": S(6, 1, 20, 6, 4, 2, 1, 0),
      "Rayan Bilkhu":  S(3, 0, 10, 0, 11, 1, 0, 2),
      "James Lee":     S(2, 0, 6, 0, 5, 2, 2, 0),
      "Jirah Almario": S(5, 2, 17, 9, 8, 1, 1, 0),
      "Matthew Kim":   S(2, 0, 8, 0, 12, 0, 2, 0),
      "Brandon Wong":  S(0, 0, 9, 6, 3, 0, 0, 0),
    },
  },
  {
    id: "mcbl2023-rs2", date: "2023-06-11T20:10:00.000Z",
    team1: "dt", team2: "ns", playoffs: false, fouls: [0, 0],
    box: {
      "David Chang":    S(5, 0, 14, 2, 6, 2, 1, 0),
      "Brenin Moore":   S(4, 1, 12, 5, 7, 1, 1, 0),
      "Nathean Moore":  S(2, 0, 6, 0, 14, 0, 1, 1),
      "Vincent Kang":   S(5, 1, 17, 10, 10, 0, 1, 1),
      "Connor Maclean": S(2, 0, 9, 3, 4, 0, 0, 0),
      "Lex Rowheder":   S(1, 0, 5, 1, 6, 1, 1, 0),
    },
  },
  {
    id: "mcbl2023-rs3", date: "2023-06-11T21:15:00.000Z",
    team1: "jjp", team2: "ns", playoffs: false, fouls: [0, 0],
    box: {
      "Jae Hyune Yea":  S(5, 1, 18, 5, 5, 1, 0, 0),
      "Rayan Bilkhu":   S(4, 0, 12, 0, 12, 0, 1, 1),
      "James Lee":      S(2, 0, 5, 0, 4, 3, 2, 0),
      "Vincent Kang":   S(3, 0, 16, 9, 11, 1, 1, 0),
      "Connor Maclean": S(2, 1, 10, 5, 3, 0, 0, 0),
      "Lex Rowheder":   S(0, 0, 4, 1, 7, 1, 0, 0),
    },
  },
  // ---- Regular season, day 2 ----
  {
    id: "mcbl2023-rs4", date: "2023-07-09T19:05:00.000Z",
    team1: "lls", team2: "dt", playoffs: false, fouls: [0, 0],
    box: {
      "Jirah Almario": S(7, 2, 20, 11, 9, 1, 2, 0),
      "Matthew Kim":   S(4, 0, 9, 0, 13, 1, 1, 0),
      "Brandon Wong":  S(0, 0, 11, 7, 2, 1, 0, 0),
      "David Chang":   S(4, 1, 15, 4, 5, 1, 2, 0),
      "Brenin Moore":  S(3, 1, 11, 6, 6, 0, 0, 1),
      "Nathean Moore": S(2, 0, 7, 0, 15, 1, 0, 1),
    },
  },
  {
    id: "mcbl2023-rs5", date: "2023-07-09T20:10:00.000Z",
    team1: "jjp", team2: "dt", playoffs: false, fouls: [0, 0],
    box: {
      "Jae Hyune Yea": S(7, 2, 19, 8, 4, 1, 1, 0),
      "Rayan Bilkhu":  S(2, 0, 9, 0, 10, 1, 0, 1),
      "James Lee":     S(2, 0, 6, 1, 5, 2, 1, 0),
      "David Chang":   S(3, 0, 13, 3, 7, 1, 1, 0),
      "Brenin Moore":  S(2, 1, 10, 5, 5, 1, 1, 0),
      "Nathean Moore": S(1, 0, 5, 0, 12, 0, 1, 1),
    },
  },
  {
    id: "mcbl2023-rs6", date: "2023-07-09T21:15:00.000Z",
    team1: "lls", team2: "ns", playoffs: false, fouls: [0, 0],
    box: {
      "Jirah Almario":  S(8, 3, 19, 10, 7, 0, 1, 0),
      "Matthew Kim":    S(3, 0, 8, 0, 11, 1, 2, 0),
      "Brandon Wong":   S(0, 0, 8, 5, 4, 0, 0, 0),
      "Vincent Kang":   S(5, 2, 18, 11, 9, 0, 1, 0),
      "Connor Maclean": S(2, 1, 11, 4, 3, 1, 0, 0),
      "Lex Rowheder":   S(1, 0, 6, 2, 8, 0, 1, 0),
    },
  },
  // ---- Playoffs ----
  {
    // First round: Vincents eliminated
    id: "mcbl2023-po1", date: "2023-07-30T19:05:00.000Z",
    team1: "dt", team2: "ns", playoffs: true, fouls: [2, 1],
    box: {
      "David Chang":    S(6, 1, 16, 4, 6, 2, 1, 0),
      "Brenin Moore":   S(6, 2, 13, 7, 8, 1, 1, 0),
      "Nathean Moore":  S(3, 0, 8, 0, 16, 0, 1, 2),
      "Vincent Kang":   S(6, 2, 21, 12, 12, 1, 1, 1, 1),
      "Connor Maclean": S(3, 0, 12, 4, 4, 0, 1, 0),
      "Lex Rowheder":   S(1, 0, 5, 1, 7, 1, 0, 0),
    },
  },
  {
    // Semifinal: Sharks eliminated, Soldiers straight into the finals
    id: "mcbl2023-po2", date: "2023-07-30T20:15:00.000Z",
    team1: "lls", team2: "dt", playoffs: true, fouls: [1, 2],
    box: {
      "Jirah Almario": S(10, 3, 23, 12, 9, 1, 2, 0, 1),
      "Matthew Kim":   S(5, 0, 11, 0, 14, 0, 1, 0),
      "Brandon Wong":  S(0, 0, 10, 6, 3, 0, 0, 0),
      "David Chang":   S(5, 1, 17, 5, 6, 1, 1, 0),
      "Brenin Moore":  S(4, 1, 12, 6, 7, 0, 1, 0),
      "Nathean Moore": S(2, 0, 6, 0, 13, 1, 0, 1),
    },
  },
  {
    // Finals: the 20-7 blowout that sealed the perfect Pelicans run
    id: "mcbl2023-po3", date: "2023-07-30T21:20:00.000Z",
    team1: "jjp", team2: "lls", playoffs: true, fouls: [1, 3],
    box: {
      "Jae Hyune Yea": S(11, 3, 26, 9, 6, 2, 2, 0, 2),
      "Rayan Bilkhu":  S(5, 0, 13, 0, 13, 1, 0, 2),
      "James Lee":     S(4, 0, 9, 0, 6, 3, 2, 0),
      "Jirah Almario": S(5, 1, 18, 9, 7, 0, 1, 0),
      "Matthew Kim":   S(2, 0, 9, 0, 10, 1, 1, 0),
      "Brandon Wong":  S(0, 0, 7, 5, 2, 0, 0, 0),
    },
  },
];

const ROSTER = {
  "Jae Hyune Yea": "jjp", "Rayan Bilkhu": "jjp", "James Lee": "jjp",
  "Jirah Almario": "lls", "Matthew Kim": "lls", "Brandon Wong": "lls",
  "David Chang": "dt", "Brenin Moore": "dt", "Nathean Moore": "dt",
  "Vincent Kang": "ns", "Connor Maclean": "ns", "Lex Rowheder": "ns",
};

// ---- validate + assemble docs ----
const docs = [];
const records = {};
for (const g of GAMES) {
  const score = [0, 0];
  for (const [player, s] of Object.entries(g.box)) {
    if (s.pts !== s.fgm + s.tpm) throw new Error(`${g.id} ${player}: pts != fgm+tpm`);
    if (s.fgm > s.fga || s.tpm > s.tpa || s.tpa > s.fga || s.tpm > s.fgm)
      throw new Error(`${g.id} ${player}: impossible shooting line`);
    const team = ROSTER[player];
    if (team === g.team1) score[0] += s.pts;
    else if (team === g.team2) score[1] += s.pts;
    else throw new Error(`${g.id} ${player}: not on either team`);
  }
  const winner = score[0] > score[1] ? g.team1 : g.team2;
  const loser = winner === g.team1 ? g.team2 : g.team1;
  if (!g.playoffs) {
    records[winner] = records[winner] || [0, 0];
    records[loser] = records[loser] || [0, 0];
    records[winner][0]++;
    records[loser][1]++;
  }
  docs.push({
    id: g.id,
    data: {
      ...g.box,
      date: g.date,
      teams: { team1: g.team1, team2: g.team2, score, fouls: g.fouls, playoffs: g.playoffs, winner },
    },
  });
}

console.log("2023 season validated. Regular season records:", records);
for (const d of docs) {
  const t = d.data.teams;
  console.log(` ${d.id} | ${t.playoffs ? "PO" : "RS"} | ${t.team1} ${t.score[0]} - ${t.score[1]} ${t.team2} -> ${t.winner}`);
}

// ---- Firestore typed-JSON encoding ----
function encode(value) {
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(encode) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, encode(v)])) } };
}

const mode = process.argv.includes("--delete") ? "delete" : process.argv.includes("--dry") ? "dry" : "upload";

if (mode === "dry") {
  console.log("\nDry run — nothing written.");
} else if (mode === "delete") {
  for (const d of docs) {
    const resp = await fetch(`${BASE}/games/${d.id}?key=${KEY}`, { method: "DELETE" });
    console.log(`deleted ${d.id}: ${resp.status}`);
  }
} else {
  for (const d of docs) {
    const fields = Object.fromEntries(Object.entries(d.data).map(([k, v]) => [k, encode(v)]));
    // PATCH with a full document acts as create-or-replace at a fixed ID
    const resp = await fetch(`${BASE}/games/${d.id}?key=${KEY}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fields }),
    });
    const body = await resp.json();
    if (!resp.ok) {
      console.error(`FAILED ${d.id}:`, JSON.stringify(body));
      process.exit(1);
    }
    console.log(`wrote ${d.id}`);
  }
  console.log("\nAll 9 games uploaded.");
}
