"use client";

import { useActionState, useState } from "react";
import { startTroopTraining } from "./actions";
import type { ResourceCost } from "@/lib/game/costs";
import { canAfford } from "@/lib/game/costs";
import type { Database } from "@/lib/supabase/database.types";

type TroopType = Database["public"]["Tables"]["troop_types"]["Row"];

export default function TrainForm({
  cityId,
  troopType,
  available,
  meetsRequirement,
}: {
  cityId: string;
  troopType: TroopType;
  available: ResourceCost;
  meetsRequirement: boolean;
}) {
  const [state, formAction, pending] = useActionState(startTroopTraining, null);
  const [quantity, setQuantity] = useState(1);

  const cost = troopType.train_cost as Partial<ResourceCost>;
  const totalCost: ResourceCost = {
    food: (cost.food ?? 0) * quantity,
    wood: (cost.wood ?? 0) * quantity,
    stone: (cost.stone ?? 0) * quantity,
    ore: (cost.ore ?? 0) * quantity,
    gold: (cost.gold ?? 0) * quantity,
  };
  const affordable = canAfford(totalCost, available);
  const totalSeconds = troopType.train_seconds * quantity;

  return (
    <div className="flex flex-col gap-2 rounded border border-black/10 p-3 dark:border-white/10">
      <p className="font-medium">{troopType.display_name}</p>
      <p className="text-xs opacity-60">
        Atk {troopType.attack} · Life {troopType.life} · Speed {troopType.speed} · Load {troopType.load}
      </p>

      {!meetsRequirement ? (
        <p className="text-xs opacity-60">
          Requires {troopType.requires_building} level {troopType.requires_building_level}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-2">
          <input type="hidden" name="cityId" value={cityId} />
          <input type="hidden" name="troopType" value={troopType.type} />
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
            className="rounded bg-foreground px-2 py-1 text-xs font-medium text-background disabled:opacity-40"
          >
            {pending ? "..." : "Train"}
          </button>
          {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
        </form>
      )}
    </div>
  );
}
