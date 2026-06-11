import Link from "next/link";
import { notFound } from "next/navigation";
import Scoreboard from "@/app/components/scoreboard";
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

      <Scoreboard game={game} />
    </main>
  );
}
