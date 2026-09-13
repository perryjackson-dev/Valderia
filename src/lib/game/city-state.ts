import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

type CityPlot = Database["public"]["Tables"]["city_plots"]["Row"];
type FieldPlot = Database["public"]["Tables"]["field_plots"]["Row"];

export type CityConstructionState = {
  cityPlots: CityPlot[];
  fieldPlots: FieldPlot[];
  builtBuildingTypes: Set<string>;
  /** true when some plot anywhere in the city is currently under construction. */
  cityBusy: boolean;
};

/**
 * Fetches both plot grids and derives the citywide single-build-queue and
 * unique-per-city-building state the server RPCs enforce, so the UI can
 * disable actions ahead of time instead of just showing a rejected-request
 * error after the fact.
 */
export async function getCityConstructionState(
  supabase: SupabaseClient<Database>,
  cityId: string
): Promise<CityConstructionState> {
  const [{ data: cityPlots }, { data: fieldPlots }] = await Promise.all([
    supabase.from("city_plots").select("*").eq("city_id", cityId).order("plot_index"),
    supabase.from("field_plots").select("*").eq("city_id", cityId).order("plot_index"),
  ]);

  const allPlots = [...(cityPlots ?? []), ...(fieldPlots ?? [])];

  return {
    cityPlots: cityPlots ?? [],
    fieldPlots: fieldPlots ?? [],
    builtBuildingTypes: new Set(allPlots.filter((p) => p.building_type).map((p) => p.building_type as string)),
    cityBusy: allPlots.some((p) => p.upgrade_started_at !== null),
  };
}
