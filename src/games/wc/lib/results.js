import { supabase, isSupabaseReady } from "./supabase";

let cache = new Map();
let loaded = false;
let listeners = new Set();
let realtimeChannel = null;

function emit() {
  listeners.forEach((l) => l());
}

export function onResultsChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getResult(matchId) {
  return cache.get(matchId) || null;
}

export function hasResult(matchId) {
  return cache.has(matchId);
}

export async function loadResults() {
  if (loaded && cache.size) return cache;
  if (!isSupabaseReady) {
    loaded = true;
    return cache;
  }

  const { data, error } = await supabase
    .from("match_results")
    .select("match_id, home_score, away_score, finished_at");
  if (error) {
    console.warn("[results] load failed:", error.message);
    cache = new Map();
  } else {
    cache = new Map(
      (data || []).map((r) => [
        r.match_id,
        { home: r.home_score, away: r.away_score, finishedAt: r.finished_at },
      ])
    );
  }
  loaded = true;

  if (realtimeChannel) supabase.removeChannel(realtimeChannel);
  realtimeChannel = supabase
    .channel("match-results-stream")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "match_results" },
      (payload) => {
        const row = payload.new || payload.old;
        if (!row) return;
        if (payload.eventType === "DELETE") {
          cache.delete(row.match_id);
        } else {
          cache.set(row.match_id, {
            home: row.home_score,
            away: row.away_score,
            finishedAt: row.finished_at,
          });
        }
        emit();
      }
    )
    .subscribe();

  emit();
  return cache;
}

// Admin: write a match result (upsert). Requires the admin RLS policy.
export async function saveResult(matchId, home, away) {
  const next = {
    home: Number(home),
    away: Number(away),
    finishedAt: new Date().toISOString(),
  };
  cache.set(matchId, next);
  emit();

  if (!isSupabaseReady) return next;

  const { error } = await supabase.from("match_results").upsert(
    {
      match_id: matchId,
      home_score: next.home,
      away_score: next.away,
      finished_at: next.finishedAt,
    },
    { onConflict: "match_id" }
  );
  if (error) {
    console.error("[results] save failed:", error.message);
    throw error;
  }
  return next;
}

// Admin: remove a match result.
export async function deleteResult(matchId) {
  cache.delete(matchId);
  emit();

  if (!isSupabaseReady) return;

  const { error } = await supabase
    .from("match_results")
    .delete()
    .eq("match_id", matchId);
  if (error) {
    console.error("[results] delete failed:", error.message);
    throw error;
  }
}

export function resetResults() {
  cache = new Map();
  loaded = false;
  if (realtimeChannel && supabase) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  emit();
}
