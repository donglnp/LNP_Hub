import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

const EVENTS = [
  { id: "wellness-challenge", label: "Wellness Challenge", icon: "💪", accent: "blue" },
  { id: "wc", label: "World Cup", icon: "⚽", accent: "blue" },
  { id: "secret-santa", label: "Secret Santa", icon: "🎄", accent: "green" },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-arena-bg text-arena-text">
      <header className="border-b border-arena-border bg-arena-bg/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link
            to="/"
            className="shrink-0 flex items-center gap-2"
            title="Back to Hub"
          >
            <span className="w-2 h-2 rounded-full bg-arena-blue shadow-[0_0_8px_#60A5FA]" />
            <span className="font-display font-semibold tracking-tight text-lg">
              LNP Hub<span className="text-arena-blue">.</span>
              <span className="ml-2 text-[10px] tracking-[0.3em] uppercase text-arena-muted font-normal align-middle">
                Admin
              </span>
            </span>
          </Link>
          <span className="ml-auto text-xs text-arena-muted">{user?.email}</span>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap gap-1 -mb-px">
          {EVENTS.map((ev) => {
            const activeCls =
              ev.accent === "green"
                ? "border-arena-green text-arena-green"
                : "border-arena-blue text-arena-blue";
            return (
              <NavLink
                key={ev.id}
                to={ev.id}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm border-b-2 transition flex items-center gap-2 ${
                    isActive
                      ? activeCls
                      : "border-transparent text-arena-muted hover:text-arena-text"
                  }`
                }
              >
                <span>{ev.icon}</span>
                {ev.label}
              </NavLink>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  );
}
