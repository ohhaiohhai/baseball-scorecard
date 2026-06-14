"use client";

// =============================================================================
// Client-side game store — React Context + useReducer.
//
// Pattern: the server fetches the Game (source of truth) and seeds <GameProvider>.
// Components read state via useGame() and change it by dispatching actions through
// useGameDispatch(). Derived values (runs, etc.) are pure SELECTORS over the state,
// never stored. Reuse this shape for other client state across the app.
// =============================================================================

import {
  createContext,
  useContext,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

import { scored } from "@/lib/types";
import type { Game, Inning, PlateAppearance } from "@/lib/types";

// --- Actions ---------------------------------------------------------------
// Every way the game state can change is one entry in this union. The reducer
// handles each `type`; adding a feature means adding an action + a case.
export type GameAction =
  | { type: "SET_GAME"; game: Game }
  | {
      type: "RECORD_PLATE_APPEARANCE";
      side: "home" | "away";
      inning: number;
      lineupSpot: number;
      plateAppearance: PlateAppearance;
    };

// --- Reducer ---------------------------------------------------------------
// Pure (state, action) => nextState. Must be immutable: never mutate `state`;
// always return new objects/arrays for the parts that changed.
function gameReducer(state: Game, action: GameAction): Game {
  switch (action.type) {
    case "SET_GAME":
      return action.game;

    case "RECORD_PLATE_APPEARANCE": {
      const { side, inning, lineupSpot, plateAppearance } = action;
      const team = state[side];
      const innings = team.innings.map((inn) => {
        if (inn.number !== inning) return inn;
        const plateAppearances = [...inn.plateAppearances];
        plateAppearances[lineupSpot - 1] = plateAppearance;
        return { ...inn, plateAppearances };
      });
      return { ...state, [side]: { ...team, innings } };
    }

    default:
      return state;
  }
}

// --- Contexts --------------------------------------------------------------
// Split state and dispatch into two contexts: components that only dispatch
// won't re-render when state changes, and vice-versa.
const GameStateContext = createContext<Game | null>(null);
const GameDispatchContext = createContext<Dispatch<GameAction> | null>(null);

export function GameProvider({
  initialGame,
  children,
}: {
  initialGame: Game;
  children: ReactNode;
}) {
  const [game, dispatch] = useReducer(gameReducer, initialGame);

  return (
    <GameStateContext.Provider value={game}>
      <GameDispatchContext.Provider value={dispatch}>
        {children}
      </GameDispatchContext.Provider>
    </GameStateContext.Provider>
  );
}

// --- Hooks -----------------------------------------------------------------
// Throw if used outside the provider so mistakes fail loudly, not silently.
export function useGame(): Game {
  const game = useContext(GameStateContext);
  if (game === null) {
    throw new Error("useGame must be used within a <GameProvider>");
  }
  return game;
}

export function useGameDispatch(): Dispatch<GameAction> {
  const dispatch = useContext(GameDispatchContext);
  if (dispatch === null) {
    throw new Error("useGameDispatch must be used within a <GameProvider>");
  }
  return dispatch;
}

// --- Selectors -------------------------------------------------------------
// Pure functions deriving values from state. Keep them here so every consumer
// (scoreboard now, box score later) computes runs the same way.
export function runnerScored(pa: PlateAppearance): boolean {
  // Source of truth is `advances` (via scored()); honor the legacy basesReached
  // scalar too while the save path still half-populates advances.
  return scored(pa) || pa.basesReached === 4;
}

export function inningRuns(inning: Inning): number {
  return inning.plateAppearances.filter((pa) => pa && runnerScored(pa)).length;
}

export function totalRuns(innings: Inning[]): number {
  return innings.reduce((sum, inn) => sum + inningRuns(inn), 0);
}
