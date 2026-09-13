"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type TrainActionState = { error: string } | null;

export async function startTroopTraining(
  _prevState: TrainActionState,
  formData: FormData
): Promise<TrainActionState> {
  const cityId = String(formData.get("cityId") ?? "");
  const troopType = String(formData.get("troopType") ?? "");
  const quantity = Number(formData.get("quantity"));

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return { error: "quantity must be a positive whole number" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_troop_training", {
    p_city_id: cityId,
    p_troop_type: troopType,
    p_quantity: quantity,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/field");
  revalidatePath("/troops");
  revalidatePath("/", "layout");
  return null;
}
