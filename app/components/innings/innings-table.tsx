// import { TeamLineup } from "@lib/types";
import Link from "next/link";

import { Inning } from "@/lib/types";

import styles from "./innings-table.module.scss"

import Diamond from "@/app/components/diamond/diamond";

export default function InningsTable({ innings, gameId, team }: { innings: Inning[]; gameId: string; team: string }) {
  return (
    <ul className={styles["innings-table"]}>
      {innings.map(inning => (
        <li key={inning.number}>
          <h4 className={styles["innings-table__heading"]}>{inning.number}</h4>
          <ul>
            {Array(9).fill({}).map((obj, i) => (
              <li key={i} className={styles["innings-row"]}>
                {inning.plateAppearances.filter((pA) => pA.lineupSpot === i + 1)[0]?.result ? (
                  <Diamond editPath={`/game/${gameId}/${team}/${inning.number}/${i + 1}`} plateAppearance={inning.plateAppearances.filter((pA) => pA.lineupSpot === i + 1)[0]} />
                ) : (
                  <Diamond editPath={`/game/${gameId}/${team}/${inning.number}/${i + 1}`} />
                )}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  )
}