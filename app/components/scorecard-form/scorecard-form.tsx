"use client";

import { useState } from "react";

import { PlateAppearance, Player } from "@/lib/types";

import styles from "./scorecard-form.module.scss";

import { savePlateAppearance, deletePlateAppearance } from "./actions";
import Link from "next/link";

import BaseAdvanceOptions from "./base-advance-options";
import SelectPositionPlayer from "./select-position-player";

export default function ScorecardForm({ gameId, side, batter, inning, lineupSpot, plateAppearance }: { gameId: string, side: string, batter: Player, inning: number, lineupSpot: PlateAppearance["lineupSpot"], plateAppearance?: PlateAppearance }) {
  const [showOutDetailsModal, setShowOutDetailsModal] = useState(false);
  const [balls, setBalls] = useState(plateAppearance?.atBat?.count?.balls ?? 0);
  const [strikes, setStrikes] = useState(plateAppearance?.atBat?.count?.strikes ?? 0);
  // Local, editable copy of the PA. Selecting a result updates this immediately so
  // the diamond + result heading react; nothing is persisted until the form is saved.
  const [pa, setPa] = useState<PlateAppearance>(
    plateAppearance ?? { batterId: batter.id, lineupSpot }
  );
  // The fielding sequence lives here (not inside SelectPositionPlayer) so it
  // survives the Out Details modal unmounting. Seeded from the out advance, if any.
  const [fielders, setFielders] = useState<number[]>(
    plateAppearance?.advances?.find((a) => a.fielders?.length)?.fielders ?? []
  );

  // Sequential boxes: box i is checkable only once box i-1 is checked. Toggling
  // box i sets the count to i (checking) or i-1 (unchecking the highest box),
  // so the count is always the number of consecutive boxes filled.
  const pitchBoxes = (count: number, setCount: (n: number) => void, max: number) =>
    Array.from({ length: max }, (_, idx) => {
      const i = idx + 1;
      return (
        <label key={i}>
          {i}
          <input
            type="checkbox"
            checked={count >= i}
            disabled={i > count + 1}
            onChange={(e) => setCount(e.target.checked ? i : i - 1)}
          />
        </label>
      );
    });

  return (
    <form className="container page" action={savePlateAppearance.bind(null, gameId)}>
      <Link href={`/game/${gameId}/${side}`}>Go Back</Link>
      <input type="hidden" name="side" value={side} />
      <input type="hidden" name="inning" value={inning} />
      <input type="hidden" name="lineupSpot" value={lineupSpot} />
      <input type="hidden" name="batterId" value={batter.id} />
      {/* Rendered here, outside the Out Details modal, so the sequence still
          submits even when the modal is toggled closed. */}
      {fielders.map((f, i) => (
        <input key={i} type="hidden" name={`fielder${i}`} value={f} />
      ))}
      <h1>{batter.name}</h1>
      <p>Batting {lineupSpot} in inning {inning}</p>


      <section className={styles["scorecard-form"]}>
        <fieldset className={styles["scorecard-form__results"]}>
          <legend>Play Result</legend>
          <fieldset className={styles["scorecard-form__results-sub-list"]}>
            <legend>On Base</legend>
            {(["BB", "HBP", "1B", "2B", "3B", "HR"] as const).map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="playresult"
                  value={r}
                  defaultChecked={pa.result === r}
                  onChange={() => setPa((p) => ({ ...p, result: r }))}
                />
                {r}
              </label>
            ))}
          </fieldset>
          <fieldset className={styles["scorecard-form__results-sub-list"]}>
            <legend>Out</legend>
            {(["GO","FO","LO","PO","FC","E","SF","SAC","DP","TP"] as const).map((r) => (
              <label key={r}>
                <input
                  type="radio"
                  name="playresult"
                  value={r}
                  defaultChecked={pa.result === r}
                  onChange={() => setPa((p) => ({ ...p, result: r }))}
                />
                {r}
              </label>
            ))}
          </fieldset>
        </fieldset>


        <div className={styles["scorecard-form__diamond-container"]}>
          <div className={`${styles["scorecard-form__diamond"]} ${styles[`bases-reached-${pa.basesReached}`]}`}>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-1"]}`}>
              <input type="radio" name="basesreached" value="1" defaultChecked={pa.basesReached === 1} />
              <BaseAdvanceOptions baseNumber={1} />
            </label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-2"]}`}>
              <input type="radio" name="basesreached" value="2" defaultChecked={pa.basesReached === 2} />
            </label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-3"]}`}>
              <input type="radio" name="basesreached" value="3" defaultChecked={pa.basesReached === 3} />
            </label>
            <label className={`${styles["scorecard-form__diamond-base-line"]} ${styles["scorecard-form__diamond-base-line-4"]}`}>
              <input type="radio" name="basesreached" value="4" defaultChecked={pa.basesReached === 4} />
            </label>
            <h2 className={styles["scorecard-form__result-hero"]}>{pa.advances?.length && pa.advances[0].fielders?.length ? `${pa.advances[0].fielders?.join("-")}` : ''}{pa.result}</h2>
          </div>
          <label><input type="radio" name="playresult" value="ꓘ" defaultChecked={pa.result === "ꓘ"} />ꓘ</label>
          <label><input type="radio" name="playresult" value="K" defaultChecked={pa.result === "K"} />K</label>

          <label className={styles["scorecard-form__rbis"]}>RBIs <input type="number" name="rbi" defaultValue={pa.rbi} /></label>

          <div className={styles["scorecard-form__out"]}>
            {showOutDetailsModal && (
              <div className={styles["scorecard-form__out-details"]}>
                <button onClick={() => setShowOutDetailsModal((v) => !v)} className="btn">Close</button>
                <SelectPositionPlayer value={fielders} onChange={setFielders} />
              </div>
            )}
            <div><label><input type="checkbox" name="out" value="true" defaultChecked={plateAppearance?.out} />Player Out</label></div>
            <div><label><input type="checkbox" name="scored" value="true" defaultChecked={plateAppearance?.scored} />Player Scored</label></div>
            <div><button className="btn" type="button" onClick={() => setShowOutDetailsModal((v) => !v)}>Out Details</button></div>
            <fieldset>
              <legend>Out Number</legend>
              <label><input type="radio" name="outNumber" value="1" defaultChecked={plateAppearance?.outNumber === 1} />1</label>
              <label><input type="radio" name="outNumber" value="2" defaultChecked={plateAppearance?.outNumber === 2} />2</label>
              <label><input type="radio" name="outNumber" value="3" defaultChecked={plateAppearance?.outNumber === 3} />3</label>
            </fieldset>
          </div>

        </div>
        <div className={styles["scorecard-form__pitch-count"]}>
          <input type="hidden" name="balls" value={balls} />
          <input type="hidden" name="strikes" value={strikes} />
          <fieldset>
            <legend>Balls</legend>
            {pitchBoxes(balls, setBalls, 4)}
          </fieldset>
          <fieldset>
            <legend>Strikes</legend>
            {pitchBoxes(strikes, setStrikes, 3)}
          </fieldset>
        </div>
      </section>
      <button className="btn" type="submit">Save</button>
      <button className="btn" type="submit" formAction={deletePlateAppearance.bind(null, gameId, side, inning, lineupSpot)}>Delete Plate Appearance</button>
    </form>
  )
}