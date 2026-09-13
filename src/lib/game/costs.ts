import type { Database } from "@/lib/supabase/database.types";

type Building = Database["public"]["Tables"]["buildings"]["Row"];

export type ResourceCost = {
  food: number;
  wood: number;
  stone: number;
  ore: number;
  gold: number;
};

/** Mirrors the cost/time formulas in start_building_upgrade (see migrations). */
export function computeUpgradeCost(building: Building, currentLevel: number): ResourceCost {
  const base = building.base_cost as Partial<ResourceCost>;
  const factor = Math.pow(building.cost_multiplier, currentLevel);
  return {
    food: Math.round((base.food ?? 0) * factor),
    wood: Math.round((base.wood ?? 0) * factor),
    stone: Math.round((base.stone ?? 0) * factor),
    ore: Math.round((base.ore ?? 0) * factor),
    gold: Math.round((base.gold ?? 0) * factor),
  };
}

export function computeUpgradeSeconds(building: Building, currentLevel: number): number {
  return Math.round(building.base_build_seconds * Math.pow(building.build_seconds_multiplier, currentLevel));
}

export function canAfford(cost: ResourceCost, available: ResourceCost): boolean {
  return (
    available.food >= cost.food &&
    available.wood >= cost.wood &&
    available.stone >= cost.stone &&
    available.ore >= cost.ore &&
    available.gold >= cost.gold
  );
}
