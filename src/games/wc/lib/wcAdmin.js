import { supabase, isSupabaseReady } from "./supabase";
import { getResult, saveResult } from "./results";

// ── Profiles ────────────────────────────────────────────────
export async function fetchAdminProfiles() {
  if (!isSupabaseReady) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, is_admin");
  if (error) {
    console.warn("[wcAdmin] profiles load failed:", error.message);
    return [];
  }
  return data || [];
}

// ── Predictions (all users) ─────────────────────────────────
// predictions.user_id references auth.users, not profiles, so we join in JS
// against fetchAdminProfiles() rather than relying on a PostgREST embed.
export async function fetchAllPredictions() {
  if (!isSupabaseReady) return [];
  const { data, error } = await supabase
    .from("predictions")
    .select("user_id, match_id, home_score, away_score, locked, updated_at");
  if (error) {
    console.warn("[wcAdmin] predictions load failed:", error.message);
    return [];
  }
  return data || [];
}

// Force-lock (or unlock) every prediction for a single match.
export async function adminSetMatchLock(matchId, locked) {
  if (!isSupabaseReady) return;
  const { error } = await supabase
    .from("predictions")
    .update({ locked, updated_at: new Date().toISOString() })
    .eq("match_id", matchId);
  if (error) {
    console.error("[wcAdmin] lock failed:", error.message);
    throw error;
  }
}

export async function adminUpdatePrediction(userId, matchId, home, away) {
  if (!isSupabaseReady) return;
  const { error } = await supabase
    .from("predictions")
    .update({
      home_score: Number(home),
      away_score: Number(away),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("match_id", matchId);
  if (error) {
    console.error("[wcAdmin] update prediction failed:", error.message);
    throw error;
  }
}

export async function adminDeletePrediction(userId, matchId) {
  if (!isSupabaseReady) return;
  const { error } = await supabase
    .from("predictions")
    .delete()
    .eq("user_id", userId)
    .eq("match_id", matchId);
  if (error) {
    console.error("[wcAdmin] delete prediction failed:", error.message);
    throw error;
  }
}

// ── Sync finished results from the match API ────────────────
// Writes a result for every finished match that has a score and isn't already
// recorded with the same scoreline. Returns the number of results written.
export async function syncResultsFromApi(matches) {
  let written = 0;
  for (const m of matches || []) {
    if (m.status !== "finished" || !m.score) continue;
    const existing = getResult(m.id);
    if (
      existing &&
      existing.home === m.score.home &&
      existing.away === m.score.away
    ) {
      continue;
    }
    await saveResult(m.id, m.score.home, m.score.away);
    written += 1;
  }
  return written;
}
