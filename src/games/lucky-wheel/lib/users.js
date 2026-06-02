import { supabaseHub } from "../../../lib/supabaseHub";

export async function fetchUserNames() {
  if (!supabaseHub) return [];
  const { data, error } = await supabaseHub
    .from("profiles")
    .select("full_name, email")
    .order("full_name", { ascending: true });
  if (error) {
    console.warn("[lucky-wheel] fetchUserNames", error);
    return [];
  }
  return (data || [])
    .map((p) => {
      const raw = (p.full_name || p.email || "").trim();
      if (!raw) return "";
      // Take only the first word (e.g. "Dong Le Huynh" -> "Dong")
      return raw.split(/\s+/)[0];
    })
    .filter(Boolean);
}
