import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { getDocClient, GAMES_TABLE_NAME } from "@/lib/dynamo";
import type { Game, Inning, NewGameInput, PlateAppearance, PlayResult, Player } from "@/lib/types";

/** Fetch a single game by id, or null if it doesn't exist. */
export async function getGame(id: string): Promise<Game | null> {
  const client = getDocClient();
  const result = await client.send(
    new GetCommand({ TableName: GAMES_TABLE_NAME, Key: { id } })
  );
  return result.Item ? (result.Item as Game) : null;
}

/**
 * List all games. A Scan is fine at scorecard scale; revisit with a GSI
 * (e.g. by date) if the table grows large.
 */
export async function listGames(): Promise<Game[]> {
  const client = getDocClient();
  const result = await client.send(
    new ScanCommand({ TableName: GAMES_TABLE_NAME })
  );
  const games = (result.Items ?? []) as Game[];
  return games.sort((a, b) => b.date.localeCompare(a.date));
}

/** Append a fresh empty inning to one team's innings, then persist. */
export async function addInning(
  id: string,
  side: "home" | "away"
): Promise<Game> {
  const game = await getGame(id);
  if (!game) {
    throw new Error(`Game ${id} not found`);
  }

  const innings = game[side].innings;
  const nextNumber =
    innings.length > 0 ? Math.max(...innings.map((i) => i.number)) + 1 : 1;
  const newInning: Inning = {
    number: nextNumber,
    plateAppearances: [],
    runs: 0,
    hits: 0,
    errors: 0,
  };

  const updated: Game = { ...game, updatedAt: new Date().toISOString() };
  updated[side] = { ...game[side], innings: [...innings, newInning] };
  return putGame(updated);
}

const PLAY_RESULTS = [
  "1B", "2B", "3B", "HR", "BB", "IBB", "HBP", "K", "ꓘ", "GO",
  "FO", "LO", "PO", "FC", "E", "SF", "SAC", "DP", "TP",
] as const;

function isLineupSpot(n: number): n is PlateAppearance["lineupSpot"] {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

function isValidBaseNumber(n: number): n is NonNullable<PlateAppearance["basesReached"]> {
  return Number.isInteger(n) && n >= 0 && n <= 4;
}

function isPlayResult(v: unknown): v is PlayResult {
  return typeof v === "string" && (PLAY_RESULTS as readonly string[]).includes(v);
}

export async function markBaseReached(
  id: string,
  _formData: FormData
): Promise<Game> {
  const game = await getGame(id);
  if (!game) {
    throw new Error(`Game ${id} not found`);
  }

  const side = _formData.get("side");
  if (side !== 'away' && side !== 'home') {
    throw new Error(`Invalid side: ${_formData.get("side")}`);
  }

  const inning = Number(_formData.get("inning"));
  if (!Number.isInteger(inning) || inning < 1) {
    throw new Error(`Invalid inning: ${_formData.get("inning")}`);
  }

  const spot = Number(_formData.get("lineupSpot"));
  if (!isLineupSpot(spot)) {
    throw new Error(`Invalid lineupSpot: ${_formData.get("lineupSpot")}`);
  }

  const result = _formData.get("playresult");
  if (!isPlayResult(result)) {
    throw new Error(`Invalid playresult: ${result}`);
  }

  const rbi = Number(_formData.get("rbi"));
  if (!Number.isInteger(rbi) || rbi < 0) {
    throw new Error(`Invalid inning: ${_formData.get("rbi")}`);
  }

  const passedBasesReached = Number(_formData.get("basesreached"));

  let basesReached = 0;
  if (!passedBasesReached) {
    if (result === "1B" || result === "BB" || result === "HBP") {
      basesReached = 1;
    } else if (result === "2B") {
      basesReached = 2;
    } else if (result === "3B") {
      basesReached = 3;
    } else if (result === "HR") {
      basesReached = 4;
    }
  } else {
    basesReached = passedBasesReached;
  }

  if(!isValidBaseNumber(basesReached)) {
    throw new Error(`Invalid number of bases: ${basesReached}`);
  }

  const batterId = _formData.get("batterId");
  if (typeof batterId !== "string" || batterId === "") {
    throw new Error(`Invalid batterId: ${batterId}`);
  }

  const inningIdx = inning - 1;
  const spotIndex = spot - 1;

  const newPlateAppearance: PlateAppearance = {
    result,
    batterId,
    lineupSpot: spot,
    basesReached,
    rbi
  };

  game[side].innings[inningIdx].plateAppearances[spotIndex] = newPlateAppearance;

  const updated: Game = { ...game, updatedAt: new Date().toISOString() };
  return putGame(updated);
}

/** Delete a game by id. Idempotent — succeeds even if it doesn't exist. */
export async function deleteGame(id: string): Promise<void> {
  const client = getDocClient();
  await client.send(
    new DeleteCommand({ TableName: GAMES_TABLE_NAME, Key: { id } })
  );
}

/** Persist a game (full overwrite). */
export async function putGame(game: Game): Promise<Game> {
  const client = getDocClient();
  await client.send(
    new PutCommand({ TableName: GAMES_TABLE_NAME, Item: game })
  );
  return game;
}

/**
 * Build and persist a fresh game. Pass `lineups` to seed the batting orders
 * (e.g. from AI research); omit for empty lineups.
 */
export async function createGame(
  input: NewGameInput,
  lineups?: { home: Player[]; away: Player[] }
): Promise<Game> {
  const now = new Date().toISOString();
  const game: Game = {
    id: randomUUID(),
    date: input.date,
    status: "scheduled",
    home: { name: input.homeTeam, players: lineups?.home ?? [], innings: [] },
    away: { name: input.awayTeam, players: lineups?.away ?? [], innings: [] },
    createdAt: now,
    updatedAt: now,
  };
  return putGame(game);
}
