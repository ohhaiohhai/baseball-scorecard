import { PlateAppearance } from "@/lib/types";

import styles from "./diamond.module.scss";
import Link from "next/link";

export default function diamond({ editPath, plateAppearance }: { editPath: string, plateAppearance?: PlateAppearance }) {
  const plateAppearanceText = [];
  plateAppearanceText.push(plateAppearance?.advances?.length ? plateAppearance?.advances[0].fielders?.join(''): '');
  plateAppearanceText.push(plateAppearance?.result ? plateAppearance?.result : "+")
  return (
    <div className={`${styles["diamond-container"]} ${styles[`bases-reached-${plateAppearance?.basesReached}`]} ${plateAppearance?.scored && styles["diamond-container--scored"]}`}>
      <Link href={editPath}>{plateAppearanceText.join('')}</Link>
      <div className={styles.diamond}></div>
      {plateAppearance?.out && (
        <span className={styles["diamond__out-number"]}>{plateAppearance.outNumber}</span>
      )}
      {Number(plateAppearance?.rbi) > 0 && (
        <span className={styles["diamond__rbi"]}>{plateAppearance?.rbi}</span>
      )}
    </div>
  )
};