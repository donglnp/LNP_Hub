import { Link } from "react-router-dom";
import GameCard from "../components/GameCard";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { useAuth } from "../lib/AuthContext";
import { signOut } from "../lib/auth";
import { useT } from "../lib/i18n";
import { PROGRAM, programState, formatDate } from "../games/wellness-challenge/lib/data";

export default function Catalog() {
  const { user, isAdmin } = useAuth();
  const { t } = useT();

  const wcState = programState();
  const wellnessCard = {
    slug: "wellness-challenge",
    name: t("catalog.wellness_name"),
    description: t("catalog.wellness_desc"),
    path: "/wellness-challenge",
    icon: "💪",
    accent: "amber",
  };
  if (wcState === "upcoming") {
    wellnessCard.status = "upcoming";
    wellnessCard.statusLabel = t("catalog.tag_upcoming_date", {
      date: formatDate(PROGRAM.startDate),
    });
  } else if (wcState === "ended") {
    wellnessCard.status = "ended";
    wellnessCard.statusLabel = t("catalog.tag_ended");
  } else {
    wellnessCard.status = "running";
    wellnessCard.statusLabel = t("catalog.tag_running");
  }

  const games = [
    wellnessCard,
    {
      slug: "wc",
      name: t("catalog.wc_name"),
      description: t("catalog.wc_desc"),
      path: "/wc",
      icon: "⚽",
      accent: "green",
      status: "upcoming",
      statusLabel: t("catalog.tag_upcoming"),
    },
    {
      slug: "suggest",
      name: t("catalog.suggest_name"),
      description: t("catalog.suggest_desc"),
      icon: "💡",
      accent: "green",
      suggest: true,
      suggestSubject: t("catalog.suggest_subject"),
      suggestLabel: t("catalog.tag_suggest"),
    },
  ];

  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function logout() {
    await signOut();
  }

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="border-b border-arena-border bg-arena-bg/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link to="/" className="shrink-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-arena-blue shadow-[0_0_8px_#60A5FA]" />
            <span className="font-display font-semibold tracking-tight text-lg">
              LNP Hub<span className="text-arena-blue">.</span>
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            {isAdmin && (
              <Link
                to="/admin"
                className="hidden sm:inline-flex items-center gap-2 rounded-md bg-arena-blue/15 hover:bg-arena-blue/25 text-arena-blue border border-arena-blue/30 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
              >
                Admin
              </Link>
            )}
            <LanguageSwitcher variant="nav" />
            <button
              onClick={logout}
              className="text-[10px] tracking-[0.2em] uppercase px-3 py-2 rounded border border-arena-border hover:border-arena-red hover:text-arena-red"
            >
              {t("profile.sign_out")}
            </button>
            <div
              title={user?.name}
              className="w-9 h-9 rounded-full border border-arena-border bg-arena-card grid place-items-center text-xs font-semibold overflow-hidden"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <section className="mb-10">
          <p className="text-[10px] tracking-[0.4em] uppercase text-arena-blue">
            {t("common.system_online")}
          </p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl font-semibold">
            {t("catalog.welcome")},{" "}
            <span className="text-arena-blue">
              {user?.name?.split(" ")[0] || "Player"}
            </span>
          </h1>
          <p className="mt-3 text-sm text-arena-muted max-w-xl">
            {t("catalog.tagline")}
          </p>
        </section>

        <section className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {games.map((g) => (
            <GameCard key={g.slug} game={g} playLabel={t("catalog.tag_play")} comingSoonLabel={t("catalog.tag_coming_soon")} />
          ))}
        </section>
      </main>
    </div>
  );
}
