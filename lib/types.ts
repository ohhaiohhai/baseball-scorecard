// =============================================================================
// Domain model for a baseball scorecard.
// These shapes are stored directly as DynamoDB items (partition key: `id`).
// =============================================================================

export type Position =
  | "P"
  | "C"
  | "1B"
  | "2B"
  | "3B"
  | "SS"
  | "LF"
  | "CF"
  | "RF"
  | "DH";

/**
 * Scorekeeping position numbers. These drive notation like "5-4-3": the ball
 * traveled 3B (5) -> 2B (4) -> 1B (3). The DH never takes the field, so it has
 * no number. Classic gotcha: 3B is 5 and SS is 6.
 */
export type FieldingPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const POSITION_NUMBER: Record<Exclude<Position, "DH">, FieldingPosition> = {
  P: 1, C: 2, "1B": 3, "2B": 4, "3B": 5, SS: 6, LF: 7, CF: 8, RF: 9,
};

export const NUMBER_POSITION: Record<FieldingPosition, Exclude<Position, "DH">> = {
  1: "P", 2: "C", 3: "1B", 4: "2B", 5: "3B", 6: "SS", 7: "LF", 8: "CF", 9: "RF",
};

export interface Player {
  id: string;
  name: string;
  /** Jersey number, kept as a string to preserve leading zeros. */
  number?: string;
  position?: Position;
}

export interface TeamLineup {
  name: string;
  /** Batting order. */
  players: Player[];
  /** This team's own innings (the team bats through each one). */
  innings: Inning[];
}

/**
 * Result of a single plate appearance using common scorebook shorthand.
 * `notation` carries freeform scoring detail (e.g. "6-3", "F8", "K looking").
 */
export type PlayResult =
  | "1B" // Single
  | "2B" // Double
  | "3B" // Triple
  | "HR" // Home run
  | "BB" // Base on Balls
  | "IBB" // intentional walk
  | "HBP" // hit by pitcj
  | "K" // strikeout swinging
  | "ꓘ" // strikeout looking
  | "GO" // ground out
  | "FO" // fly out
  | "LO" // line out
  | "PO" // popout
  | "FC" // fielder's choice
  | "E" // error
  | "SF" // sac fly
  | "SAC" // sac bunt
  | "DP" // double play
  | "TP"; // triple play

export type PitchOutcome =
  | "ball"
  | "called_strike"
  | "swinging_strike"
  | "foul"
  | "in_play"
  | "hit_by_pitch";

export interface Pitch {
  outcome: PitchOutcome;
  /** Optional radar reading in mph. */
  velocity?: number;
}

/** Ball/strike count. Balls 0–3, strikes 0–2 before the PA resolves. */
export interface Count {
  balls: number;
  strikes: number;
}

/**
 * A single batter's turn against a pitcher, tracked pitch-by-pitch. The at-bat
 * resolves to a `PlayResult`. Note the official-stat distinction: walks,
 * hit-by-pitch, sacrifices, and catcher's interference are plate appearances
 * but are NOT charged as at-bats — see `PlateAppearance.countsAsAtBat`.
 */
export interface AtBat {
  batterId: string;
  pitcherId?: string;
  pitches: Pitch[];
  count: Count;
  result?: PlayResult;
}

/**
 * How a runner got from one base to the next (or why they didn't). One value
 * per leg of the basepath; the out-bearing reasons (CS/PO) terminate the trip.
 */
export type AdvanceReason =
  | "hit" // the leg the batter earned on their own ball / BB / HBP (usually leg 1)
  | "SB" // stolen base
  | "CS" // caught stealing (out)
  | "PO" // picked off (out)
  | "WP" // wild pitch
  | "PB" // passed ball
  | "BK" // balk
  | "E" // error
  | "FC" // fielder's choice
  | "DI" // defensive indifference
  | "adv"; // advanced on another batter's play (generic)

/**
 * One leg of a runner's trip around the bases. The `base` is the destination,
 * which uniquely identifies the baseline (1→1B, 2→2B, 3→3B, 4→home). Every out
 * — at the plate or on the bases — is just a leg with `out: true`; a batter who
 * grounds out 6-3 is one leg `{ base: 1, reason: "hit", out: true, fielders: [6, 3] }`.
 */
export interface BaseAdvance {
  /** Destination base; this is the baseline. 4 = home. */
  base: 1 | 2 | 3 | 4;
  reason: AdvanceReason;
  /** Retired on this leg. Always true for CS/PO; set it for thrown-out-advancing. */
  out?: boolean;
  /** Which out of the half-inning (1–3), when `out`. */
  outNumber?: 1 | 2 | 3;
  /** Fielders on the play, in order. Caught stealing 2nd "2-6" -> [2, 6]. */
  fielders?: FieldingPosition[];
}

/**
 * One trip to the plate. Always a plate appearance; `countsAsAtBat` marks the
 * subset that also counts as an official at-bat. The pitch-level detail lives
 * on the embedded `atBat`.
 */
export interface PlateAppearance {
  batterId: string;
  /** Spot in the batting order this PA came up in (1–9). */
  lineupSpot: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  atBat?: AtBat;
  /** True for official at-bats; false for BB/IBB/HBP/SF/SAC/interference. */
  countsAsAtBat?: boolean;
  result?: PlayResult;
  /**
   * True if this batter/runner was retired — at the plate OR later on the bases.
   * The PA-level flag the scorecard reads directly (hits, LOB, outs-in-inning).
   * Not derivable from `result`: a runner can have result "1B" and still be out
   * on the bases. When `advances` is used, the leg with the out also sets its own
   * `BaseAdvance.out`; this flag is the quick top-level answer to "was this an out?".
   */
  out?: boolean;
  /**
   * Which out of the half-inning this was (1–3). Stored, not derived: outs happen
   * chronologically, but PAs are ordered by lineup spot and a runner's out occurs
   * during a *later* batter's PA — so the 1-2-3 order can't be reconstructed from
   * the array. Only meaningful when `out` is true.
   */
  outNumber?: 1 | 2 | 3;
  rbi?: number;
  /**
   * The runner's trip around the bases: up to 4 legs, ordered by base. A
   * terminal leg may carry the out. This is the source of truth for where the
   * runner ended up and how they were retired; `basesReached`/`scored` are
   * derived from it (see `basesReached()` / `scored()`).
   */
  advances?: BaseAdvance[];
  /** @deprecated Derive from `advances` via `basesReached()`. */
  basesReached?: 0 | 1 | 2 | 3 | 4;
  /** @deprecated Derive from `advances` via `scored()`. */
  scored?: boolean;
  /** Freeform scorebook notation. */
  notation?: string;
}

/** Highest base the runner safely reached (0 if they never left the box / were out at first). */
export function basesReached(pa: PlateAppearance): 0 | 1 | 2 | 3 | 4 {
  const lastSafe = (pa.advances ?? []).filter((a) => !a.out).at(-1);
  return lastSafe?.base ?? 0;
}

/** True if the runner crossed the plate (reached home safely). */
export function scored(pa: PlateAppearance): boolean {
  return basesReached(pa) === 4;
}

/** The leg on which this runner was retired, if any (carries out/outNumber/fielders). */
export function outAdvance(pa: PlateAppearance): BaseAdvance | undefined {
  return pa.advances?.find((a) => a.out);
}

/** A single team's half-frame: their turn at bat in one inning. */
export interface Inning {
  number: number;
  plateAppearances: PlateAppearance[];
  runs: number;
  hits: number;
  errors: number;
}

export type GameStatus = "scheduled" | "in_progress" | "final";

/** Lifecycle of the optional AI roster pre-fill (see lib/autofill.ts). */
export type AutofillStatus = "processing" | "done" | "error";

export interface Game {
  id: string;
  /** ISO-8601 date of the game. */
  date: string;
  status: GameStatus;
  home: TeamLineup;
  away: TeamLineup;
  createdAt: string;
  updatedAt: string;
  /**
   * Set only when a game was created with AI roster autofill. The rosters are
   * filled in asynchronously by the research-lineups Lambda; the client polls
   * this field. Absent on blank games.
   */
  autofillStatus?: AutofillStatus;
  /** Human-readable failure reason when `autofillStatus === "error"`. */
  autofillError?: string;
}

/** Shape accepted when creating a new game. */
export interface NewGameInput {
  date: string;
  homeTeam: string;
  awayTeam: string;
}
