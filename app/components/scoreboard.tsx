import type { Game, Inning } from "@/lib/types";
import styles from "./scoreboard.module.scss";

function totalRuns(innings: Inning[]): number {
  return innings.reduce((sum, inning) => sum + (inning.runs ?? 0), 0);
}

export default function Scoreboard({ game }: { game: Game }) {
  // Always show at least 9 columns, more if either team has extra innings.
  const inningCount = Math.max(
    9,
    game.away.innings.length,
    game.home.innings.length
  );
  const columns = Array.from({ length: inningCount }, (_, i) => i + 1);

  const rows = [
    { key: "away", name: game.away.name || "Away", innings: game.away.innings },
    { key: "home", name: game.home.name || "Home", innings: game.home.innings },
  ];

  return (
    <div className={styles.scoreboard}>
      <div className={styles.grid}>
        <div className={styles.row}>
          <span className={`${styles.team} ${styles.label}`}>Team</span>
          {columns.map((n) => (
            <span key={n} className={`${styles.cell} ${styles.label}`}>
              {n}
            </span>
          ))}
          <span className={`${styles.cell} ${styles.label}`}>R</span>
        </div>

        {rows.map((row) => (
          <div key={row.key} className={styles.row}>
            <span className={styles.team}>{row.name}</span>
            {columns.map((n) => {
              const inning = row.innings.find((inn) => inn.number === n);
              return (
                <span key={n} className={styles.cell}>
                  {inning?.runs ?? "·"}
                </span>
              );
            })}
            <span className={`${styles.cell} ${styles.total}`}>
              {totalRuns(row.innings)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
