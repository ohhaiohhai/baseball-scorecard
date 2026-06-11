// import styles from "./roster.module.scss"
import { getGame } from "@/lib/games";
import { notFound } from "next/navigation";

import { Player } from "@/lib/types"

import ScorecardForm from "@/app/components/scorecard-form/scorecard-form"

export default async function PlateAppearancePage({
  params,
}: {
  params: Promise<{ id: string; team: "home" | "away"; inningNumber: string; lineupSpot: string }>;
}) {
  const { id, team, inningNumber, lineupSpot } = await params;

  if (team !== "home" && team !== "away") {
    notFound();
  }

  const game = await getGame(id);

  if (!game) {
    notFound();
  }

  let plateAppearance;
  const plateAppearanceToCheck = game[team].innings[Number(inningNumber) - 1].plateAppearances[Number(lineupSpot) - 1];
  if (plateAppearanceToCheck && plateAppearanceToCheck.result) {
    plateAppearance = plateAppearanceToCheck;
  }

  const batter:Player = game[team].players[Number(lineupSpot) - 1];

  return (
    <div>
      <ScorecardForm gameId={game.id} side={team} batter={batter} inning={Number(inningNumber)} lineupSpot={Number(lineupSpot)} plateAppearance={plateAppearance} />
    </div>
  )
}