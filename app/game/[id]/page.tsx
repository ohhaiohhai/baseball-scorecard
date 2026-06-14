import Link from "next/link";
import { notFound } from "next/navigation";
import AutofillStatus from "@/app/components/autofill-status";
import Scoreboard from "@/app/components/scoreboard";
import { GameProvider } from "@/app/components/game-store";
import { getGame } from "@/lib/games";

export const dynamic = "force-dynamic";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  return (
    <main className="container page">
      <p>
        <Link href="/">← All games</Link>
      </p>
      <h1>
        {game.away.name} @ {game.home.name}
      </h1>
      <p className="muted mono">
        {game.date} · {game.status}
      </p>

      {game.autofillStatus && game.autofillStatus !== "done" && (
        <AutofillStatus
          gameId={game.id}
          initialStatus={game.autofillStatus}
          initialError={game.autofillError}
        />
      )}

      <GameProvider key={game.updatedAt} initialGame={game}>
        <Scoreboard />
      </GameProvider>
    </main>
  );
}
