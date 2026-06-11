"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { MLB_TEAMS } from "@/lib/mlb-teams";

export default function NewGameForm() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState<null | "blank" | "ai">(null);

  async function create(autofill: boolean) {
    const form = formRef.current;
    if (!form) return;
    if (!form.reportValidity()) return;

    setPending(autofill ? "ai" : "blank");
    const data = new FormData(form);

    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        date: data.get("date"),
        awayTeam: data.get("awayTeam"),
        homeTeam: data.get("homeTeam"),
        autofill,
      }),
    });

    if (res.ok) {
      const game = await res.json();
      router.push(`/game/${game.id}`);
    } else {
      setPending(null);
    }
  }

  return (
    <form
      ref={formRef}
      className="card"
      onSubmit={(e) => {
        e.preventDefault();
        create(false);
      }}
    >
      <h2>New game</h2>
      <div className="page" style={{ paddingBlock: 0 }}>
        <label>
          <div className="muted">Date</div>
          <input className="btn" type="date" name="date" required />
        </label>

        <label>
          <div className="muted">Away team</div>
          <select className="btn" name="awayTeam" defaultValue="" required>
            <option value="" disabled>
              Select away team…
            </option>
            {MLB_TEAMS.map((t) => (
              <option key={`away-${t.id}`} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <div className="muted">Home team</div>
          <select className="btn" name="homeTeam" defaultValue="" required>
            <option value="" disabled>
              Select home team…
            </option>
            {MLB_TEAMS.map((t) => (
              <option key={`home-${t.id}`} value={t.label}>
                {t.label}
              </option>
            ))}
          </select>
        </label>

        <div className="page" style={{ paddingBlock: 0, gap: "0.5rem" }}>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={pending !== null}
          >
            {pending === "blank" ? "Creating…" : "Start scorecard"}
          </button>

          <button
            className="btn"
            type="button"
            disabled={pending !== null}
            onClick={() => create(true)}
          >
            {pending === "ai" ? "Researching lineups…" : "Start with AI rosters"}
          </button>

          {pending === "ai" && (
            <span className="muted">
              Searching sports news for probable lineups — this can take up to a
              minute.
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
