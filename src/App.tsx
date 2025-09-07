import React, { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import supabase from "./lib/supabase";
import "./index.css";

// 레이아웃 & 페이지
import AuthLayout from "@/layouts/AuthLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import MainPage from "./pages/MainPage";

// UserContext
import { UserProvider } from "@/contexts/UserContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <UserProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* 처음 진입 분기 */}
          <Route path="/" element={<EntryRoute />} />

          {/* 인증 필요 없는 라우트 (AuthLayout 적용) */}
          <Route
            path="/login"
            element={
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthLayout>
                <SignupPage />
              </AuthLayout>
            }
          />

          {/* 인증 필요한 라우트 (일반 레이아웃) */}
          <Route
            path="/main"
            element={
              <RequireAuth>
                <MainPage />
              </RequireAuth>
            }
          />

          {/* 미지정 경로 → 루트로 */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}

/* ----------------------------------------------
 * EntryRoute — 세션 있으면 /main, 없으면 /login
 * ---------------------------------------------- */
function EntryRoute() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setHasSession(!!data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setHasSession(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (loading || hasSession === null) {
    return (
      <div className="min-h-screen grid place-items-center">
        <p>로딩 중…</p>
      </div>
    );
  }
  return <Navigate to={hasSession ? "/main" : "/login"} replace />;
}

/* ----------------------------------------------
 * RequireAuth — 보호 라우트
 * ---------------------------------------------- */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setOk(!!data.session);
      setChecking(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!mounted) return;
      setOk(!!session);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (checking)
    return (
      <div className="min-h-screen grid place-items-center">
        <p>확인 중…</p>
      </div>
    );

  if (!ok)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
}
