"use server";

import { revalidatePath } from "next/cache";
import { addInning as addInningToGame } from "@/lib/games";

/**
 * Server Action: add an inning to one team, then refresh the game pages.
 * Bind the args in the component: `addInning.bind(null, id, "home")`.
 * (The trailing FormData is supplied by <form action> and ignored here.)
 */
export async function addInning(
  gameId: string,
  side: "home" | "away",
  _formData?: FormData
) {
  await addInningToGame(gameId, side);
  revalidatePath(`/game/${gameId}`);
  revalidatePath(`/game/${gameId}/${side}`);
}
