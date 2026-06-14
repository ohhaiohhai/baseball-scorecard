import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { getDocClient, GAMES_TABLE_NAME } from "@/lib/dynamo";
import type { Game, Inning, NewGameInput, PlateAppearance, PlayResult, Player, BaseAdvance, FieldingPosition } from "@/lib/types";

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

function isOutNumber(n: number): n is NonNullable<PlateAppearance["outNumber"]> {
  return Number.isInteger(n) && n >= 1 && n <= 3;
}

function isFieldingPosition(n: number): n is FieldingPosition {
  return Number.isInteger(n) && n >= 1 && n <= 9;
}

function isAdvanceBase(n: number): n is BaseAdvance["base"] {
  return Number.isInteger(n) && n >= 1 && n <= 4;
}

function isPlayResult(v: unknown): v is PlayResult {
  return typeof v === "string" && (PLAY_RESULTS as readonly string[]).includes(v);
}

export async function deletePlateAppearance(
  id: string,
  side: string,
  inning: number,
  lineupSpot: number
): Promise<Game> {
  const game = await getGame(id);
  if (!game) {
    throw new Error(`Game ${id} not found`);
  }

  
  if (side !== 'away' && side !== 'home') {
    throw new Error(`Invalid side: ${side}`);
  }

  if (!Number.isInteger(inning) || inning < 1) {
    throw new Error(`Invalid inning: ${inning}`);
  }

  if (!isLineupSpot(lineupSpot)) {
    throw new Error(`Invalid lineupSpot: ${lineupSpot}`);
  }

  if(game[side].innings[inning - 1]?.plateAppearances?.filter((pA) => pA.lineupSpot === lineupSpot).length) {
    game[side].innings[inning - 1].plateAppearances = game[side].innings[inning - 1]?.plateAppearances?.filter((pA) => pA.lineupSpot !== lineupSpot)
  }

  const updated: Game = { ...game, updatedAt: new Date().toISOString() };
  return putGame(updated);
}

export async function savePlateAppearance(
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

  const scored = Boolean(_formData.get("scored"));

  const out = Boolean(_formData.get("out"));
  let outNumber: PlateAppearance["outNumber"];
  if (out) {
    const parsed = Number(_formData.get("outNumber"));
    if (!isOutNumber(parsed)) {
      throw new Error(`Invalid outNumber: ${_formData.get("outNumber")}`);
    }
    outNumber = parsed;
  }

  // Fielders are parsed independent of the "Player Out" checkbox: a fly out, an
  // error, or a runner thrown out advancing all carry a fielding sequence even
  // when the top-level `out` flag isn't set.
  const fielders: FieldingPosition[] = [];
  const fielder0 = Number(_formData.get("fielder0"));
  if (isFieldingPosition(fielder0)) {
    fielders.push(fielder0);
    const fielder1 = Number(_formData.get("fielder1"));
    if (isFieldingPosition(fielder1)) {
      fielders.push(fielder1);
      const fielder2 = Number(_formData.get("fielder2"));
      if (isFieldingPosition(fielder2)) {
        fielders.push(fielder2);
      }
    }
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


  let newBaseAdvances:BaseAdvance[] = [];

  let basesReached = 0;
  if (!passedBasesReached) {
    console.log("in if");
    if (result === "1B" || result === "BB" || result === "HBP") {
      basesReached = 1;
      newBaseAdvances.push({
        base: 1,
        reason: "hit"
      });
    } else if (result === "2B") {
      basesReached = 2;
      newBaseAdvances.push({
        base: 1,
        reason: "hit"
      });
      newBaseAdvances.push({
        base: 2,
        reason: "hit"
      });
    } else if (result === "3B") {
      basesReached = 3;
      newBaseAdvances.push({
        base: 1,
        reason: "hit"
      });
      newBaseAdvances.push({
        base: 2,
        reason: "hit"
      });
      newBaseAdvances.push({
        base: 3,
        reason: "hit"
      });
    } else if (result === "HR") {
      basesReached = 4;
    }
  } else {
    console.log("in else");
    basesReached = passedBasesReached;
    for (let i = 1; i <= basesReached; i++) {
      if (isAdvanceBase(i)) {
        newBaseAdvances.push({
          base: i,
          reason: "hit",
        });
      }
    }
  }

  if (["GO", "FO", "LO", "PO", "FC", "E", "SF", "SAC", "DP", "TP"].includes(result) && fielders.length > 0) {

    const advanceBase = basesReached + 1;
    if (!isAdvanceBase(advanceBase)) {
      throw new Error(`Invalid base for advance: ${advanceBase}`);
    }
    newBaseAdvances[basesReached] = {
      reason: 'adv',
      fielders,
      base: advanceBase,
      out: out || undefined,
      outNumber,
    };
  }


  if(!isValidBaseNumber(basesReached)) {
    throw new Error(`Invalid number of bases: ${basesReached}`);
  }

  const batterId = _formData.get("batterId");
  if (typeof batterId !== "string" || batterId === "") {
    throw new Error(`Invalid batterId: ${batterId}`);
  }

  const inningIdx = inning - 1;

  const newPlateAppearance: PlateAppearance = {
    result,
    batterId,
    lineupSpot: spot,
    basesReached,
    rbi,
    out: out,
    outNumber,
    advances: newBaseAdvances,
    scored
  };

  console.log("*****************");
  console.log(newPlateAppearance.advances?.length);

  // Replace the existing PA for this lineup spot if present, otherwise append.
  // Don't index by `spot - 1`: the stored array isn't aligned to lineup spot
  // (DynamoDB compacts sparse arrays on write), so an index write would leave the
  // old PA in place and stack a duplicate. The read path matches on `lineupSpot`.
  const plateAppearances = game[side].innings[inningIdx].plateAppearances;
  const existingIdx = plateAppearances.findIndex((pa) => pa.lineupSpot === spot);
  if (existingIdx >= 0) {
    plateAppearances[existingIdx] = newPlateAppearance;
  } else {
    plateAppearances.push(newPlateAppearance);
  }

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
 * (e.g. from AI research); omit for empty lineups. Pass
 * `autofillStatus: "processing"` when the rosters will be filled in
 * asynchronously by the research-lineups Lambda (see lib/autofill.ts).
 */
export async function createGame(
  input: NewGameInput,
  lineups?: { home: Player[]; away: Player[] },
  opts?: { autofillStatus?: Game["autofillStatus"] }
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
    ...(opts?.autofillStatus ? { autofillStatus: opts.autofillStatus } : {}),
  };
  return putGame(game);
}
