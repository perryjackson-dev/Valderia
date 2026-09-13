"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type PlotActionState = { error: string } | null;

export async function startPlotUpgrade(
  _prevState: PlotActionState,
  formData: FormData
): Promise<PlotActionState> {
  const cityId = String(formData.get("cityId") ?? "");
  const plotKind = String(formData.get("plotKind") ?? "");
  const plotIndex = Number(formData.get("plotIndex"));
  const buildingType = String(formData.get("buildingType") ?? "");

  if (plotKind !== "city" && plotKind !== "field") {
    return { error: "invalid plot kind" };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("start_building_upgrade", {
    p_city_id: cityId,
    p_plot_kind: plotKind,
    p_plot_index: plotIndex,
    p_building_type: buildingType,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/city");
  revalidatePath("/field");
  revalidatePath("/", "layout");
  return null;
}
