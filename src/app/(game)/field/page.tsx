import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PlotCard from "../plot-card";

export default async function FieldPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id, name, x, y")
    .eq("owner_id", user.id)
    .single();

  if (!city) {
    return <p>No city found.</p>;
  }

  // Finalize any building upgrades whose timer has already elapsed, and
  // apply elapsed-time resource production, before reading state below.
  await supabase.rpc("resolve_plot_upgrades", { p_city_id: city.id });
  await supabase.rpc("tick_my_city");

  const [{ data: plots }, { data: resources }, { data: buildings }] = await Promise.all([
    supabase.from("field_plots").select("*").eq("city_id", city.id).order("plot_index"),
    supabase.from("resources").select("food, wood, stone, ore, gold").eq("city_id", city.id).single(),
    supabase.from("buildings").select("*").eq("category", "field").order("display_name"),
  ]);

  const available = {
    food: Number(resources?.food ?? 0),
    wood: Number(resources?.wood ?? 0),
    stone: Number(resources?.stone ?? 0),
    ore: Number(resources?.ore ?? 0),
    gold: Number(resources?.gold ?? 0),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-semibold">Field View</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        {plots?.map((plot) => (
          <PlotCard
            key={plot.id}
            cityId={city.id}
            plotKind="field"
            plot={plot}
            buildings={buildings ?? []}
            available={available}
          />
        ))}
      </div>
    </div>
  );
}
