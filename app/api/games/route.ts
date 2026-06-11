import { NextResponse } from "next/server";
import { aiConfigured, researchLineups } from "@/lib/anthropic";
import { createGame, listGames } from "@/lib/games";
import type { NewGameInput } from "@/lib/types";

// Web search + two model calls can take a while.
export const maxDuration = 60;

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

  // Optional: use AI + web search to pre-populate rosters. On any failure we
  // fall back to an empty scorecard rather than blocking game creation.
  console.log(
    `[ai] autofill requested=${Boolean(body.autofill)} aiConfigured=${aiConfigured()}`
  );
  if (body.autofill && aiConfigured()) {
    try {
      const rosters = await researchLineups({
        awayLabel: input.awayTeam,
        homeLabel: input.homeTeam,
        date: input.date,
      });
      const game = await createGame(input, {
        home: rosters.home,
        away: rosters.away,
      });
      return NextResponse.json(game, { status: 201 });
    } catch (e) {
      console.error("[ai] Roster autofill failed; creating empty game:", e);
    }
  }

  const game = await createGame(input);
  return NextResponse.json(game, { status: 201 });
}
