import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveCity } from "@/lib/game/active-city";
import { signOut } from "../login/actions";
import GameNav from "./game-nav";
import CitySwitcher from "./city-switcher";

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Server-authoritative: apply elapsed-time production before showing
  // resources, rather than trusting/extrapolating on the client.
  await supabase.rpc("tick_my_city");

  const { city, cities } = await getActiveCity(supabase, user.id);

  const { data: resources } = city
    ? await supabase
        .from("resources")
        .select("food, wood, stone, ore, gold")
        .eq("city_id", city.id)
        .single()
    : { data: null };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-col gap-2 border-b border-black/10 px-4 py-3 dark:border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-semibold">{city?.name ?? "Valderia"}</span>
            <CitySwitcher cities={cities} activeCityId={city?.id ?? ""} />
            <GameNav />
          </div>
          <form action={signOut}>
            <button type="submit" className="rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20">
              Log out
            </button>
          </form>
        </div>
        {resources && (
          <div className="flex gap-4 text-xs opacity-80">
            {(["food", "wood", "stone", "ore", "gold"] as const).map((key) => (
              <span key={key} className="capitalize">
                {key}: {Math.floor(Number(resources[key]))}
              </span>
            ))}
          </div>
        )}
      </header>
      <main className="flex-1 p-4">{children}</main>
    </div>
  );
}
