import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../../lib/AuthContext";
import { useT } from "../../../lib/i18n";
import LanguageSwitcher from "../../../components/LanguageSwitcher";
import ThemeToggle from "../../../components/ThemeToggle";

export default function LuckyWheelLayout({ user }) {
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
      <header className="border-b border-arena-border bg-arena-bg/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3 sm:gap-8">
          <NavLink to="/" className="shrink-0 flex items-center gap-2" title="Back to Hub">
            <span className="w-2 h-2 rounded-full bg-arena-red shadow-[0_0_8px_#DC2626]" />
            <span className="font-display font-semibold tracking-tight text-lg">
              LNP Hub<span className="text-arena-red">.</span>
              <span className="ml-2 text-[10px] tracking-[0.3em] uppercase text-arena-muted font-normal align-middle">
                {t("lw.brand_tag")}
              </span>
            </span>
          </NavLink>

          <div className="ml-auto flex items-center gap-3">
            <ThemeToggle variant="nav" />
            <LanguageSwitcher variant="nav" />
            {isAdmin && (
              <NavLink
                to="/admin"
                className="hidden sm:inline-flex items-center gap-2 rounded-md bg-arena-red/15 hover:bg-arena-red/25 text-arena-red border border-arena-red/30 px-3 py-1.5 text-xs font-semibold tracking-wide uppercase"
              >
                Admin
              </NavLink>
            )}
            <div
              title={user?.name}
              className="w-9 h-9 rounded-full border border-arena-border bg-arena-card grid place-items-center text-xs font-semibold overflow-hidden"
            >
              {user?.avatar ? (
                <img src={user.avatar} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
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
