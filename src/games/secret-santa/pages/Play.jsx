import { useEffect, useState } from "react";
import { supabaseHub } from "../../../lib/supabaseHub";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";

export default function Play() {
  const { user } = useAuth();
  const { t } = useT();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState(null);
  const [participant, setParticipant] = useState(null);
  const [publicParticipants, setPublicParticipants] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [wishlistText, setWishlistText] = useState("");
  const [savingWishlist, setSavingWishlist] = useState(false);

  // Matching phase states
  const [match, setMatch] = useState(null);
  const [receiverDetails, setReceiverDetails] = useState(null);
  const [myGiftSent, setMyGiftSent] = useState(false);
  const [unwrapped, setUnwrapped] = useState(false);

  // Fetch all initial data
  const fetchData = async () => {
    if (!supabaseHub || !user) return;
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

      // 2. Fetch profiles dictionary to map user info
      const { data: profs, error: profErr } = await supabaseHub
        .from("profiles")
        .select("id, full_name, avatar_url");
      if (profErr) throw profErr;

      const profMap = {};
      profs.forEach((p) => {
        profMap[p.id] = p;
      });
      setProfiles(profMap);

      // 3. Fetch public participants to display who has joined
      const { data: publicParts, error: partsErr } = await supabaseHub
        .from("santa_public_participants")
        .select("*")
        .eq("event_id", activeEvent.id);
      if (partsErr) throw partsErr;
      setPublicParticipants(publicParts || []);

      // 4. Fetch current user's registration
      const { data: part, error: partErr } = await supabaseHub
        .from("santa_participants")
        .select("*")
        .eq("event_id", activeEvent.id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (partErr) throw partErr;
      setParticipant(part);
      if (part) {
        setWishlistText(part.wishlist);
      }

      // 5. If matched or completed, fetch pairing details
      if (activeEvent.status === "matched" || activeEvent.status === "completed") {
        // Check if user has unwrapped before
        const wasUnwrapped = localStorage.getItem(`santa_unwrapped:${activeEvent.id}:${user.id}`);
        if (wasUnwrapped === "true") {
          setUnwrapped(true);
        }

        // Fetch match where current user is the giver
        const { data: matches, error: matchErr } = await supabaseHub
          .from("santa_matches")
          .select("*")
          .eq("event_id", activeEvent.id)
          .eq("giver_id", user.id)
          .maybeSingle();

        if (matchErr) throw matchErr;

        if (matches) {
          setMatch(matches);

          // Fetch receiver's registration to get their wishlist
          const { data: recPart, error: recErr } = await supabaseHub
            .from("santa_participants")
            .select("*")
            .eq("event_id", activeEvent.id)
            .eq("user_id", matches.receiver_id)
            .maybeSingle();

          if (recErr) throw recErr;
          setReceiverDetails(recPart);
        }

        // Fetch if current user's secret Santa has sent their gift (RPC call)
        const { data: isSent, error: rpcErr } = await supabaseHub
          .rpc("is_my_gift_sent", { p_event_id: activeEvent.id });
        if (!rpcErr) {
          setMyGiftSent(Boolean(isSent));
        }
      }
    } catch (e) {
      console.error("[secret-santa] fetchData error", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Join or Update Wishlist
  const handleSaveRegistration = async (e) => {
    e.preventDefault();
    if (!wishlistText.trim() || !event || savingWishlist) return;
    setSavingWishlist(true);
    try {
      if (participant) {
        // Update wishlist
        const { error } = await supabaseHub
          .from("santa_participants")
          .update({ wishlist: wishlistText })
          .eq("event_id", event.id)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        // Insert new registration
        const { error } = await supabaseHub
          .from("santa_participants")
          .insert({
            event_id: event.id,
            user_id: user.id,
            wishlist: wishlistText,
          });
        if (error) throw error;
      }
      await fetchData();
    } catch (err) {
      console.error("[secret-santa] handleSaveRegistration error", err);
    } finally {
      setSavingWishlist(false);
    }
  };

  // Toggle my own gift_sent status (I have prepared/delivered the gift to my receiver)
  const toggleGiftSent = async () => {
    if (!event || !participant) return;
    const nextStatus = !participant.gift_sent;
    try {
      const { error } = await supabaseHub
        .from("santa_participants")
        .update({ gift_sent: nextStatus })
        .eq("event_id", event.id)
        .eq("user_id", user.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error("[secret-santa] toggleGiftSent error", err);
    }
  };

  // Toggle my own gift_received status (I have received the gift from my secret Santa)
  const toggleGiftReceived = async () => {
    if (!event || !participant) return;
    const nextStatus = !participant.gift_received;
    try {
      const { error } = await supabaseHub
        .from("santa_participants")
        .update({ gift_received: nextStatus })
        .eq("event_id", event.id)
        .eq("user_id", user.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error("[secret-santa] toggleGiftReceived error", err);
    }
  };

  const handleUnwrap = () => {
    if (!event) return;
    setUnwrapped(true);
    localStorage.setItem(`santa_unwrapped:${event.id}:${user.id}`, "true");
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] grid place-items-center bg-arena-bg text-arena-muted text-sm">
        {t("common.loading")}
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20">
        <div className="relative rounded-2xl border border-arena-border bg-arena-surface p-10 sm:p-14 text-center overflow-hidden">
          {/* Christmas glow corners */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-arena-red/20 to-transparent pointer-events-none rounded-tr-2xl" />
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-arena-green/20 to-transparent pointer-events-none rounded-bl-2xl" />

          {/* Floating snow emojis */}
          <div className="absolute top-4 left-6 text-xl opacity-60 animate-bounce" style={{ animationDuration: "3s" }}>❄️</div>
          <div className="absolute top-10 right-10 text-lg opacity-50 animate-bounce" style={{ animationDuration: "4s", animationDelay: "0.5s" }}>❄️</div>
          <div className="absolute bottom-8 right-8 text-lg opacity-40 animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "1s" }}>✨</div>
          <div className="absolute bottom-12 left-10 text-base opacity-50 animate-bounce" style={{ animationDuration: "4.5s", animationDelay: "0.8s" }}>❄️</div>

          <div className="relative">
            <p className="text-[10px] tracking-[0.4em] uppercase mb-3">
              <span className="bg-gradient-to-r from-arena-red via-arena-amber to-arena-green bg-clip-text text-transparent">
                {t("santa.tag")}
              </span>
            </p>
            <div className="text-7xl mb-6 inline-block animate-pulse">🎄</div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold mb-3">
              <span className="bg-gradient-to-r from-arena-red to-arena-green bg-clip-text text-transparent">
                {t("santa.user_no_event_title")}
              </span>
            </h1>
            <p className="text-sm text-arena-muted max-w-md mx-auto leading-relaxed">
              {t("santa.user_no_event_desc")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
      {/* Header */}
      <header className="mb-10 text-center">
        <p className="text-[10px] tracking-[0.4em] uppercase">
          <span className="text-arena-red">🎄 </span>
          <span className="bg-gradient-to-r from-arena-red via-arena-amber to-arena-green bg-clip-text text-transparent">
            {t("santa.tag")}
          </span>
          <span className="text-arena-green"> 🎁</span>
        </p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl font-semibold">
          {event.title}
        </h1>
        <p className="mt-2 text-sm text-arena-muted max-w-xl mx-auto">
          {t("santa.tagline")}
        </p>
      </header>

      {/* Main Grid */}
      <div className="grid md:grid-cols-3 gap-8 items-start">
        {/* Play Panel (Left/Center columns) */}
        <div className="md:col-span-2 space-y-8">
          {/* Phase 1: Registration */}
          {event.status === "registration" && (
            <div className="rounded-lg border border-arena-border bg-arena-surface p-6 sm:p-8 relative overflow-hidden">
              {/* Christmas decorations */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-arena-red/10 to-transparent pointer-events-none rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-arena-green/10 to-transparent pointer-events-none rounded-bl-lg" />
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">🎅</span>
                <div>
                  <h2 className="font-display text-xl font-semibold text-arena-text">
                    {t("santa.reg_title")}
                  </h2>
                  <p className="text-xs text-arena-muted">
                    {t("santa.reg_subtitle")}
                  </p>
                </div>
              </div>

              {participant && (
                <div className="mb-6 p-4 rounded-md bg-arena-green/10 border border-arena-green/20 text-arena-green text-sm flex items-center gap-2">
                  <span>✨</span>
                  <div>
                    <span className="font-semibold">{t("santa.reg_success")}</span>{" "}
                    {t("santa.reg_waiting")}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveRegistration} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-arena-muted mb-2 font-semibold">
                    {t("santa.wishlist_label")}
                  </label>
                  <textarea
                    value={wishlistText}
                    onChange={(e) => setWishlistText(e.target.value)}
                    required
                    rows={4}
                    placeholder={t("santa.wishlist_placeholder")}
                    className="w-full rounded-md border border-arena-border bg-arena-card text-sm text-arena-text p-3 focus:outline-none focus:border-arena-red leading-relaxed"
                  />
                </div>
                <div className="flex items-center justify-between gap-4 pt-2">
                  <div className="text-xs text-arena-muted">
                    {t("santa.budget_info")}: <span className="text-arena-red font-semibold">300k - 500k VND</span>
                  </div>
                  <button
                    type="submit"
                    disabled={savingWishlist}
                    className="px-6 py-2 rounded-md font-semibold text-sm tracking-wide text-arena-bg bg-gradient-to-r from-arena-red to-arena-green hover:brightness-110 transition disabled:opacity-50"
                  >
                    {savingWishlist
                      ? t("santa.btn_saving")
                      : participant
                      ? t("santa.btn_update_wishlist")
                      : t("santa.btn_join")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Phase 2: Matched */}
          {event.status === "matched" && (
            <div className="space-y-6">
              {/* Present Reveal / Unwrap Area */}
              {!unwrapped ? (
                <div className="rounded-lg border-2 border-dashed border-arena-green/50 bg-arena-surface p-12 text-center relative overflow-hidden flex flex-col items-center justify-center">
                  <div className="absolute inset-0 bg-gradient-to-t from-arena-red/5 via-transparent to-arena-green/5 pointer-events-none" />
                  <div className="relative text-7xl mb-6 animate-bounce">🎁</div>
                  <button
                    onClick={handleUnwrap}
                    className="relative px-8 py-4 rounded-full font-display font-semibold text-sm uppercase tracking-[0.2em] bg-gradient-to-r from-arena-red to-arena-green text-arena-bg hover:scale-105 active:scale-95 transition shadow-lg shadow-arena-red/35"
                  >
                    {t("santa.unwrap_cta")}
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-arena-border bg-arena-surface p-6 sm:p-8 relative overflow-hidden animate-fadeIn">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-arena-red/10 to-transparent pointer-events-none rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-arena-green/10 to-transparent pointer-events-none rounded-bl-lg" />
                  <div className="flex items-start gap-4 mb-6">
                    <span className="text-3xl">🎄</span>
                    <div>
                      <h2 className="font-display text-xl font-semibold text-arena-text">
                        {t("santa.giver_card_title")}
                      </h2>
                      <p className="text-xs text-arena-muted">
                        {t("santa.giver_card_desc")}
                      </p>
                    </div>
                  </div>

                  {match && receiverDetails && profiles[match.receiver_id] ? (
                    <div className="p-6 rounded-lg border border-arena-border bg-arena-card mb-6">
                      <div className="flex items-center gap-4 mb-5">
                        <div className="w-14 h-14 rounded-full border border-arena-border overflow-hidden shrink-0">
                          {profiles[match.receiver_id].avatar_url ? (
                            <img
                              src={profiles[match.receiver_id].avatar_url}
                              alt=""
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full bg-arena-surface grid place-items-center text-lg font-bold">
                              {profiles[match.receiver_id].full_name?.charAt(0) || "?"}
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-display text-lg font-bold text-arena-text">
                            {profiles[match.receiver_id].full_name}
                          </h3>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-arena-muted font-bold mb-1">
                            {t("santa.target_wishlist")}
                          </span>
                          <p className="text-sm text-arena-text bg-arena-surface rounded border border-arena-border p-3 whitespace-pre-wrap leading-relaxed">
                            {receiverDetails.wishlist}
                          </p>
                        </div>

                        <div className="grid sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="block text-[10px] uppercase tracking-wider text-arena-muted font-bold mb-1">
                              {t("santa.budget_info")}
                            </span>
                            <span className="text-arena-red font-semibold text-sm">
                              300k - 500k VND
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-arena-muted text-center py-6">
                      You were not matched in this event (did you miss the registration?).
                    </div>
                  )}

                  <div className="border-t border-arena-border pt-5 space-y-4 text-xs text-arena-muted leading-relaxed">
                    <p>💡 {t("santa.delivery_instructions")}</p>
                  </div>
                </div>
              )}

              {/* Status Checklist (My Gift Sent / My Gift Received) */}
              {participant && unwrapped && (
                <div className="rounded-lg border border-arena-border bg-arena-surface p-6 space-y-5">
                  <h3 className="font-display text-md font-semibold text-arena-text">
                    ✅ Checklist
                  </h3>

                  <div className="space-y-3">
                    {/* Giver Checklist: Have I sent the gift? */}
                    <label className="flex items-start gap-3 p-3 rounded-md bg-arena-card border border-arena-border cursor-pointer hover:bg-arena-card/80 transition select-none">
                      <input
                        type="checkbox"
                        checked={participant.gift_sent}
                        onChange={toggleGiftSent}
                        className="mt-0.5 w-4 h-4 rounded border-arena-border bg-arena-card text-arena-red focus:ring-arena-red focus:ring-offset-0 focus:outline-none"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-arena-text">
                          {t("santa.status_sent_label")}
                        </span>
                      </div>
                    </label>

                    {/* Receiver Checklist: Have I received the gift? */}
                    <label className="flex items-start gap-3 p-3 rounded-md bg-arena-card border border-arena-border cursor-pointer hover:bg-arena-card/80 transition select-none">
                      <input
                        type="checkbox"
                        checked={participant.gift_received}
                        onChange={toggleGiftReceived}
                        className="mt-0.5 w-4 h-4 rounded border-arena-border bg-arena-card text-arena-red focus:ring-arena-red focus:ring-offset-0 focus:outline-none"
                      />
                      <div>
                        <span className="block text-sm font-semibold text-arena-text">
                          {t("santa.status_received_label")}
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* Status of my own Santa */}
                  <div className="border-t border-arena-border pt-4">
                    <span className="block text-[10px] uppercase tracking-wider text-arena-muted font-bold mb-2">
                      {t("santa.my_santa_status")}
                    </span>
                    <div className="flex items-center gap-2 text-sm">
                      {myGiftSent ? (
                        <span className="text-arena-green">
                          🎁 {t("santa.my_santa_sent")}
                        </span>
                      ) : (
                        <span className="text-arena-amber">
                          🎄 {t("santa.my_santa_preparing")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Phase 3: Completed */}
          {event.status === "completed" && (
            <div className="rounded-lg border border-arena-border bg-arena-surface p-8 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-arena-red/10 to-transparent pointer-events-none rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-arena-green/10 to-transparent pointer-events-none rounded-bl-lg" />
              <div className="text-6xl mb-4 animate-pulse">🎉</div>
              <h2 className="font-display text-2xl font-bold text-arena-text mb-2">
                {t("santa.completed_title")}
              </h2>
              <p className="text-sm text-arena-muted max-w-md mx-auto mb-6">
                {t("santa.completed_desc")}
              </p>
            </div>
          )}
        </div>

        {/* Side Panel: Rules + Registered participants list (Right Column) */}
        <aside className="space-y-6">
          {/* Rules */}
          <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-arena-red/10 to-transparent pointer-events-none rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-arena-green/10 to-transparent pointer-events-none rounded-bl-lg" />
            <h2 className="relative font-display text-md font-semibold text-arena-text flex items-center gap-2 border-b border-arena-border pb-2">
              <span>📜</span>
              <span className="bg-gradient-to-r from-arena-red to-arena-green bg-clip-text text-transparent">
                {t("santa.rules_title")}
              </span>
            </h2>
            <ol className="relative space-y-2.5 text-xs text-arena-muted leading-relaxed list-none">
              {[
                t("santa.rule_1"),
                t("santa.rule_2"),
                t("santa.rule_3"),
                t("santa.rule_4"),
                t("santa.rule_5"),
              ].map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="shrink-0 w-5 h-5 grid place-items-center rounded-full bg-gradient-to-br from-arena-red to-arena-green text-arena-bg text-[10px] font-bold">
                    {idx + 1}
                  </span>
                  <span>{rule}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Participants */}
          <div className="rounded-lg border border-arena-border bg-arena-surface p-5 space-y-4">
            <h2 className="font-display text-lg font-semibold text-arena-text">
            {t("santa.participants_joined", { n: publicParticipants.length })}
          </h2>

          {publicParticipants.length === 0 ? (
            <p className="text-xs text-arena-muted">No one has registered yet.</p>
          ) : (
            <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {publicParticipants.map((p) => {
                const userProfile = profiles[p.user_id];
                if (!userProfile) return null;
                return (
                  <li
                    key={p.user_id}
                    className="flex items-center gap-3 rounded border border-arena-border bg-arena-card px-3 py-2"
                  >
                    <div className="w-8 h-8 rounded-full border border-arena-border overflow-hidden shrink-0">
                      {userProfile.avatar_url ? (
                        <img
                          src={userProfile.avatar_url}
                          alt=""
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full bg-arena-surface grid place-items-center text-xs font-bold">
                          {userProfile.full_name?.charAt(0) || "?"}
                        </div>
                      )}
                    </div>
                    <span className="text-xs font-medium text-arena-text truncate flex-1">
                      {userProfile.full_name}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          </div>
        </aside>
      </div>
    </div>
  );
}
