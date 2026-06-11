import Link from "next/link";
import DeleteGameButton from "@/app/components/delete-game-button";
import NewGameForm from "@/app/components/new-game-form";
import { listGames } from "@/lib/games";

// Reads from DynamoDB per request.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  let games: Awaited<ReturnType<typeof listGames>> = [];
  let error: string | null = null;

  try {
    games = await listGames();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load games";
  }

  return (
    <main className="container page">
      <h1>Baseball Scorecard</h1>

      <NewGameForm />

      <section className="card">
        <h2>Games</h2>
        {error && <p className="muted">Could not load games: {error}</p>}
        {!error && games.length === 0 && (
          <p className="muted">No games yet — start one above.</p>
        )}
        <ul className="page" style={{ paddingBlock: 0 }}>
          {games.map((game) => (
            <li
              key={game.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "1rem",
              }}
            >
              <Link href={`/game/${game.id}`}>
                <span className="mono">{game.date}</span> — {game.away.name} @{" "}
                {game.home.name}{" "}
                <span className="muted">({game.status})</span>
              </Link>
              <DeleteGameButton
                id={game.id}
                label={`${game.away.name} @ ${game.home.name}`}
              />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
