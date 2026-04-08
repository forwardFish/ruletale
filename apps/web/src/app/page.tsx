import Link from "next/link";

import { HallApp } from "@/components/game/HallApp";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ lobby?: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <Link
          href="/mvp"
          className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 shadow-lg backdrop-blur transition hover:bg-slate-900"
        >
          进入前端单机 MVP
        </Link>
      </div>
      <HallApp forceLobby={params.lobby === "1"} />
    </>
  );
}
