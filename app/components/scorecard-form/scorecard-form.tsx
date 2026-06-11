import { PlateAppearance, Player } from "@/lib/types";

import styles from "./scorecard-form.module.scss";

import { markBaseReached } from "./actions";
import Link from "next/link";

export default function ScorecardForm({ gameId, side, batter, inning, lineupSpot, plateAppearance }: { gameId: string, side: string, batter: Player, inning: number, lineupSpot: number, plateAppearance?: PlateAppearance }) {
  return (
    <form className="container page" action={markBaseReached.bind(null, gameId)}>
      <Link href={`/game/${gameId}/${side}`}>Go Back</Link>
      <input type="hidden" name="side" value={side} />
      <input type="hidden" name="inning" value={inning} />
      <input type="hidden" name="lineupSpot" value={lineupSpot} />
      <input type="hidden" name="batterId" value={batter.id} />
      <h1>{batter.name}</h1>
      <p>Batting {lineupSpot} in inning {inning}</p>
      <section className={styles["scorecard-form"]}>
        <fieldset className={styles["scorecard-form__hit"]}>
          <legend>On Base</legend>
          <label><input type="radio" name="playresult" value="BB" defaultChecked={plateAppearance?.result === "BB"} />BB</label>
          <label><input type="radio" name="playresult" value="HBP" defaultChecked={plateAppearance?.result === "HBP"} />HBP</label>
          <label><input type="radio" name="playresult" value="1B" defaultChecked={plateAppearance?.result === "1B"} />1B</label>
          <label><input type="radio" name="playresult" value="2B" defaultChecked={plateAppearance?.result === "2B"} />2B</label>
          <label><input type="radio" name="playresult" value="3B" defaultChecked={plateAppearance?.result === "3B"} />3B</label>
          <label><input type="radio" name="playresult" value="HR" defaultChecked={plateAppearance?.result === "HR"} />HR</label>
        </fieldset>
        <div className={styles["scorecard-form__diamond-container"]}>
          <div className={`${styles["scorecard-form__diamond"]} ${styles[`bases-reached-${plateAppearance?.basesReached}`]}`}>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-1"]}`}><input type="radio" name="basesreached" value="1" /></label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-2"]}`}><input type="radio" name="basesreached" value="2" /></label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-3"]}`}><input type="radio" name="basesreached" value="3" /></label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-4"]}`}><input type="radio" name="basesreached" value="4" /></label>
          </div>
          <h2 className={styles["scorecard-form__result"]}>{plateAppearance?.result}</h2>
          <label><input type="radio" name="playresult" value="ꓘ" defaultChecked={plateAppearance?.result === "ꓘ"} />ꓘ</label>
          <label><input type="radio" name="playresult" value="K" defaultChecked={plateAppearance?.result === "K"} />K</label>
          <label className={styles["scorecard-form__rbis"]}>RBIs <input type="number" name="rbi" value={plateAppearance?.rbi} /></label>
        </div>
        <div className={styles["scorecard-form__pitch-count"]}>
          <fieldset>
            <legend>Balls</legend>
            <label>1<input type="checkbox" /></label>
            <label>2<input type="checkbox" disabled /></label>
            <label>3<input type="checkbox" disabled /></label>
            <label>4<input type="checkbox" disabled /></label>
          </fieldset>
          <fieldset>
            <legend>Strikes</legend>
            <label>1<input type="checkbox" /></label>
            <label>2<input type="checkbox" disabled /></label>
            <label>3<input type="checkbox" disabled /></label>
          </fieldset>
        </div>
      </section>
      <button type="submit">Save</button>
    </form>
  )
}