"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { startPlotUpgrade } from "./plot-actions";
import { computeUpgradeCost, computeUpgradeSeconds, canAfford, type ResourceCost } from "@/lib/game/costs";
import type { Database } from "@/lib/supabase/database.types";

type Building = Database["public"]["Tables"]["buildings"]["Row"];
type Plot = Database["public"]["Tables"]["city_plots"]["Row"] | Database["public"]["Tables"]["field_plots"]["Row"];

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

function CostLine({ cost, available }: { cost: ResourceCost; available: ResourceCost }) {
  const entries = (Object.keys(cost) as (keyof ResourceCost)[]).filter((k) => cost[k] > 0);
  if (entries.length === 0) return <p className="text-xs opacity-60">Free</p>;
  return (
    <p className="text-xs opacity-80">
      {entries
        .map((k) => `${cost[k]} ${k}`)
        .join(", ")}
      {!canAfford(cost, available) && <span className="ml-1 text-red-600">(not enough resources)</span>}
    </p>
  );
}

export default function PlotCard({
  cityId,
  plotKind,
  plot,
  buildings,
  available,
}: {
  cityId: string;
  plotKind: "city" | "field";
  plot: Plot;
  buildings: Building[];
  available: ResourceCost;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(startPlotUpgrade, null);
  const [selected, setSelected] = useState(buildings[0]?.type ?? "");
  const [now, setNow] = useState(() => Date.now());

  const upgrading = Boolean(plot.upgrade_completes_at);
  const completesAt = plot.upgrade_completes_at ? new Date(plot.upgrade_completes_at).getTime() : null;

  useEffect(() => {
    if (!upgrading) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [upgrading]);

  useEffect(() => {
    if (upgrading && completesAt !== null && now >= completesAt) {
      router.refresh();
    }
  }, [now, upgrading, completesAt, router]);

  const currentBuilding = buildings.find((b) => b.type === plot.building_type);
  const targetBuilding = plot.building_type ? currentBuilding : buildings.find((b) => b.type === selected);

  const cost = targetBuilding ? computeUpgradeCost(targetBuilding, plot.level) : null;
  const seconds = targetBuilding ? computeUpgradeSeconds(targetBuilding, plot.level) : null;
  const atMaxLevel = targetBuilding ? plot.level >= targetBuilding.max_level : false;

  return (
    <div className="flex flex-col gap-2 rounded border border-black/10 p-3 dark:border-white/10">
      <div className="flex items-baseline justify-between">
        <span className="text-xs opacity-50">#{plot.plot_index}</span>
        {plot.building_type && <span className="text-xs opacity-50">Lv {plot.level}</span>}
      </div>

      <p className="font-medium">{currentBuilding?.display_name ?? "Empty plot"}</p>

      {upgrading && completesAt !== null ? (
        <p className="text-sm font-mono">{formatDuration(completesAt - now)}</p>
      ) : (
        <>
          {!plot.building_type && (
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="rounded border border-black/20 px-2 py-1 text-xs dark:border-white/20"
            >
              {buildings.map((b) => (
                <option key={b.type} value={b.type}>
                  {b.display_name}
                </option>
              ))}
            </select>
          )}

          {atMaxLevel ? (
            <p className="text-xs opacity-60">Max level</p>
          ) : (
            cost && (
              <>
                <CostLine cost={cost} available={available} />
                <p className="text-xs opacity-60">{seconds}s</p>
                <form action={formAction}>
                  <input type="hidden" name="cityId" value={cityId} />
                  <input type="hidden" name="plotKind" value={plotKind} />
                  <input type="hidden" name="plotIndex" value={plot.plot_index} />
                  <input type="hidden" name="buildingType" value={plot.building_type ?? selected} />
                  <button
                    type="submit"
                    disabled={pending || !canAfford(cost, available)}
                    className="w-full rounded bg-foreground px-2 py-1 text-xs font-medium text-background disabled:opacity-40"
                  >
                    {pending ? "..." : plot.building_type ? "Upgrade" : "Build"}
                  </button>
                </form>
              </>
            )
          )}
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </>
      )}
    </div>
  );
}
