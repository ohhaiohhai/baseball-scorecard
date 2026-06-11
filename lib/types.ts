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
  rbi?: number;
  basesReached?: 0 | 1 | 2 | 3 | 4;
  scored?: boolean;
  /** Freeform scorebook notation. */
  notation?: string;
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

export interface Game {
  id: string;
  /** ISO-8601 date of the game. */
  date: string;
  status: GameStatus;
  home: TeamLineup;
  away: TeamLineup;
  createdAt: string;
  updatedAt: string;
}

/** Shape accepted when creating a new game. */
export interface NewGameInput {
  date: string;
  homeTeam: string;
  awayTeam: string;
}
