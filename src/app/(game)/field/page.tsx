import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/game/active-city";
import { getCityConstructionState } from "@/lib/game/city-state";
import PlotCard from "../plot-card";

export default async function FieldPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { city } = await getActiveCity(supabase, user.id);

  if (!city) {
    return <p>No city found.</p>;
  }

  // Finalize any completed construction/training and resource production
  // before reading state below.
  await supabase.rpc("resolve_plot_upgrades", { p_city_id: city.id });
  await supabase.rpc("tick_my_city");
  await supabase.rpc("resolve_training_queue", { p_city_id: city.id });

  const [
    { builtBuildingTypes, cityBusy, fieldPlots: plots },
    { data: resources },
    { data: buildings },
    { data: troopTypes },
    { count: activeQueueCount },
  ] = await Promise.all([
    getCityConstructionState(supabase, city.id),
    supabase.from("resources").select("food, wood, stone, ore, gold").eq("city_id", city.id).single(),
    supabase.from("buildings").select("*").eq("category", "field").order("display_name"),
    supabase.from("troop_types").select("*").order("tier"),
    supabase
      .from("training_queue")
      .select("id", { count: "exact", head: true })
      .eq("city_id", city.id)
      .eq("resolved", false),
  ]);

  const available = {
    food: Number(resources?.food ?? 0),
    wood: Number(resources?.wood ?? 0),
    stone: Number(resources?.stone ?? 0),
    ore: Number(resources?.ore ?? 0),
    gold: Number(resources?.gold ?? 0),
  };

  const barracksPlots = plots.filter((p) => p.building_type === "barracks" && p.level >= 1);
  const maxBarracksLevel = barracksPlots.reduce((max, p) => Math.max(max, p.level), 0);
  const freeTrainingSlots = Math.max(0, barracksPlots.length - (activeQueueCount ?? 0));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Field View</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {plots.map((plot) => (
          <PlotCard
            key={plot.id}
            cityId={city.id}
            plotKind="field"
            plot={plot}
            buildings={buildings ?? []}
            available={available}
            builtBuildingTypes={builtBuildingTypes}
            cityBusy={cityBusy}
            troopTypes={troopTypes ?? []}
            freeTrainingSlots={freeTrainingSlots}
            maxBarracksLevel={maxBarracksLevel}
          />
        ))}
      </div>
    </div>
  );
}
