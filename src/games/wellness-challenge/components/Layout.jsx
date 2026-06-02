import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import ThemeToggle from "../../../components/ThemeToggle";

export default function WellnessLayout({ user }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAdmin } = useAuth();
  const { t } = useT();
  const TABS = [
    { to: "/wellness-challenge", label: t("wc.tab_overview"), end: true },
    { to: "/wellness-challenge/log", label: t("wc.tab_log") },
    { to: "/wellness-challenge/history", label: t("wc.tab_history") },
    { to: "/wellness-challenge/leaderboard", label: t("wc.tab_leaderboard") },
    { to: "/wellness-challenge/rules", label: t("wc.tab_rules") },
  ];
  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="border-b border-arena-border bg-arena-bg/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-8">
          <NavLink
            to="/"
            className="shrink-0 flex items-center gap-2"
            onClick={() => setMenuOpen(false)}
            title="Back to Hub"
          >
            <span className="w-2 h-2 rounded-full bg-arena-amber shadow-[0_0_8px_#F5C451]" />
            <span className="font-display font-semibold tracking-tight text-lg">
              LNP Hub<span className="text-arena-amber">.</span>
              <span className="ml-2 text-[10px] tracking-[0.3em] uppercase text-arena-muted font-normal align-middle">
                {t("wc.brand_tag")}
              </span>
            </span>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 ml-4">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-3 py-2 text-sm rounded-md transition ${
                    isActive
                      ? "text-arena-amber"
                      : "text-arena-muted hover:text-arena-text"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle variant="nav" />
            <LanguageSwitcher variant="nav" />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="hidden sm:inline-flex items-center gap-2 rounded-md bg-arena-amber/15 hover:bg-arena-amber/25 text-arena-amber border border-arena-amber/30 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
              >
                Admin
              </NavLink>
            )}

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

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="md:hidden w-8 h-8 grid place-items-center text-arena-muted hover:text-arena-text transition"
            >
              {menuOpen ? (
                <span className="text-base leading-none">✕</span>
              ) : (
                <span className="flex flex-col gap-[5px]">
                  <span className="w-5 h-px bg-current block" />
                  <span className="w-5 h-px bg-current block" />
                  <span className="w-5 h-px bg-current block" />
                </span>
              )}
            </button>
          </div>
        </div>

        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-20 md:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="md:hidden relative z-30 border-t border-arena-border bg-arena-bg/95 backdrop-blur">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-6 py-4 text-sm border-b border-arena-border/50 last:border-0 transition ${
                      isActive
                        ? "text-arena-amber"
                        : "text-arena-muted hover:text-arena-text"
                    }`
                  }
                >
                  {tab.label}
                </NavLink>
              ))}
            </nav>
          </>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <Outlet />
      </main>
    </div>
  );
}
