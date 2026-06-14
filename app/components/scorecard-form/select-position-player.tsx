"use client";

import { useState } from "react";

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
  /** The position currently picked but not yet committed. */
  const [current, setCurrent] = useState<number | null>(null);
  /** True once the sequence is finalized (via "Select"). */
  const [done, setDone] = useState(false);

  const commit = (addAnother: boolean) => {
    if (current === null) return;
    onChange([...value, current]);
    setCurrent(null);
    if (!addAnother) setDone(true);
  };

  const reset = () => {
    onChange([]);
    setCurrent(null);
    setDone(false);
  };

  const radio = (n: number) => (
    <label key={n}>
      {n}
      <input
        type="radio"
        name="position-pick"
        value={n}
        checked={current === n}
        disabled={done}
        onChange={() => setCurrent(n)}
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

      {done ? (
        <button className="btn" type="button" onClick={reset}>
          Reset
        </button>
      ) : (
        <>
          <button
            className="btn"
            type="button"
            disabled={current === null}
            onClick={() => commit(false)}
          >
            Select
          </button>
          <button
            className="btn"
            type="button"
            disabled={current === null}
            onClick={() => commit(true)}
          >
            Select and Add
          </button>
        </>
      )}
    </div>
  );
}
