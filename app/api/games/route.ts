import { NextResponse } from "next/server";
import { aiConfigured } from "@/lib/anthropic";
import { triggerAutofill } from "@/lib/autofill";
import { createGame, listGames, putGame } from "@/lib/games";
import type { NewGameInput } from "@/lib/types";

export async function GET() {
  const games = await listGames();
  return NextResponse.json(games);
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<NewGameInput> & {
    autofill?: boolean;
  };

  if (!body.date || !body.homeTeam || !body.awayTeam) {
    return NextResponse.json(
      { error: "date, homeTeam and awayTeam are required" },
      { status: 400 }
    );
  }

  const input: NewGameInput = {
    date: body.date,
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
  };

  // Optional: pre-populate rosters with AI + web search. The work is offloaded
  // (a dedicated Lambda in prod, inline in dev) and the rosters are filled in
  // asynchronously — we create the game immediately as "processing" and return
  // it now; the client polls the game until autofill finishes (or errors).
  console.log(
    `[ai] autofill requested=${Boolean(body.autofill)} aiConfigured=${aiConfigured()}`
  );
  if (body.autofill && aiConfigured()) {
    const game = await createGame(input, undefined, {
      autofillStatus: "processing",
    });
    try {
      await triggerAutofill({
        gameId: game.id,
        awayLabel: input.awayTeam,
        homeLabel: input.homeTeam,
        date: input.date,
      });
    } catch (e) {
      // Couldn't even dispatch the work — surface it on the record so the
      // client stops waiting rather than polling forever.
      console.error("[ai] Failed to trigger roster autofill:", e);
      game.autofillStatus = "error";
      game.autofillError = "Could not start roster research.";
      await putGame(game);
    }
    return NextResponse.json(game, { status: 201 });
  }

  const game = await createGame(input);
  return NextResponse.json(game, { status: 201 });
}
