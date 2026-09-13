import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../login/actions";

export default async function CityPage() {
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

  const { data: resources } = city
    ? await supabase
        .from("resources")
        .select("food, wood, stone, ore, gold")
        .eq("city_id", city.id)
        .single()
    : { data: null };

  return (
    <main className="flex min-h-screen flex-col gap-6 p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{city?.name ?? "Your City"}</h1>
        <form action={signOut}>
          <button type="submit" className="rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20">
            Log out
          </button>
        </form>
      </header>

      {city && (
        <p className="text-sm opacity-70">
          Location: ({city.x}, {city.y})
        </p>
      )}

      {resources && (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(["food", "wood", "stone", "ore", "gold"] as const).map((key) => (
            <div key={key} className="rounded border border-black/10 p-3 dark:border-white/10">
              <dt className="text-xs uppercase opacity-60">{key}</dt>
              <dd className="text-lg font-medium">{Math.floor(Number(resources[key]))}</dd>
            </div>
          ))}
        </dl>
      )}

      <p className="text-sm opacity-60">
        City View, Field View, and World Map are coming in later build steps.
      </p>
    </main>
  );
}
