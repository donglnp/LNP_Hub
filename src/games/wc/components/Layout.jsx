import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import ThemeToggle from "../../../components/ThemeToggle";
import RulesModal from "./RulesModal";
import { useT } from "../../../lib/i18n";

export default function Layout({ user }) {
  const { t } = useT();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const TABS = [
    { to: "/wc", label: t("nav.dashboard"), end: true },
    { to: "/wc/matches", label: t("nav.matches") },
    { to: "/wc/leaderboard", label: t("nav.leaderboard") },
    { to: "/wc/scorers", label: t("nav.scorers") },
  ];

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="border-b border-arena-border bg-arena-bg/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-8">
          <NavLink to="/" className="shrink-0 flex items-center gap-2" onClick={() => setMenuOpen(false)} title="Back to Arena">
            <span className="w-2 h-2 rounded-full bg-arena-green shadow-[0_0_8px_#22E27A]" />
            <span className="font-display font-semibold tracking-tight text-lg">
              LNP Hub<span className="text-arena-green">.</span>
              <span className="ml-2 text-[10px] tracking-[0.3em] uppercase text-arena-muted font-normal align-middle">World Cup</span>
            </span>
          </NavLink>

          <nav className="hidden sm:flex items-center gap-1 ml-4">
            {TABS.map((tab) => (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm rounded-md transition ${
                    isActive
                      ? "text-arena-green"
                      : "text-arena-muted hover:text-arena-text"
                  }`
                }
              >
                {tab.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRulesOpen(true)}
              title={t("rules.cta")}
              className="text-xs text-arena-muted hover:text-arena-text inline-flex items-center gap-1.5"
            >
              <span className="w-5 h-5 grid place-items-center rounded-full border border-arena-border text-[11px] font-semibold">
                ?
              </span>
              <span className="hidden sm:inline">{t("rules.cta")}</span>
            </button>
            <ThemeToggle variant="nav" />
            <LanguageSwitcher variant="nav" />
            <NavLink
              to="/wc/profile"
              title={user?.name}
              className="w-9 h-9 rounded-full border border-arena-border bg-arena-card grid place-items-center text-xs font-semibold hover:border-arena-green/60 overflow-hidden"
              onClick={() => setMenuOpen(false)}
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
            </NavLink>

            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="sm:hidden w-8 h-8 grid place-items-center text-arena-muted hover:text-arena-text transition"
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
              className="fixed inset-0 z-20 sm:hidden"
              onClick={() => setMenuOpen(false)}
            />
            <nav className="sm:hidden relative z-30 border-t border-arena-border bg-arena-bg/95 backdrop-blur">
              {TABS.map((tab) => (
                <NavLink
                  key={tab.to}
                  to={tab.to}
                  end={tab.end}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `block px-6 py-4 text-sm border-b border-arena-border/50 last:border-0 transition ${
                      isActive
                        ? "text-arena-green"
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

      {rulesOpen && <RulesModal onClose={() => setRulesOpen(false)} />}
    </div>
  );
}
