"use client";

import styles from "./scorecard-form.module.scss";

export default function SelectPositionPlayer({
  value,
  onChange,
}: {
  /** The committed fielding sequence, owned by the parent (e.g. [6, 3]). */
  value: number[];
  /** Lift each change up to the parent so it survives this component unmounting. */
  onChange: (sequence: number[]) => void;
}) {
  // Each radio pick commits immediately — no "Add Next" click needed. The pick
  // is appended to the sequence, which flows up to the parent and re-renders the
  // hidden fielder inputs, and the running sequence shows in the <p> below.
  const pick = (n: number) => onChange([...value, n]);

  const reset = () => onChange([]);

  const radio = (n: number) => (
    <label key={n}>
      {n}
      <input
        type="radio"
        name="position-pick"
        value={n}
        // Controlled-but-never-checked: the <p> is the feedback, and keeping the
        // radios unchecked lets the same position be picked twice in a row (e.g. 1-1).
        checked={false}
        onChange={() => pick(n)}
      />
    </label>
  );

  return (
    <div>
      {value.length > 0 && <p>{value.join("-")}</p>}

      <div className={styles["full-field"]}>
        <div className={styles["in-field"]}>{[1, 2, 3, 4, 5, 6].map(radio)}</div>
        {[7, 8, 9].map(radio)}
      </div>

      {value.length > 0 && (
        <button className="btn" type="button" onClick={reset}>
          Reset
        </button>
      )}
    </div>
  );
}
