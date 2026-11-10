import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { ApiError, clearToken, getToken } from "./api/client.js";
import { getMe } from "./api/auth.api.js";
import type { AuthAdmin } from "./types/auth.types.js";
import RegisterPage from "./pages/RegisterPage.js";
import HomePage from "./pages/HomePage.js";

const DashboardPage = lazy(() => import("./pages/DashboardPage.js"));
const AccreditPage = lazy(() => import("./pages/AccreditPage.js"));
const ImportExportPage = lazy(() => import("./pages/ImportExportPage.js"));
const ReportsPage = lazy(() => import("./pages/ReportsPage.js"));
const LoginPage = lazy(() => import("./pages/LoginPage.js"));

function AdminLogin({
  onLoggedIn,
}: {
  onLoggedIn: (a: AuthAdmin) => void;
}): JSX.Element {
  const navigate = useNavigate();
  return (
    <LoginPage
      onLoggedIn={(a) => {
        onLoggedIn(a);
        navigate("/dashboard");
      }}
    />
  );
}

function Shell(): JSX.Element {
  const [admin, setAdmin] = useState<AuthAdmin | null>(null);
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const handleAdminLogout = useCallback((): void => {
    clearToken();
    setAdmin(null);
    navigate("/login");
  }, [navigate]);

  useEffect(() => {
    const boot = async (): Promise<void> => {
      if (!getToken()) {
        setChecking(false);
        return;
      }
      try {
        setAdmin(await getMe());
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          clearToken();
        }
      } finally {
        setChecking(false);
      }
    };
    void boot();
  }, []);

  const scrollKey = location.pathname;
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [scrollKey]);

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <p className="text-slate-500">Checking sign in...</p>
      </main>
    );
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
          <p className="text-slate-500">Loading...</p>
        </main>
      }
    >
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminLogin onLoggedIn={setAdmin} />} />
        <Route
          path="/dashboard"
          element={
            admin ? (
              <DashboardPage
                admin={admin}
                onLogout={handleAdminLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/guests"
          element={
            admin ? (
              <DashboardPage
                admin={admin}
                onLogout={handleAdminLogout}
                initialSection="guests"
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/accredit"
          element={
            admin ? (
              <AccreditPage onAuthExpired={handleAdminLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/import-export"
          element={
            admin ? (
              <ImportExportPage
                admin={admin}
                onLogout={handleAdminLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/admin/reports"
          element={
            admin ? (
              <ReportsPage
                admin={admin}
                onLogout={handleAdminLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Suspense>
  );
}

export default function App(): JSX.Element {
  return <Shell />;
}
