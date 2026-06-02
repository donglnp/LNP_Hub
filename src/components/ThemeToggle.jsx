import { useEffect, useRef, useState } from "react";
import { useTheme } from "../lib/ThemeContext";

const OPTIONS = [
  { value: "light", label: "Light", icon: "☀️" },
  { value: "dark", label: "Dark", icon: "🌙" },
  { value: "system", label: "System", icon: "🖥️" },
];

export default function ThemeToggle({ variant = "nav" }) {
  const { preference, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = OPTIONS.find((o) => o.value === preference) || OPTIONS[2];

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const triggerCls =
    variant === "login"
      ? "text-xs text-arena-muted border border-arena-border rounded-md px-2 py-1 inline-flex items-center gap-1 hover:text-arena-text"
      : "text-xs text-arena-muted hover:text-arena-text inline-flex items-center gap-1";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={triggerCls}
        aria-label={`Theme: ${current.label}`}
        title={`Theme: ${current.label}`}
      >
        <span className="text-base leading-none">{current.icon}</span>
      </button>
      {open && (
        <ul className="absolute right-0 mt-2 w-40 rounded-md border border-arena-border bg-arena-surface shadow-card z-50 overflow-hidden">
          {OPTIONS.map((o) => (
            <li key={o.value}>
              <button
                type="button"
                onClick={() => {
                  setPreference(o.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-arena-card transition ${
                  o.value === preference ? "text-arena-blue" : "text-arena-text"
                }`}
              >
                <span>{o.icon}</span>
                <span className="flex-1">{o.label}</span>
                {o.value === preference && (
                  <span className="text-arena-blue text-xs">●</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
