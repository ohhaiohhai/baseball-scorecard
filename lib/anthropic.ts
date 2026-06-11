import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Player } from "@/lib/types";

const MODEL = "claude-opus-4-8";
const POSITIONS = [
  "P", "C", "1B", "2B", "3B", "SS", "LF", "CF", "RF", "DH",
] as const;

// Set AI_DEBUG=1 in .env.local to trace the lineup pipeline in the dev terminal.
const DEBUG = process.env.AI_DEBUG === "1";
function debug(label: string, value?: unknown) {
  if (!DEBUG) return;
  if (value === undefined) {
    console.log(`[ai] ${label}`);
  } else {
    console.log(`[ai] ${label}:`, typeof value === "string" ? value : JSON.stringify(value, null, 2));
  }
}

// --- Structured shape we coax out of the research notes ----------------------
const RosterPlayerSchema = z.object({
  name: z.string(),
  position: z.enum(POSITIONS),
  // Jersey number if known, else null. (Structured outputs prefer nullable over
  // optional — every property stays required with additionalProperties: false.)
  number: z.string().nullable(),
});

const TeamRosterSchema = z.object({
  battingOrder: z.array(RosterPlayerSchema),
  startingPitcher: RosterPlayerSchema,
});

const ResearchSchema = z.object({
  away: TeamRosterSchema,
  home: TeamRosterSchema,
  // True when the lineup is a best-guess (e.g. official card not yet posted).
  uncertain: z.boolean(),
  // Short note on what the data is based on (date, source recency).
  asOf: z.string(),
});

export interface ResearchedRosters {
  home: Player[];
  away: Player[];
  uncertain: boolean;
  asOf: string;
}

/** True only when an API key is configured — lets callers skip the AI path. */
export function aiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

/**
 * Use web search to find the probable starting lineups + starting pitchers for
 * a matchup, then structure the findings. Two calls on purpose: web search
 * attaches citations to its response, which are incompatible with structured
 * outputs in a single call — so we research first (call 1) and structure the
 * notes second (call 2).
 */
export async function researchLineups(args: {
  awayLabel: string;
  homeLabel: string;
  date: string;
}): Promise<ResearchedRosters> {
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  debug("researchLineups args", args);

  const notes = await runResearch(client, args);
  const structured = await structureNotes(client, notes);

  const result = {
    away: toPlayers(structured.away),
    home: toPlayers(structured.home),
    uncertain: structured.uncertain,
    asOf: structured.asOf,
  };
  debug("final player counts", {
    away: result.away.length,
    home: result.home.length,
    uncertain: result.uncertain,
  });
  return result;
}

// --- Call 1: research with web search ---------------------------------------
async function runResearch(
  client: Anthropic,
  { awayLabel, homeLabel, date }: { awayLabel: string; homeLabel: string; date: string }
): Promise<string> {
  const tools = [
    { type: "web_search_20260209" as const, name: "web_search" as const },
  ];
  const prompt = `You are pre-populating a baseball scorecard. Using web search, find the most likely starting lineup (the batting order of 9 hitters with their fielding positions) and the probable starting pitcher for BOTH teams in this game:

  ${awayLabel} (away) at ${homeLabel} (home), on ${date}.

Search recent sports news, "probable pitchers", and lineup/roster reports. If the exact lineup for that date isn't posted yet, fall back to the team's most common recent lineup and treat it as uncertain. For each player give their full name, fielding position, and jersey number if you can find it. Report your findings as concise notes per team.`;

  const messages: Anthropic.MessageParam[] = [{ role: "user", content: prompt }];

  let response = await client.messages.create({
    model: MODEL,
    max_tokens: 8192,
    thinking: { type: "adaptive" },
    tools,
    messages,
  });

  // Server-side web search runs its own loop; resume on pause_turn.
  let guard = 0;
  while (response.stop_reason === "pause_turn" && guard++ < 5) {
    debug(`pause_turn — resuming (round ${guard})`);
    messages.push({ role: "assistant", content: response.content });
    response = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      thinking: { type: "adaptive" },
      tools,
      messages,
    });
  }

  debug("research stop_reason", response.stop_reason);
  debug("research content block types", response.content.map((b) => b.type));

  const notes = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  debug("research notes length", notes.length);
  debug("research notes", notes || "(EMPTY — web search produced no text)");
  return notes;
}

// --- Call 2: structure the notes -------------------------------------------
async function structureNotes(
  client: Anthropic,
  notes: string
): Promise<z.infer<typeof ResearchSchema>> {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `Extract the two teams' starting lineups and starting pitchers from these research notes. Use the batting order as given (1-9). If a jersey number is unknown, use null. Set "uncertain" to true if the notes indicate the lineup is projected rather than confirmed.\n\nNOTES:\n${notes}`,
      },
    ],
    output_config: { format: zodOutputFormat(ResearchSchema) },
  });

  debug("structure stop_reason", response.stop_reason);
  debug("structure parsed_output", response.parsed_output ?? "(null — parse failed)");

  if (!response.parsed_output) {
    // Surface the raw text so you can see what the model actually returned.
    const raw = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n");
    debug("structure raw text (unparsed)", raw);
    throw new Error("Could not structure lineup research");
  }
  return response.parsed_output;
}

function toPlayers(roster: z.infer<typeof TeamRosterSchema>): Player[] {
  const players: Player[] = roster.battingOrder.map((p) => ({
    id: randomUUID(),
    name: p.name,
    position: p.position,
    number: p.number ?? undefined,
  }));
  // Append the starting pitcher (with the universal DH, the pitcher usually
  // isn't in the batting order).
  players.push({
    id: randomUUID(),
    name: roster.startingPitcher.name,
    position: "P",
    number: roster.startingPitcher.number ?? undefined,
  });
  return players;
}
