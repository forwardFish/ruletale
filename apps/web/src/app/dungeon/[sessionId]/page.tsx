import { DungeonApp } from "@/components/game/DungeonApp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  return <DungeonApp sessionId={sessionId} />;
}
