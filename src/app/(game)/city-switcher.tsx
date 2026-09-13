import { setActiveCity } from "./city-actions";
import type { CitySummary } from "@/lib/game/active-city";

// Inert until players can found a 2nd-4th city; renders nothing for the
// common single-city case.
export default function CitySwitcher({ cities, activeCityId }: { cities: CitySummary[]; activeCityId: string }) {
  if (cities.length <= 1) return null;

  return (
    <form action={setActiveCity} className="flex items-center gap-1">
      <select
        name="cityId"
        defaultValue={activeCityId}
        className="rounded border border-black/20 bg-transparent px-1.5 py-0.5 text-xs dark:border-white/20"
      >
        {cities.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      <button type="submit" className="text-xs underline opacity-70">
        Switch
      </button>
    </form>
  );
}
