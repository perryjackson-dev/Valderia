import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TrainForm from "./train-form";
import QueueRow from "./queue-row";

export default async function TroopsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: city } = await supabase
    .from("cities")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!city) {
    return <p>No city found.</p>;
  }

  // Finalize any completed training and resource production before reading
  // troops/queue/resources below.
  await supabase.rpc("resolve_plot_upgrades", { p_city_id: city.id });
  await supabase.rpc("tick_my_city");
  await supabase.rpc("resolve_training_queue", { p_city_id: city.id });

  const [{ data: troopTypes }, { data: troops }, { data: queue }, { data: resources }, { data: cityPlots }] =
    await Promise.all([
      supabase.from("troop_types").select("*").order("tier"),
      supabase.from("troops").select("troop_type, quantity").eq("city_id", city.id),
      supabase
        .from("training_queue")
        .select("id, troop_type, quantity, completes_at, troop_types(display_name)")
        .eq("city_id", city.id)
        .eq("resolved", false)
        .order("completes_at"),
      supabase.from("resources").select("food, wood, stone, ore, gold").eq("city_id", city.id).single(),
      supabase.from("city_plots").select("building_type, level").eq("city_id", city.id),
    ]);

  const available = {
    food: Number(resources?.food ?? 0),
    wood: Number(resources?.wood ?? 0),
    stone: Number(resources?.stone ?? 0),
    ore: Number(resources?.ore ?? 0),
    gold: Number(resources?.gold ?? 0),
  };

  const buildingLevels = new Map(
    (cityPlots ?? [])
      .filter((p) => p.building_type)
      .map((p) => [p.building_type as string, p.level])
  );

  const troopCounts = new Map((troops ?? []).map((t) => [t.troop_type, t.quantity]));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Troops</h1>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold opacity-70">Your army</h2>
        <div className="flex gap-4 text-sm">
          {(troopTypes ?? []).map((t) => (
            <span key={t.type}>
              {t.display_name}: {troopCounts.get(t.type) ?? 0}
            </span>
          ))}
        </div>
      </section>

      {queue && queue.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-sm font-semibold opacity-70">Training queue</h2>
          <div className="flex flex-col gap-2">
            {queue.map((q) => (
              <QueueRow
                key={q.id}
                troopDisplayName={q.troop_types?.display_name ?? q.troop_type}
                quantity={q.quantity}
                completesAt={q.completes_at}
              />
            ))}
          </div>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold opacity-70">Train troops</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(troopTypes ?? []).map((t) => {
            const requiredLevel = t.requires_building_level;
            const actualLevel = t.requires_building ? buildingLevels.get(t.requires_building) ?? 0 : 0;
            const meetsRequirement = !t.requires_building || actualLevel >= requiredLevel;
            return (
              <TrainForm
                key={t.type}
                cityId={city.id}
                troopType={t}
                available={available}
                meetsRequirement={meetsRequirement}
              />
            );
          })}
        </div>
      </section>
    </div>
  );
}
