"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  savePlateAppearance as savePlateAppearancedInGame,
  deletePlateAppearance as deletePlateAppearancedInGame
} from "@/lib/games";

/**
 * Server Action: record a plate appearance, refresh the game pages, then
 * navigate back to the team's scorecard. Bind gameId in the component:
 * `savePlateAppearance.bind(null, id)`; `side` rides in via the form's hidden input.
 */
export async function savePlateAppearance(
  gameId: string,
  _formData: FormData
) {
  const side = _formData.get("side");

  await savePlateAppearancedInGame(gameId, _formData);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/${side}`);

  // Must come last and stay outside any try/catch — redirect() works by
  // throwing NEXT_REDIRECT, which aborts the rest of the action.
  redirect(`/game/${gameId}/${side}`);
}

/**
 * Server Action: delete a plate appearance, refresh the game pages, then
 * navigate back to the team's scorecard. Bind every arg in the component:
 * `deletePlateAppearance.bind(null, gameId, side, inning, lineupSpot)`.
 * When wired via `formAction`, React appends FormData as a trailing arg we ignore.
 */
export async function deletePlateAppearance(
  gameId: string,
  side: string,
  inning: number,
  lineupSpot: number
) {
  await deletePlateAppearancedInGame(gameId, side, inning, lineupSpot);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/${side}`);

  // Must come last and stay outside any try/catch — redirect() throws NEXT_REDIRECT.
  redirect(`/game/${gameId}/${side}`);
}