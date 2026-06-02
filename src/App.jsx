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
const SecretSanta = lazy(() => import("./games/secret-santa"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const WellnessAdmin = lazy(() => import("./pages/admin/WellnessAdmin"));
const WellnessEntriesTab = lazy(() =>
  import("./pages/admin/WellnessAdmin").then((m) => ({ default: m.EntriesTab }))
);
const WellnessUsersTab = lazy(() =>
  import("./pages/admin/WellnessAdmin").then((m) => ({ default: m.UsersTab }))
);
const WorldCupAdmin = lazy(() => import("./pages/admin/WorldCupAdmin"));
const SantaAdminPanel = lazy(() =>
  import("./games/secret-santa/pages/AdminPanel")
);

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
              <Route
                path="/secret-santa/*"
                element={
                  <Suspense fallback={<GameFallback />}>
                    <SecretSanta />
                  </Suspense>
                }
              />
              <Route element={<AdminRoute />}>
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<GameFallback />}>
                      <AdminLayout />
                    </Suspense>
                  }
                >
                  <Route index element={<Navigate to="wellness-challenge" replace />} />
                  <Route
                    path="wellness-challenge"
                    element={
                      <Suspense fallback={<GameFallback />}>
                        <WellnessAdmin />
                      </Suspense>
                    }
                  >
                    <Route index element={<Navigate to="entries" replace />} />
                    <Route
                      path="entries"
                      element={
                        <Suspense fallback={<GameFallback />}>
                          <WellnessEntriesTab />
                        </Suspense>
                      }
                    />
                    <Route
                      path="users"
                      element={
                        <Suspense fallback={<GameFallback />}>
                          <WellnessUsersTab />
                        </Suspense>
                      }
                    />
                  </Route>
                  <Route
                    path="wc"
                    element={
                      <Suspense fallback={<GameFallback />}>
                        <WorldCupAdmin />
                      </Suspense>
                    }
                  />
                  <Route
                    path="secret-santa"
                    element={
                      <Suspense fallback={<GameFallback />}>
                        <SantaAdminPanel />
                      </Suspense>
                    }
                  />
                </Route>
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
