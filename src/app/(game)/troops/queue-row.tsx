"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDuration } from "@/lib/game/time";

export default function QueueRow({
  troopDisplayName,
  quantity,
  completesAt,
}: {
  troopDisplayName: string;
  quantity: number;
  completesAt: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());
  const completesAtMs = new Date(completesAt).getTime();

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (now >= completesAtMs) {
      router.refresh();
    }
  }, [now, completesAtMs, router]);

  return (
    <div className="flex items-center justify-between rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10">
      <span>
        {quantity}x {troopDisplayName}
      </span>
      <span className="font-mono text-xs">{formatDuration(completesAtMs - now)}</span>
    </div>
  );
}
