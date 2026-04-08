"use client";

import { Button } from "@/components/mvp/ui/Button";
import { Surface, SurfaceHeader, StatusPill } from "@/components/mvp/ui/Surface";

type Props = {
  restUses: number;
  onRest: () => void;
};

export function RestArea({ restUses, onRest }: Props) {
  return (
    <Surface tone="soft" className="p-5">
      <SurfaceHeader eyebrow="Rest Area" title="休息区" description="恢复部分 HP / SAN / STA，并换来一条不一定可靠、但往往很有价值的大厅回响。" action={<StatusPill>{`剩余 ${restUses} 次`}</StatusPill>} />
      <div className="mt-5 flex items-center justify-end">
        <Button type="button" variant="secondary" disabled={restUses <= 0} onClick={onRest}>
          在这里坐一会
        </Button>
      </div>
    </Surface>
  );
}
