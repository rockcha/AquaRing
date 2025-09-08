// src/App.tsx

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import "../index.css";

// 레이아웃 & 페이지
import AuthLayout from "@/layouts/AuthLayout";
import PageLayout from "@/layouts/PageLayout";
import LoginPage from "../pages/LoginPage";
import SignupPage from "../pages/SignupPage";
import MainPage from "../pages/MainPage";

// UserContext
import { UserProvider } from "@/contexts/UserContext";
import { Toaster } from "../components/ui/sonner";
import ShopPage from "@/pages/ShopPage";

export default function App() {
  return (
    <UserProvider>
      <Toaster />
      <BrowserRouter>
        <Routes>
          {/* ✅ 루트: 무조건 /login 으로 */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ✅ 인증 불필요 라우트 (AuthLayout 적용) */}
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

          {/* ✅ 그 외 앱 페이지: 기본적으로 PageLayout 사용 */}
          <Route element={<PageLayout />}>
            <Route path="/main" element={<MainPage />} />
            <Route path="/shop" element={<ShopPage />} />

            {/* 앞으로 여기에 앱 라우트 추가하면 자동으로 PageLayout 적용됨 */}
            {/* <Route path="/profile" element={<ProfilePage />} /> */}
          </Route>

          {/* 404 → /login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
