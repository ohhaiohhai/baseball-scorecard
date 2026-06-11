import { Game } from "@/lib/types";
import styles from "./game-team-toggle.module.scss";
import Link from "next/link";

export default function GameTeamToggle({ game, side }: {game: Game, side: string}) {
  return (
    <nav className={styles["team-toggle"]}>
      <Link className={`btn ${side === "away" && "btn--primary"}`} href={`/game/${game.id}/away`}>{game.away.name} (away team)</Link>
      <Link className={`btn ${side === "home" && "btn--primary"}`} href={`/game/${game.id}/home`}>{game.home.name} (home team)</Link>
    </nav>
  )
}