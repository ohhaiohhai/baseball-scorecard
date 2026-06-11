import { Player } from "@/lib/types";

import styles from "./roster.module.scss"

export default function Roster({ players }: { players: Player[] }) {
  return (
    <section className={styles.roster}>
      <h4>Roster</h4>
      <ul>
      {players.map(player => (
        <li className={styles["roster-row"]} key={player.id}>{player.position} {player.name}</li>
      ))}
    </ul>
    </section>
  )
}