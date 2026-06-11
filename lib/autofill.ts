import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { researchLineups } from "@/lib/anthropic";
import { getGame, putGame } from "@/lib/games";
import type { Game } from "@/lib/types";

const FUNCTION_NAME =
  process.env.RESEARCH_LINEUPS_FUNCTION_NAME ||
  "baseball-scorecard-research-lineups";

/**
 * In production the heavy AI + web-search work runs in a dedicated Lambda; the
 * Amplify SSR compute would otherwise block (and may be capped) for the full
 * ~30–90s. Locally there's no Lambda, so we run the same work inline in the
 * Next dev server. `USE_LAMBDA=1` forces the Lambda path (e.g. to test it).
 */
function shouldUseLambda(): boolean {
  return process.env.USE_LAMBDA === "1" || process.env.NODE_ENV === "production";
}

/**
 * Kick off roster autofill for a game that was just created with
 * `autofillStatus: "processing"`. Fire-and-forget: returns immediately, the
 * result is written back to the game record (see the research-lineups Lambda /
 * `runLocalAutofill` below). The client polls until the status flips.
 */
export async function triggerAutofill(args: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  date: string;
}): Promise<void> {
  if (shouldUseLambda()) {
    console.log("[autofill] invoking lambda", FUNCTION_NAME, args.gameId);
    const lambda = new LambdaClient({
      region: process.env.DYNAMO_REGION || "us-east-2",
    });
    await lambda.send(
      new InvokeCommand({
        FunctionName: FUNCTION_NAME,
        InvocationType: "Event", // async fire-and-forget
        Payload: Buffer.from(JSON.stringify(args)),
      })
    );
    return;
  }

  // Local dev: run inline, but don't block the response. Errors are persisted
  // onto the game record rather than thrown.
  console.log("[autofill] running inline (local dev path)", args.gameId);
  void runLocalAutofill(args).catch((err) =>
    console.error("[autofill] local autofill error", err)
  );
}

/**
 * Inline equivalent of the research-lineups Lambda, used in local dev. Calls
 * Anthropic, then writes the rosters (or an error) back onto the game record.
 */
export async function runLocalAutofill(args: {
  gameId: string;
  awayLabel: string;
  homeLabel: string;
  date: string;
}): Promise<void> {
  const { gameId, awayLabel, homeLabel, date } = args;
  try {
    const rosters = await researchLineups({ awayLabel, homeLabel, date });
    const game = await getGame(gameId);
    if (!game) {
      console.error("[autofill] game vanished before autofill completed", gameId);
      return;
    }
    const updated: Game = {
      ...game,
      home: { ...game.home, players: rosters.home },
      away: { ...game.away, players: rosters.away },
      autofillStatus: "done",
      updatedAt: new Date().toISOString(),
    };
    delete updated.autofillError;
    await putGame(updated);
    console.log("[autofill] inline done", gameId);
  } catch (err) {
    console.error("[autofill] inline error", { gameId, err: String(err) });
    const game = await getGame(gameId);
    if (!game) return;
    await putGame({
      ...game,
      autofillStatus: "error",
      autofillError: err instanceof Error ? err.message : String(err),
      updatedAt: new Date().toISOString(),
    });
  }
}
