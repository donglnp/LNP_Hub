import { supabaseHub } from "../../../lib/supabaseHub";

const ENTRY_COLS =
  "id, user_id, user_email, entry_date, exercise_type, exercise_other, duration_min, kcal, device, device_other, photo_before_url, photo_after_url, status, notes, created_at, updated_at";

export async function fetchMyEntries(userId) {
  if (!supabaseHub || !userId) return [];
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .select(ENTRY_COLS)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false });
  if (error) {
    console.warn("[wellness] fetchMyEntries", error);
    return [];
  }
  return data || [];
}

export async function fetchAllEntries() {
  if (!supabaseHub) return [];
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .select(ENTRY_COLS)
    .order("entry_date", { ascending: false });
  if (error) {
    console.warn("[wellness] fetchAllEntries", error);
    return [];
  }
  return data || [];
}

export async function fetchWellnessProfiles() {
  if (!supabaseHub) return [];
  const { data, error } = await supabaseHub
    .from("profiles")
    .select("id, full_name, email, avatar_url, gender, is_admin, joined_wellness")
    .order("full_name", { ascending: true });
  if (error) {
    console.warn("[wellness] fetchWellnessProfiles", error);
    return [];
  }
  return data || [];
}

export async function upsertEntry(payload) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  const email = payload.user_email?.trim().toLowerCase() || null;
  if (!payload.user_id && !email) {
    throw new Error("Phải có người tham gia hoặc email");
  }
  const row = {
    user_id: payload.user_id || null,
    user_email: payload.user_id ? null : email,
    entry_date: payload.entry_date,
    exercise_type: payload.exercise_type,
    exercise_other:
      payload.exercise_type === "other"
        ? payload.exercise_other?.trim() || null
        : null,
    duration_min: Number(payload.duration_min),
    kcal: Number(payload.kcal),
    device: payload.device || null,
    device_other:
      payload.device === "other"
        ? payload.device_other?.trim() || null
        : null,
    photo_before_url: payload.photo_before_url,
    photo_after_url: payload.photo_after_url,
    status: payload.status || "approved",
    notes: payload.notes || null,
  };
  const op = payload.id
    ? supabaseHub
        .from("wellness_entries")
        .update(row)
        .eq("id", payload.id)
        .select(ENTRY_COLS)
        .single()
    : supabaseHub
        .from("wellness_entries")
        .insert(row)
        .select(ENTRY_COLS)
        .single();
  const { data, error } = await op;
  if (error) throw error;
  return data;
}

export async function fetchMyLastEntry(userId) {
  if (!supabaseHub || !userId) return null;
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .select(ENTRY_COLS)
    .eq("user_id", userId)
    .order("entry_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[wellness] fetchMyLastEntry", error);
    return null;
  }
  return data || null;
}

export async function fetchMyEntryOnDate(userId, entryDate) {
  if (!supabaseHub || !userId || !entryDate) return null;
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .select("id, entry_date, status")
    .eq("user_id", userId)
    .eq("entry_date", entryDate)
    .limit(1)
    .maybeSingle();
  if (error) {
    console.warn("[wellness] fetchMyEntryOnDate", error);
    return null;
  }
  return data || null;
}

// User self-submit: always pending, no photos, no status override.
export async function createMyEntry(userId, payload) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  if (!userId) throw new Error("Cần đăng nhập");
  const existing = await fetchMyEntryOnDate(userId, payload.entry_date);
  if (existing) {
    const err = new Error("DUPLICATE_DAY");
    err.code = "DUPLICATE_DAY";
    throw err;
  }
  const row = {
    user_id: userId,
    user_email: null,
    entry_date: payload.entry_date,
    exercise_type: payload.exercise_type,
    exercise_other:
      payload.exercise_type === "other"
        ? payload.exercise_other?.trim() || null
        : null,
    duration_min: Number(payload.duration_min),
    kcal: Number(payload.kcal),
    device: payload.device || null,
    device_other:
      payload.device === "other"
        ? payload.device_other?.trim() || null
        : null,
    photo_before_url: payload.photo_before_url?.trim() || null,
    photo_after_url: payload.photo_after_url?.trim() || null,
    status: "pending",
    notes: payload.notes || null,
  };
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .insert(row)
    .select(ENTRY_COLS)
    .single();
  if (error) throw error;
  return data;
}

export async function updateMyPendingEntry(userId, id, payload) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  const patch = {
    entry_date: payload.entry_date,
    exercise_type: payload.exercise_type,
    exercise_other:
      payload.exercise_type === "other"
        ? payload.exercise_other?.trim() || null
        : null,
    duration_min: Number(payload.duration_min),
    kcal: Number(payload.kcal),
    device: payload.device || null,
    device_other:
      payload.device === "other"
        ? payload.device_other?.trim() || null
        : null,
    photo_before_url: payload.photo_before_url?.trim() || null,
    photo_after_url: payload.photo_after_url?.trim() || null,
    notes: payload.notes || null,
  };
  const { data, error } = await supabaseHub
    .from("wellness_entries")
    .update(patch)
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "pending")
    .select(ENTRY_COLS)
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMyPendingEntry(userId, id) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  const { error } = await supabaseHub
    .from("wellness_entries")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .eq("status", "pending");
  if (error) throw error;
}

export async function deleteEntry(id) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  const { error } = await supabaseHub.from("wellness_entries").delete().eq("id", id);
  if (error) throw error;
}

export async function updateProfileMeta(id, patch) {
  if (!supabaseHub) throw new Error("Supabase not configured");
  const { data, error } = await supabaseHub
    .from("profiles")
    .update(patch)
    .eq("id", id)
    .select("id, full_name, email, avatar_url, gender, is_admin, joined_wellness")
    .single();
  if (error) throw error;
  return data;
}

// Realtime helper — re-runs cb on any entries change.
export function subscribeEntries(cb) {
  if (!supabaseHub) return () => {};
  const ch = supabaseHub
    .channel("wellness_entries_changes")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "wellness_entries" },
      () => cb()
    )
    .subscribe();
  return () => supabaseHub.removeChannel(ch);
}
