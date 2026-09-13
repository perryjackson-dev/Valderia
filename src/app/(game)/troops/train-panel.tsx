"use client";

import { useActionState, useState } from "react";
import { startTroopTraining } from "./actions";
import { canAfford, type ResourceCost } from "@/lib/game/costs";
import type { Database } from "@/lib/supabase/database.types";

type TroopType = Database["public"]["Tables"]["troop_types"]["Row"];

/** Embedded in a built Barracks plot card. Any Barracks can queue into any
 * free citywide training slot (slots = number of built Barracks). */
export default function TrainPanel({
  cityId,
  troopTypes,
  available,
  maxBarracksLevel,
  freeSlots,
}: {
  cityId: string;
  troopTypes: TroopType[];
  available: ResourceCost;
  maxBarracksLevel: number;
  freeSlots: number;
}) {
  const [state, formAction, pending] = useActionState(startTroopTraining, null);
  const trainable = troopTypes.filter((t) => t.requires_building_level <= maxBarracksLevel);
  const [selectedType, setSelectedType] = useState(trainable[0]?.type ?? "");
  const [quantity, setQuantity] = useState(1);

  const troop = trainable.find((t) => t.type === selectedType);
  const cost = troop?.train_cost as Partial<ResourceCost> | undefined;
  const totalCost: ResourceCost = {
    food: (cost?.food ?? 0) * quantity,
    wood: (cost?.wood ?? 0) * quantity,
    stone: (cost?.stone ?? 0) * quantity,
    ore: (cost?.ore ?? 0) * quantity,
    gold: (cost?.gold ?? 0) * quantity,
  };
  const affordable = troop ? canAfford(totalCost, available) : false;
  const totalSeconds = troop ? troop.train_seconds * quantity : 0;

  if (trainable.length === 0) {
    return <p className="text-xs opacity-60">No troops trainable yet.</p>;
  }

  if (freeSlots <= 0) {
    return <p className="text-xs opacity-60">All barracks busy — no free training slots.</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2 border-t border-black/10 pt-2 dark:border-white/10">
      <p className="text-xs opacity-60">{freeSlots} free training slot{freeSlots === 1 ? "" : "s"}</p>
      <input type="hidden" name="cityId" value={cityId} />
      <select
        name="troopType"
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        className="rounded border border-black/20 px-2 py-1 text-xs dark:border-white/20"
      >
        {trainable.map((t) => (
          <option key={t.type} value={t.type}>
            {t.display_name}
          </option>
        ))}
      </select>
      <input
        type="number"
        name="quantity"
        min={1}
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
        className="rounded border border-black/20 px-2 py-1 text-xs dark:border-white/20"
      />
      <p className="text-xs opacity-80">
        {(Object.keys(totalCost) as (keyof ResourceCost)[])
          .filter((k) => totalCost[k] > 0)
          .map((k) => `${totalCost[k]} ${k}`)
          .join(", ") || "Free"}
        {!affordable && <span className="ml-1 text-red-600">(not enough resources)</span>}
      </p>
      <p className="text-xs opacity-60">{totalSeconds}s</p>
      <button
        type="submit"
        disabled={pending || !affordable}
        className="w-full rounded bg-foreground px-2 py-1 text-xs font-medium text-background disabled:opacity-40"
      >
        {pending ? "..." : "Train"}
      </button>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
