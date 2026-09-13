import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type CitySummary = { id: string; name: string; x: number; y: number };

/**
 * Players will eventually be able to found up to 4 cities (not yet
 * buildable in the UI — signup still provisions exactly one). This picks
 * whichever city is marked active via cookie, falling back to the oldest,
 * so the rest of the app doesn't assume a single city per player.
 */
export async function getActiveCity(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<{ city: CitySummary | null; cities: CitySummary[] }> {
  const { data: cities } = await supabase
    .from("cities")
    .select("id, name, x, y")
    .eq("owner_id", userId)
    .order("created_at");

  if (!cities || cities.length === 0) {
    return { city: null, cities: [] };
  }

  const cookieStore = await cookies();
  const selectedId = cookieStore.get("activeCityId")?.value;
  const city = cities.find((c) => c.id === selectedId) ?? cities[0];

  return { city, cities };
}
