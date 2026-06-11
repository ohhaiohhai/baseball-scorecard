import { TeamLineup } from "@/lib/types";

import Roster from "@/app/components/roster/roster";
import InningsTable from "@/app/components/innings/innings-table";

import styles from "./scorecard.module.scss";

export default function Scorecard({ teamLineup, gameId, team  }: { teamLineup: TeamLineup, gameId: string, team: string }) {
  return (
    <section className={styles.scorecard}>
      <Roster players={teamLineup.players} />
      <InningsTable innings={teamLineup.innings} gameId={gameId} team={team} />
    </section>
  )
}