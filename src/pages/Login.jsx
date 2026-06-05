import { useState } from "react";
import { signInWithGoogle, isSupabaseReady } from "../lib/auth";
import LanguageSwitcher from "../components/LanguageSwitcher";
import ThemeToggle from "../components/ThemeToggle";
import Starfield from "../components/Starfield";
import AntigravityHeadline from "../components/AntigravityHeadline";
import GravityReadout from "../components/GravityReadout";
import { useT } from "../lib/i18n";
import { useTheme } from "../lib/ThemeContext";

export default function Login() {
  const { t } = useT();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  async function handleGoogleSignIn() {
    if (!isSupabaseReady) {
      setError(t("login.err_supabase"));
      setStatus("error");
      return;
    }
    setStatus("signing");
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(e.message || "Failed to sign in with Google.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[460px_1fr]">
      <aside className="relative px-6 py-8 sm:px-10 sm:py-10 flex flex-col">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-arena-blue shadow-[0_0_8px_#60A5FA]" />
            <span className="font-display font-semibold tracking-tight">
              LNP Hub<span className="text-arena-blue">.</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle variant="login" />
            <LanguageSwitcher variant="login" />
          </div>
        </div>

        <div className="flex-1 flex flex-col justify-center max-w-sm">
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.05] tracking-tight">
            {t("login.headline_1")}
            <br />
            <span>{t("login.headline_2")}</span>{" "}
            <span className="text-arena-blue">{t("login.headline_3")}</span>
          </h1>
          <p className="mt-6 text-sm text-arena-muted leading-relaxed">
            {t("login.tagline")}
          </p>

          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={status === "signing" || !isSupabaseReady}
              className="inline-flex items-center justify-center gap-3 w-full rounded-md bg-arena-text text-arena-bg px-5 py-3 text-sm font-semibold tracking-[0.18em] uppercase hover:brightness-110 transition disabled:opacity-50"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.99.66-2.25 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.11A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.11V7.05H2.18A11 11 0 0 0 1 12c0 1.78.43 3.46 1.18 4.95l3.66-2.84Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z"
                />
              </svg>
              <span>
                {status === "signing"
                  ? t("login.signing")
                  : t("login.continue_google")}
              </span>
            </button>

            <p className="text-xs text-arena-muted">
              {t("login.subtitle")}
            </p>

            {error && (
              <p className="text-xs text-arena-red border border-arena-red/30 bg-arena-red/10 rounded px-3 py-2">
                {error}
              </p>
            )}
            {!isSupabaseReady && (
              <p className="text-[11px] text-arena-muted">
                {t("login.env_missing")}
              </p>
            )}
          </div>
        </div>

        <p className="text-[10px] text-arena-muted tracking-[0.3em] uppercase">
          {t("common.copyright")}
        </p>
      </aside>

      <div
        className={`relative hidden lg:block overflow-hidden border-l border-arena-border ${
          isDark ? "bg-[#05080F]" : "bg-[#EAF0FB]"
        }`}
      >
        <Starfield />
        {/* <AntigravityHeadline /> */}

        {/* subtle overlays for depth */}
        <div
          className={`pointer-events-none absolute inset-0 ${
            isDark
              ? "bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(5,8,15,0.85)_100%)]"
              : "bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(234,240,251,0.7)_100%)]"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent to-transparent ${
            isDark ? "from-[#05080F]" : "from-[#EAF0FB]"
          }`}
        />

        {/* corner brackets */}
        <div className="pointer-events-none absolute inset-6">
          <span className="absolute top-0 left-0 w-6 h-6 border-t border-l border-arena-blue/60" />
          <span className="absolute top-0 right-0 w-6 h-6 border-t border-r border-arena-blue/60" />
          <span className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-arena-blue/60" />
          <span className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-arena-blue/60" />
        </div>

        {/* bottom-left hint */}
        <div
          className={`pointer-events-none absolute bottom-10 left-10 flex items-center gap-2 rounded-full border backdrop-blur px-3 py-1.5 ${
            isDark ? "border-white/10 bg-black/30" : "border-black/10 bg-white/40"
          }`}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" className="text-arena-blue">
            <path d="M5 5l6 14 2-6 6-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
          </svg>
          <span
            className={`text-[10px] tracking-[0.3em] uppercase font-mono ${
              isDark ? "text-white/70" : "text-slate-600"
            }`}
          >
            move cursor to interact
          </span>
        </div>

        {/* bottom-right stats */}
        <div className="pointer-events-none absolute bottom-10 right-10 font-mono text-right">
          <div
            className={`flex items-center justify-end gap-3 text-[10px] tracking-[0.3em] uppercase ${
              isDark ? "text-white/40" : "text-slate-500/70"
            }`}
          >
            <span><span className="text-arena-blue">●</span> nodes 220</span>
            <span><span className="text-arena-blue">●</span> 60fps</span>
            <span><span className="text-arena-blue">●</span> sync</span>
          </div>
          <div className="mt-2 flex justify-end">
            <GravityReadout />
          </div>
        </div>

      </div>
    </div>
  );
}
