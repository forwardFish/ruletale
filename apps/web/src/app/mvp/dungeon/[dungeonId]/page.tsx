import { DungeonView } from "@/components/mvp/DungeonView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MvpDungeonPage({ params }: { params: Promise<{ dungeonId: string }> }) {
  const { dungeonId } = await params;
  return <DungeonView dungeonId={dungeonId} />;
}
