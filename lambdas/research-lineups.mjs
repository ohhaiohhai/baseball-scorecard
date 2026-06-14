// =============================================================================
// research-lineups Lambda
//
// Async (InvocationType: "Event") worker that pre-populates a game's batting
// orders from AI + web search, then writes the rosters back to DynamoDB.
//
// Event payload (from app/api/games/route.ts → lib/autofill.ts):
//   { gameId, awayLabel, homeLabel, date }
//
// On success it sets home.players / away.players + autofillStatus="done".
// On failure it sets autofillStatus="error" + autofillError. It never throws
// back to the caller — the result lives entirely in the game record, which the
// client polls (see app/components/autofill-status.tsx).
//
// Runtime: nodejs20.x — the AWS SDK v3 and global `fetch`/`crypto` are built in,
// so this file has NO dependencies to bundle. Zip it on its own and upload.
//   ANTHROPIC_API_KEY, DYNAMO_GAMES_TABLE_NAME, DYNAMO_REGION are env vars.
// =============================================================================

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";

const TABLE_NAME = process.env.DYNAMO_GAMES_TABLE_NAME || "baseball-scorecard-games";
const REGION = process.env.DYNAMO_REGION || "us-east-2";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

const MODEL = "claude-opus-4-8";
const POSITIONS = ["P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH"];

function getDocClient() {
  return DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }), {
    // Player jersey numbers are optional and may be undefined.
    marshallOptions: { removeUndefinedValues: true },
  });
}

// Structured shape we coax out of the research notes (call 2). Mirrors the zod
// ResearchSchema in lib/anthropic.ts. Structured outputs require every property
// to be required with additionalProperties:false — nullable, not optional.
const rosterPlayerSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    position: { type: "string", enum: POSITIONS },
    number: { type: ["string", "null"] },
  },
  required: ["name", "position", "number"],
  additionalProperties: false,
};

const teamRosterSchema = {
  type: "object",
  properties: {
    battingOrder: { type: "array", items: rosterPlayerSchema },
    startingPitcher: rosterPlayerSchema,
  },
  required: ["battingOrder", "startingPitcher"],
  additionalProperties: false,
};

const researchSchema = {
  type: "object",
  properties: {
    away: teamRosterSchema,
    home: teamRosterSchema,
    uncertain: { type: "boolean" },
    asOf: { type: "string" },
  },
  required: ["away", "home", "uncertain", "asOf"],
  additionalProperties: false,
};

async function anthropic(body) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Anthropic API error ${response.status}: ${await response.text()}`);
  }
  return response.json();
}

// --- Call 1: research with web search ---------------------------------------
async function runResearch({ awayLabel, homeLabel, date }) {
  const tools = [{ type: "web_search_20260209", name: "web_search" }];
  const prompt = `You are pre-populating a baseball scorecard. Using web search, find the most likely starting lineup (the batting order of 9 hitters with their fielding positions) and the probable starting pitcher for BOTH teams in this game:

  ${awayLabel} (away) at ${homeLabel} (home), on ${date}.

Search recent sports news, "probable pitchers", and lineup/roster reports. If the exact lineup for that date isn't posted yet, fall back to the team's most common recent lineup and treat it as uncertain. For each player give their full name, fielding position, and jersey number if you can find it. Report your findings as concise notes per team.`;

  const messages = [{ role: "user", content: prompt }];

  let response = await anthropic({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    tools,
    messages,
  });

  // Server-side web search runs its own loop; resume on pause_turn.
  let guard = 0;
  while (response.stop_reason === "pause_turn" && guard++ < 5) {
    messages.push({ role: "assistant", content: response.content });
    response = await anthropic({
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      tools,
      messages,
    });
  }

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

// --- Call 2: structure the notes -------------------------------------------
async function structureNotes(notes) {
  const response = await anthropic({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract the two teams' starting lineups and starting pitchers from these research notes. Use the batting order as given (1-9). If a jersey number is unknown, use null. Set "uncertain" to true if the notes indicate the lineup is projected rather than confirmed.\n\nNOTES:\n${notes}`,
      },
    ],
    output_config: { format: { type: "json_schema", schema: researchSchema } },
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");

  if (!text) throw new Error("Could not structure lineup research");
  return JSON.parse(text);
}

function toPlayers(roster) {
  const players = roster.battingOrder.map((p) => ({
    id: randomUUID(),
    name: p.name,
    position: p.position,
    number: p.number ?? undefined,
  }));
  // With the universal DH the pitcher usually isn't in the batting order.
  players.push({
    id: randomUUID(),
    name: roster.startingPitcher.name,
    position: "P",
    number: roster.startingPitcher.number ?? undefined,
  });
  return players;
}

export const handler = async (event) => {
  const { gameId, awayLabel, homeLabel, date } = event ?? {};
  console.log("[research-lineups] start", { gameId, awayLabel, homeLabel, date });

  if (!gameId || !awayLabel || !homeLabel || !date) {
    console.error("[research-lineups] missing fields in event", { gameId });
    return;
  }

  const docClient = getDocClient();

  try {
    const notes = await runResearch({ awayLabel, homeLabel, date });
    const structured = await structureNotes(notes);

    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: gameId },
        UpdateExpression:
          "SET home.players = :hp, away.players = :ap, autofillStatus = :st, updatedAt = :u REMOVE autofillError",
        ExpressionAttributeValues: {
          ":hp": toPlayers(structured.home),
          ":ap": toPlayers(structured.away),
          ":st": "done",
          ":u": new Date().toISOString(),
        },
      })
    );
    console.log("[research-lineups] done", {
      gameId,
      uncertain: structured.uncertain,
      asOf: structured.asOf,
    });
  } catch (err) {
    console.error("[research-lineups] error", { gameId, error: String(err) });
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { id: gameId },
        UpdateExpression: "SET autofillStatus = :st, autofillError = :err, updatedAt = :u",
        ExpressionAttributeValues: {
          ":st": "error",
          ":err": err instanceof Error ? err.message : String(err),
          ":u": new Date().toISOString(),
        },
      })
    );
  }
};
