import { getGame } from "@/lib/games";
import { notFound } from "next/navigation";

import Scorecard from "@/app/components/scorecard/scorecard";
import GameTeamToggle from "@/app/components/game-team-toggle/game-team-toggle";

import { addInning } from "../actions";

export default async function TeamRoster({
  params,
}: {
  params: Promise<{ id: string; team: "home" | "away" }>;
}) {
  const { id, team } = await params;

  if (team !== "home" && team !== "away") {
    notFound();
  }

  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  return (
    <main className="container page">
      <GameTeamToggle game={game} side={team} />
      <h3>{game[team].name}</h3>
      <Scorecard teamLineup={game[team]} gameId={game.id} team={team} />
      <form action={addInning.bind(null, id, team)}>
        <button type="submit" className="btn">Add Inning</button>
      </form>
      <pre>
        {JSON.stringify(game, null, 2)}
      </pre>
    </main>
  );
}
