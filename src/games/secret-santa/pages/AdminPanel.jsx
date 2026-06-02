import { useEffect, useState } from "react";
import { supabaseHub } from "../../../lib/supabaseHub";
import { useT } from "../../../lib/i18n";

export default function AdminPanel() {
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [matches, setMatches] = useState([]);

  // Form states for creating a new event
  const [newTitle, setNewTitle] = useState("");
  const [newBudget, setNewBudget] = useState("300k - 500k VND");
  const [creating, setCreating] = useState(false);

  // Edit Event Settings states
  const [editTitle, setEditTitle] = useState("");
  const [editBudget, setEditBudget] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  // Fetch all data
  const fetchData = async () => {
    if (!supabaseHub) return;
    setLoading(true);
    try {
      // 1. Fetch latest event
      const { data: events, error: eventErr } = await supabaseHub
        .from("santa_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1);

      if (eventErr) throw eventErr;

      if (!events || events.length === 0) {
        setEvent(null);
        setLoading(false);
        return;
      }

      const activeEvent = events[0];
      setEvent(activeEvent);
      setEditTitle(activeEvent.title);
      setEditBudget(activeEvent.budget);

      // 2. Fetch profiles
      const { data: profs, error: profErr } = await supabaseHub
        .from("profiles")
        .select("id, full_name, email, avatar_url");
      if (profErr) throw profErr;

      const profMap = {};
      profs.forEach((p) => {
        profMap[p.id] = p;
      });
      setProfiles(profMap);

      // 3. Fetch all participants for this event
      const { data: parts, error: partsErr } = await supabaseHub
        .from("santa_participants")
        .select("*")
        .eq("event_id", activeEvent.id);
      if (partsErr) throw partsErr;
      setParticipants(parts || []);

      // 4. Fetch matches if they exist
      const { data: mtchs, error: matchErr } = await supabaseHub
        .from("santa_matches")
        .select("*")
        .eq("event_id", activeEvent.id);
      if (matchErr) throw matchErr;
      setMatches(mtchs || []);
    } catch (e) {
      console.error("[secret-santa-admin] fetchData error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Create new event
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newBudget.trim() || creating) return;
    setCreating(true);
    try {
      const { error } = await supabaseHub
        .from("santa_events")
        .insert({
          title: newTitle,
          budget: newBudget,
          status: "registration",
        });
      if (error) throw error;
      setNewTitle("");
      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleCreateEvent error", err);
    } finally {
      setCreating(false);
    }
  };

  // Save Event Settings (title + budget)
  const handleSaveSettings = async () => {
    if (!event || !editTitle.trim() || !editBudget.trim() || savingSettings) return;
    setSavingSettings(true);
    try {
      const { error } = await supabaseHub
        .from("santa_events")
        .update({ title: editTitle, budget: editBudget })
        .eq("id", event.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleSaveSettings error", err);
      alert("Error saving settings: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  // Close (delete) the event entirely
  const handleCloseEvent = async () => {
    if (!event) return;
    if (!window.confirm(t("santa.admin_close_confirm"))) return;
    try {
      const { error } = await supabaseHub
        .from("santa_events")
        .delete()
        .eq("id", event.id);
      if (error) throw error;
      setEvent(null);
      setParticipants([]);
      setMatches([]);
      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleCloseEvent error", err);
      alert("Error closing event: " + err.message);
    }
  };

  // Update event status
  const handleUpdateStatus = async (newStatus) => {
    if (!event) return;
    try {
      const { error } = await supabaseHub
        .from("santa_events")
        .update({ status: newStatus })
        .eq("id", event.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleUpdateStatus error", err);
    }
  };

  // Draw Matches (randomized derangement)
  const handleDrawMatches = async () => {
    if (!event || participants.length < 2) return;
    if (!window.confirm(t("santa.admin_draw_confirm"))) return;

    try {
      const ids = participants.map((p) => p.user_id);
      const n = ids.length;

      // Fisher-Yates shuffle
      const shuffled = [...ids];
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Create derangement matches: shuffled[i] -> shuffled[(i + 1) % n]
      const matchesToInsert = [];
      for (let i = 0; i < n; i++) {
        matchesToInsert.push({
          event_id: event.id,
          giver_id: shuffled[i],
          receiver_id: shuffled[(i + 1) % n],
        });
      }

      // Write matches to supabase
      const { error: insertErr } = await supabaseHub
        .from("santa_matches")
        .insert(matchesToInsert);

      if (insertErr) throw insertErr;

      // Update event phase to 'matched'
      const { error: updateErr } = await supabaseHub
        .from("santa_events")
        .update({ status: "matched" })
        .eq("id", event.id);

      if (updateErr) throw updateErr;

      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleDrawMatches error", err);
      alert("Error generating matches: " + err.message);
    }
  };

  // Reset/Clear matches
  const handleResetMatches = async () => {
    if (!event) return;
    if (!window.confirm(t("santa.admin_reset_confirm"))) return;

    try {
      // 1. Delete all matches for this event
      const { error: deleteErr } = await supabaseHub
        .from("santa_matches")
        .delete()
        .eq("event_id", event.id);

      if (deleteErr) throw deleteErr;

      // 2. Set event status back to 'registration'
      const { error: updateErr } = await supabaseHub
        .from("santa_events")
        .update({ status: "registration" })
        .eq("id", event.id);

      if (updateErr) throw updateErr;

      await fetchData();
    } catch (err) {
      console.error("[secret-santa-admin] handleResetMatches error", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] grid place-items-center bg-arena-bg text-arena-muted text-sm">
        {t("common.loading")}
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-display text-2xl font-bold">
          <span className="text-arena-red">🎄 </span>
          <span className="bg-gradient-to-r from-arena-red to-arena-green bg-clip-text text-transparent">
            {t("santa.admin_panel")}
          </span>
        </h1>
      </header>

      {!event ? (
        /* Create New Event Panel */
        <div className="max-w-lg rounded-lg border border-arena-border bg-arena-surface p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold mb-4 text-arena-text">
            {t("santa.admin_create_event")}
          </h2>
          <form onSubmit={handleCreateEvent} className="space-y-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-arena-muted mb-1.5 font-semibold">
                {t("santa.admin_event_title")}
              </label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Noel LNP 2026"
                className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-text px-3 py-2 focus:outline-none focus:border-arena-green"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-arena-muted mb-1.5 font-semibold">
                {t("santa.admin_budget")}
              </label>
              <input
                type="text"
                required
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                placeholder="e.g. 300k - 500k VND"
                className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-text px-3 py-2 focus:outline-none focus:border-arena-green"
              />
            </div>
            <button
              type="submit"
              disabled={creating}
              className="w-full px-4 py-2.5 rounded-md font-semibold text-sm bg-gradient-to-r from-arena-red to-arena-green text-arena-bg hover:brightness-110 transition disabled:opacity-50"
            >
              {creating ? t("common.saving") : t("santa.admin_create_event")}
            </button>
          </form>
        </div>
      ) : (
        /* Active Event Console */
        <div className="space-y-8">
          {/* Status & Match controls */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Event Info Card — Editable */}
            <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-4">
              <h2 className="font-display text-md font-semibold text-arena-text border-b border-arena-border pb-2">
                Event Settings
              </h2>
              <div className="space-y-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase text-arena-muted tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-text px-2 py-1.5 focus:outline-none focus:border-arena-green"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-arena-muted tracking-wider mb-1">Budget</label>
                  <input
                    type="text"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-green font-semibold px-2 py-1.5 focus:outline-none focus:border-arena-green"
                  />
                </div>
                <div>
                  <span className="block text-[10px] uppercase text-arena-muted tracking-wider">Current Phase</span>
                  <span className="text-arena-text text-sm font-semibold capitalize">{event.status}</span>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleSaveSettings}
                    disabled={
                      savingSettings ||
                      (editTitle === event.title && editBudget === event.budget) ||
                      !editTitle.trim() ||
                      !editBudget.trim()
                    }
                    className="w-full px-3 py-2 rounded-md font-semibold text-[11px] uppercase tracking-wider text-arena-bg bg-gradient-to-r from-arena-red to-arena-green hover:brightness-110 transition disabled:opacity-40"
                  >
                    {savingSettings ? t("common.saving") : t("santa.admin_save_settings")}
                  </button>
                  <button
                    onClick={handleCloseEvent}
                    className="w-full px-3 py-2 rounded-md font-semibold text-[11px] uppercase tracking-wider text-arena-muted bg-arena-card border border-arena-border hover:bg-arena-red hover:text-arena-bg hover:border-arena-red transition"
                  >
                    {t("santa.admin_close_event")}
                  </button>
                </div>
              </div>
            </div>

            {/* Phase Controls */}
            <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-4">
              <h2 className="font-display text-md font-semibold text-arena-text border-b border-arena-border pb-2">
                Phase Controls
              </h2>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleUpdateStatus("registration")}
                  className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide border transition text-left ${
                    event.status === "registration"
                      ? "bg-arena-red/15 text-arena-red border-arena-red/30"
                      : "bg-arena-card text-arena-muted border-arena-border hover:bg-arena-card/85"
                  }`}
                >
                  1. {t("santa.admin_status_reg")}
                </button>
                <button
                  disabled={matches.length === 0}
                  onClick={() => handleUpdateStatus("matched")}
                  className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide border transition text-left ${
                    event.status === "matched"
                      ? "bg-arena-green/15 text-arena-green border-arena-green/30"
                      : "bg-arena-card text-arena-muted border-arena-border hover:bg-arena-card/85 disabled:opacity-50"
                  }`}
                >
                  2. {t("santa.admin_status_matched")}
                </button>
                <button
                  onClick={() => handleUpdateStatus("completed")}
                  className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide border transition text-left ${
                    event.status === "completed"
                      ? "bg-arena-red/15 text-arena-red border-arena-red/30"
                      : "bg-arena-card text-arena-muted border-arena-border hover:bg-arena-card/85"
                  }`}
                >
                  3. {t("santa.admin_status_completed")}
                </button>
              </div>
            </div>

            {/* Draw pairing controls */}
            <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-4">
              <h2 className="font-display text-md font-semibold text-arena-text border-b border-arena-border pb-2">
                Draw Board
              </h2>
              <div className="flex flex-col gap-3 justify-center h-full pb-4">
                {event.status === "registration" ? (
                  <>
                    <button
                      onClick={handleDrawMatches}
                      disabled={participants.length < 2}
                      className="w-full px-4 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider text-arena-bg bg-gradient-to-r from-arena-red to-arena-green hover:brightness-110 transition disabled:opacity-50"
                    >
                      {t("santa.btn_draw")}
                    </button>
                    {participants.length < 2 && (
                      <p className="text-[10px] text-arena-red text-center">
                        {t("santa.err_min_participants")}
                      </p>
                    )}
                  </>
                ) : (
                  <button
                    onClick={handleResetMatches}
                    className="w-full px-4 py-2.5 rounded-md font-semibold text-xs uppercase tracking-wider text-arena-muted bg-arena-card border border-arena-border hover:bg-arena-red hover:text-arena-bg hover:border-arena-red transition"
                  >
                    {t("santa.btn_reset_draw")}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progress Tracker */}
          {event.status !== "registration" && (
            <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-3">
              <h2 className="font-display text-md font-semibold text-arena-text border-b border-arena-border pb-2">
                Exchange Progress
              </h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-arena-card p-4 rounded-md border border-arena-border">
                  <span className="block text-2xl font-bold text-arena-green">
                    {participants.filter((p) => p.gift_sent).length} / {participants.length}
                  </span>
                  <span className="text-[10px] uppercase text-arena-muted font-bold tracking-wider">
                    Gifts Sent
                  </span>
                </div>
                <div className="bg-arena-card p-4 rounded-md border border-arena-border">
                  <span className="block text-2xl font-bold text-arena-blue font-semibold">
                    {participants.filter((p) => p.gift_received).length} / {participants.length}
                  </span>
                  <span className="text-[10px] uppercase text-arena-muted font-bold tracking-wider">
                    Gifts Received
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Participants list */}
          <div className="rounded-lg border border-arena-border bg-arena-surface p-6">
            <h2 className="font-display text-lg font-semibold text-arena-text mb-4">
              {t("santa.admin_participants_list")} ({participants.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-arena-border text-arena-muted font-bold uppercase tracking-wider">
                    <th className="py-3 px-2">Member</th>
                    <th className="py-3 px-2">Wishlist</th>
                    <th className="py-3 px-2">Assigned Target</th>
                    <th className="py-3 px-2 text-center">Sent</th>
                    <th className="py-3 px-2 text-center">Received</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arena-border">
                  {participants.map((p) => {
                    const profile = profiles[p.user_id] || {};
                    const matchObj = matches.find((m) => m.giver_id === p.user_id);
                    const receiverProfile = matchObj ? (profiles[matchObj.receiver_id] || {}) : null;

                    return (
                      <tr key={p.user_id} className="hover:bg-arena-card/40 transition">
                        <td className="py-3 px-2 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full border border-arena-border overflow-hidden shrink-0">
                            {profile.avatar_url ? (
                              <img
                                src={profile.avatar_url}
                                alt=""
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-full h-full bg-arena-surface grid place-items-center font-bold">
                                {profile.full_name?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                          <div>
                            <span className="block font-semibold text-arena-text">
                              {profile.full_name}
                            </span>
                            <span className="block text-[10px] text-arena-muted">
                              {profile.email}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-2 max-w-xs truncate" title={p.wishlist}>
                          <span className="text-arena-text leading-relaxed">
                            {p.wishlist}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          {receiverProfile ? (
                            <span className="font-medium text-arena-text">
                              🎯 {receiverProfile.full_name}
                            </span>
                          ) : (
                            <span className="text-arena-muted italic">Not matched</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              p.gift_sent ? "bg-arena-green" : "bg-arena-muted"
                            }`}
                          />
                        </td>
                        <td className="py-3 px-2 text-center">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              p.gift_received ? "bg-arena-blue" : "bg-arena-muted"
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                  {participants.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-arena-muted italic">
                        No participants registered yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
