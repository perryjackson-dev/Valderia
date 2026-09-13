import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/game/active-city";
import QueueRow from "./queue-row";

export default async function TroopsPage() {
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

  // Finalize any completed training and resource production before reading
  // troops/queue below.
  await supabase.rpc("tick_my_city");
  await supabase.rpc("resolve_training_queue", { p_city_id: city.id });

  const [{ data: troopTypes }, { data: troops }, { data: queue }, { data: barracksPlots }] = await Promise.all([
    supabase.from("troop_types").select("*").order("tier"),
    supabase.from("troops").select("troop_type, quantity").eq("city_id", city.id),
    supabase
      .from("training_queue")
      .select("id, troop_type, quantity, completes_at, troop_types(display_name)")
      .eq("city_id", city.id)
      .eq("resolved", false)
      .order("completes_at"),
    supabase.from("field_plots").select("level").eq("city_id", city.id).eq("building_type", "barracks"),
  ]);

  const troopCounts = new Map((troops ?? []).map((t) => [t.troop_type, t.quantity]));
  const barracksCount = (barracksPlots ?? []).filter((p) => p.level >= 1).length;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Troops</h1>
      <p className="text-xs opacity-60">
        {barracksCount} Barracks built · {(queue ?? []).length}/{barracksCount} training slots in use
      </p>

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold opacity-70">Your army</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(troopTypes ?? []).map((t) => (
            <div key={t.type} className="rounded border border-black/10 p-3 text-sm dark:border-white/10">
              <p className="font-medium">{t.display_name}</p>
              <p className="text-lg">{troopCounts.get(t.type) ?? 0}</p>
              <p className="text-xs opacity-60">
                Atk {t.attack} · Life {t.life} · Speed {t.speed} · Load {t.load}
              </p>
            </div>
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

      <p className="text-xs opacity-60">Train new troops from a built Barracks in Field View.</p>
    </div>
  );
}
