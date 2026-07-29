import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import ThemeToggle from "../../../components/ThemeToggle";

export default function WoolCrushLayout({ user }) {
  const { isAdmin } = useAuth();
  const { t } = useT();
  const initials = (user?.name || "?")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="sticky top-0 z-30 border-b border-arena-border bg-arena-bg/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:gap-8 sm:px-6">
          <NavLink to="/" className="flex shrink-0 items-center gap-2" title="Back to Hub">
            <span className="h-2 w-2 rounded-full bg-arena-amber shadow-[0_0_8px_#E8A93C]" />
            <span className="font-display text-lg font-semibold tracking-tight">
              LNP Hub<span className="text-arena-amber">.</span>
              <span className="ml-2 align-middle text-[10px] font-normal uppercase tracking-[0.3em] text-arena-muted">
                {t("wool.brand_tag")}
              </span>
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle variant="nav" />
            <LanguageSwitcher variant="nav" />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="hidden items-center gap-2 rounded-md border border-arena-amber/30 bg-arena-amber/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-arena-amber hover:bg-arena-amber/25 sm:inline-flex"
              >
                Admin
              </NavLink>
            )}
            <div
              title={user?.name}
              className="grid h-9 w-9 place-items-center overflow-hidden rounded-full border border-arena-border bg-arena-card text-xs font-semibold"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
