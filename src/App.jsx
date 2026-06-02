import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Catalog from "./pages/Catalog";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import { AuthProvider, useAuth } from "./lib/AuthContext";
import { I18nProvider } from "./lib/i18n";
import { ThemeProvider } from "./lib/ThemeContext";

const WorldCupGame = lazy(() => import("./games/wc"));
const WellnessChallenge = lazy(() => import("./games/wellness-challenge"));
const LuckyWheel = lazy(() => import("./games/lucky-wheel"));
const Admin = lazy(() => import("./pages/Admin"));

function GameFallback() {
  return (
    <div className="min-h-screen grid place-items-center bg-arena-bg text-arena-muted text-sm">
      Loading game…
    </div>
  );
}

function LoginRoute() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return user ? <Navigate to="/" replace /> : <Login />;
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginRoute />} />
            <Route element={<ProtectedRoute />}>
              <Route index element={<Catalog />} />
              <Route
                path="/wc/*"
                element={
                  <Suspense fallback={<GameFallback />}>
                    <WorldCupGame />
                  </Suspense>
                }
              />
              <Route
                path="/wellness-challenge/*"
                element={
                  <Suspense fallback={<GameFallback />}>
                    <WellnessChallenge />
                  </Suspense>
                }
              />
              <Route
                path="/lucky-wheel/*"
                element={
                  <Suspense fallback={<GameFallback />}>
                    <LuckyWheel />
                  </Suspense>
                }
              />
              <Route element={<AdminRoute />}>
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<GameFallback />}>
                      <Admin />
                    </Suspense>
                  }
                />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </AuthProvider>
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  );
}
