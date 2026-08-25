// MCBL Mayhem — shared presentational pieces.
import { chemistryOf, hasOffensiveEngine, type MayhemCard } from "./engine";
import type { PlayerBox } from "./sim";

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

export function yearTag(year: number): string {
  return `'${String(year).slice(2)}`;
}

export function PlayerFace({
  name,
  className = "w-16 h-16",
}: {
  name: string;
  className?: string;
}) {
  const img = getImage(name);
  return img ? (
    <img
      src={img}
      alt={name}
      className={`${className} rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100`}
    />
  ) : (
    <div
      className={`${className} rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xl font-semibold text-gray-400`}
    >
      {name.charAt(0)}
    </div>
  );
}

const CARD_STATS: { label: string; get: (c: MayhemCard) => string }[] = [
  { label: "PPG", get: (c) => c.avg.pts.toFixed(1) },
  { label: "RPG", get: (c) => c.avg.reb.toFixed(1) },
  { label: "APG", get: (c) => c.avg.ast.toFixed(1) },
  { label: "SPG", get: (c) => c.avg.stl.toFixed(1) },
  { label: "BPG", get: (c) => c.avg.blk.toFixed(1) },
  { label: "FG%", get: (c) => (c.avg.fgPct * 100).toFixed(0) + "%" },
];

export function DraftCard({
  card,
  onClick,
  detailed = false,
}: {
  card: MayhemCard;
  onClick?: () => void;
  /** Expands strengths into a full labelled list instead of compact pills. */
  detailed?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`relative bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col items-center gap-3 transition-all ${
        onClick ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-gray-300" : ""
      }`}
    >
      <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-gray-800 text-white text-xs font-bold tabular-nums">
        {yearTag(card.year)}
      </span>
      {card.champion && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-yellow-300 text-yellow-900 text-xs font-bold">
          🏆 CHAMPS
        </span>
      )}
      <PlayerFace name={card.name} className="w-24 h-24 mt-4" />
      <div className="text-center">
        <div className="text-lg font-bold text-text-secondary leading-tight">{card.name}</div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mt-0.5">
          {card.teamName} · {card.year}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-px w-full bg-gray-100 rounded-lg overflow-hidden">
        {CARD_STATS.map(({ label, get }) => (
          <div key={label} className="flex flex-col items-center py-2 bg-gray-50">
            <span className="text-base font-bold tabular-nums text-text-secondary">{get(card)}</span>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {label}
            </span>
          </div>
        ))}
      </div>
      {/* Standout strengths — what this player can pull off that others can't.
          Compact pills hover to reveal; the detailed view spells them all out. */}
      {card.strengths.length > 0 && (
        <div className="w-full rounded-lg bg-emerald-50 border border-emerald-100 px-3 py-2">
          {detailed ? (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px]">💪</span>
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                  Strengths
                </span>
              </div>
              {card.strengths.map((st) => (
                <div key={st.id}>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider">
                    {st.label}
                  </span>
                  <p className="text-[11px] text-emerald-600 leading-snug mt-1">{st.detail}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-wrap">
              <span className="text-[10px]">💪</span>
              {card.strengths.map((st) => (
                <span key={st.id} className="relative group/tip">
                  <span className="block px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider cursor-help">
                    {st.label}
                  </span>
                  <span
                    role="tooltip"
                    className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-1.5 w-44 -translate-x-1/2 rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-medium leading-snug text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover/tip:opacity-100"
                  >
                    <span className="block font-bold text-emerald-300 uppercase tracking-wider text-[9px]">
                      {st.label}
                    </span>
                    {st.detail}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Blaring weakness — every player has one, and it costs you */}
      <div className="w-full rounded-lg bg-red-50 border border-red-100 px-3 py-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[10px]">⚠️</span>
          <span className="text-[11px] font-bold text-red-600 uppercase tracking-wider">
            {card.weakness.label}
          </span>
          {card.weakness.interiorOnly && (
            <span className="px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-bold uppercase tracking-wider">
              🚫 No Jumper
            </span>
          )}
          {card.weakness.soft && (
            <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider">
              🧸 Soft
            </span>
          )}
        </div>
        <p className="text-[11px] text-red-400 leading-snug mt-0.5">{card.weakness.detail}</p>
      </div>
      <span className="text-[11px] text-gray-300 font-medium">{card.gp} games played</span>
    </div>
  );
}

// Roster-construction readout: former teammates help, a squad with no
// playmaker gets punished. Shown as flavor — the underlying numbers stay hidden.
export function TeamTraits({ cards }: { cards: MayhemCard[] }) {
  const chem = chemistryOf(cards);
  const engine = hasOffensiveEngine(cards);
  if (chem === "none" && engine) return null;
  return (
    <div className="flex items-center justify-center gap-2 flex-wrap">
      {chem === "full" && (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-bold uppercase tracking-wider">
          🔥 Full Squad Chemistry
        </span>
      )}
      {chem === "pair" && (
        <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 text-[11px] font-bold uppercase tracking-wider">
          🤝 Former Teammates
        </span>
      )}
      {!engine && (
        <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wider">
          ⚠️ No Playmaker
        </span>
      )}
    </div>
  );
}

export function MiniPlayer({ card }: { card: MayhemCard }) {
  return (
    <div className="flex items-center gap-2">
      <PlayerFace name={card.name} className="w-9 h-9" />
      <div className="leading-tight">
        <div className="text-sm font-semibold text-text-secondary whitespace-nowrap">
          {card.name}
        </div>
        <div className="text-[11px] text-gray-400 font-medium">
          {yearTag(card.year)}
          {card.champion && <span className="ml-1">🏆</span>}
        </div>
      </div>
    </div>
  );
}

export function TeamFaces({
  cards,
  size = "w-14 h-14",
}: {
  cards: MayhemCard[];
  size?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-4 flex-wrap">
      {cards.map((c) => (
        <div key={c.id} className="flex flex-col items-center gap-1.5">
          <PlayerFace name={c.name} className={size} />
          <span className="text-xs font-semibold text-text-secondary whitespace-nowrap">
            {c.name} <span className="text-gray-400">{yearTag(c.year)}</span>
          </span>
        </div>
      ))}
    </div>
  );
}

export function BoxScoreTable({
  title,
  box,
  highlight,
}: {
  title: string;
  box: PlayerBox[];
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className={`text-sm font-semibold uppercase tracking-wider ${
          highlight ? "text-text-secondary" : "text-gray-400"
        }`}
      >
        {title}
      </span>
      <div className="overflow-x-auto rounded-lg border border-gray-100">
        <table className="table-auto w-full bg-white">
          <thead>
            <tr className="bg-gray-200 text-gray-600 text-xs font-semibold uppercase tracking-wider">
              <th className="px-3 py-2 text-left">Player</th>
              <th className="px-3 py-2 text-right">PTS</th>
              <th className="px-3 py-2 text-right">REB</th>
              <th className="px-3 py-2 text-right">AST</th>
              <th className="px-3 py-2 text-right">STL</th>
              <th className="px-3 py-2 text-right">BLK</th>
              <th className="px-3 py-2 text-right">FG</th>
              <th className="px-3 py-2 text-right">3PT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {box.map(({ card, line }) => (
              <tr key={card.id} className="text-sm even:bg-white odd:bg-gray-50">
                <td className="px-3 py-2 font-semibold text-text-secondary whitespace-nowrap">
                  {card.name}{" "}
                  <span className="text-gray-400 font-medium">{yearTag(card.year)}</span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-text-primary">
                  {line.pts}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-primary">{line.reb}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-primary">{line.ast}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-primary">{line.stl}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-primary">{line.blk}</td>
                <td className="px-3 py-2 text-right tabular-nums text-text-tertiary">
                  {line.fgm}-{line.fga}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-text-tertiary">
                  {line.tpm}-{line.tpa}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BigButton({
  children,
  onClick,
  variant = "dark",
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "dark" | "light";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg px-6 py-3 font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed ${
        variant === "dark"
          ? "bg-gray-800 text-white hover:bg-gray-700 shadow-sm"
          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-800"
      }`}
    >
      {children}
    </button>
  );
}
