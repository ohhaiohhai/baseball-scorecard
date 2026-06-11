import { PlateAppearance } from "@/lib/types";

import styles from "./diamond.module.scss";
import Link from "next/link";

export default function diamond({ editPath, plateAppearance }: { editPath: string, plateAppearance?: PlateAppearance }) {
  return (
    <div className={`${styles["diamond-container"]} ${styles[`bases-reached-${plateAppearance?.basesReached}`]}`}>
      <Link href={editPath}>{plateAppearance?.result ? plateAppearance?.result : "+"}</Link>
      <div className={styles.diamond}></div>
      {plateAppearance?.rbi && (
        <span className={styles["diamond-rbi"]}>{plateAppearance.rbi}</span>
      )}
    </div>
  )
};