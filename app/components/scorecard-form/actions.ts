"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { markBaseReached as markBaseReachedInGame } from "@/lib/games";

/**
 * Server Action: record a plate appearance, refresh the game pages, then
 * navigate back to the team's scorecard. Bind gameId in the component:
 * `markBaseReached.bind(null, id)`; `side` rides in via the form's hidden input.
 */
export async function markBaseReached(
  gameId: string,
  _formData: FormData
) {
  const side = _formData.get("side");

  await markBaseReachedInGame(gameId, _formData);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/${side}`);

  // Must come last and stay outside any try/catch — redirect() works by
  // throwing NEXT_REDIRECT, which aborts the rest of the action.
  redirect(`/game/${gameId}/${side}`);
}
