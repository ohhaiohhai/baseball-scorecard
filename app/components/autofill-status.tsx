"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { AutofillStatus, Game } from "@/lib/types";

/**
 * Polls a game while its AI roster autofill is in flight (see lib/autofill.ts).
 * When the research-lineups Lambda finishes and flips `autofillStatus`, this
 * refreshes the server-rendered page so the new rosters appear; on error it
 * surfaces the reason. Renders nothing once autofill is done.
 */
export default function AutofillStatus({
  gameId,
  initialStatus,
  initialError,
}: {
  gameId: string;
  initialStatus: AutofillStatus;
  initialError?: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<AutofillStatus>(initialStatus);
  const [error, setError] = useState<string | undefined>(initialError);

  useEffect(() => {
    if (status !== "processing") return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/games/${gameId}`, { cache: "no-store" });
        if (res.ok) {
          const game = (await res.json()) as Game;
          if (cancelled) return;
          if (game.autofillStatus === "done") {
            setStatus("done");
            router.refresh(); // re-render the page with the filled-in rosters
            return;
          }
          if (game.autofillStatus === "error") {
            setStatus("error");
            setError(game.autofillError);
            return;
          }
        }
      } catch {
        // keep polling on transient errors
      }
      timer = setTimeout(poll, 3000);
    }

    timer = setTimeout(poll, 3000);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [status, gameId, router]);

  if (status === "done") return null;

  if (status === "error") {
    return (
      <p className="card muted" role="alert">
        Couldn’t auto-fill the rosters{error ? `: ${error}` : "."} You can still
        score the game and enter the lineups by hand.
      </p>
    );
  }

  return (
    <p className="card muted" aria-live="polite">
      Researching probable lineups from recent sports news — this can take up to
      a minute. The rosters will appear here automatically.
    </p>
  );
}
