import { NextResponse } from "next/server";
import { deleteGame, getGame, putGame } from "@/lib/games";
import type { Game } from "@/lib/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const game = await getGame(id);

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }
  return NextResponse.json(game);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await getGame(id);

  if (!existing) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  const body = (await request.json()) as Partial<Game>;
  const updated: Game = {
    ...existing,
    ...body,
    id, // never let the body rewrite the key
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  };
  await putGame(updated);
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteGame(id);
  return new NextResponse(null, { status: 204 });
}
