import { Link } from "react-router-dom";

export default function GameCard({ game, playLabel = "Play", comingSoonLabel = "Coming Soon" }) {
  const {
    name,
    description,
    path,
    icon,
    accent = "green",
    disabled,
    status,
    statusLabel,
    suggest,
    suggestSubject,
    suggestLabel,
  } = game;
  const accentClass =
    accent === "amber"
      ? "from-arena-amber/20 to-transparent border-arena-amber/30 hover:border-arena-amber/60"
      : accent === "christmas"
        ? "from-arena-red/20 via-arena-surface to-arena-green/20 border-arena-red/30 hover:border-arena-green/60"
        : accent === "red"
          ? "from-arena-red/20 to-transparent border-arena-red/30 hover:border-arena-red/60"
          : accent === "blue"
            ? "from-arena-blue/20 to-transparent border-arena-blue/30 hover:border-arena-blue/60"
            : "from-arena-green/20 to-transparent border-arena-green/30 hover:border-arena-green/60";

  let tag = playLabel;
  let tagClass = "text-arena-muted";
  if (suggest) {
    tag = suggestLabel || "Suggest";
    tagClass = "text-arena-green";
  } else if (disabled) {
    tag = comingSoonLabel;
  } else if (status === "upcoming") {
    tag = statusLabel || "Upcoming";
    tagClass = "text-arena-amber";
  } else if (status === "running") {
    tag = statusLabel || "Live";
    tagClass = "text-arena-green";
  } else if (status === "ended") {
    tag = statusLabel || "Ended";
    tagClass = "text-arena-muted";
  }

  const body = (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-lg border bg-gradient-to-br ${accentClass} bg-arena-surface p-6 transition ${
        disabled ? "opacity-50 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="text-3xl">{icon || "🎮"}</div>
        <span className={`text-[10px] tracking-[0.3em] uppercase ${tagClass}`}>
          {tag}
        </span>
      </div>
      <h3 className="mt-4 font-display text-xl font-semibold text-arena-text">
        {name}
      </h3>
      <p className="mt-2 text-sm text-arena-muted leading-relaxed line-clamp-3">
        {description}
      </p>
    </div>
  );

  if (suggest) {
    const subject = encodeURIComponent(suggestSubject || "New activity suggestion");
    return (
      <a className="h-full" href={`mailto:hub@lnp-technologies.com?subject=${subject}`}>
        {body}
      </a>
    );
  }
  if (disabled) return body;
  return (
    <Link className="h-full" to={path}>
      {body}
    </Link>
  );
}
