"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function setActiveCity(formData: FormData) {
  const cityId = String(formData.get("cityId") ?? "");
  const cookieStore = await cookies();
  cookieStore.set("activeCityId", cityId, { path: "/", httpOnly: true, sameSite: "lax" });
  redirect("/city");
}
