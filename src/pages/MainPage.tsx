"use client";

import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUser } from "@/contexts/UserContext";
import FriendTestCard from "@/features/friend/FriendTestCard";

export default function MainPage() {
  const nav = useNavigate();
  const { profile, user, signOut, loading } = useUser();

  const displayName =
    profile?.nickname ?? (user ? `user_${user.id.slice(0, 6)}` : "Guest");

  const handleLogout = async () => {
    await signOut();
    nav("/login", { replace: true });
  };

  return (
    <div className="min-h-screen grid place-items-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>메인 페이지</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FriendTestCard />
          <p>
            안녕하세요, <b>{loading ? "..." : displayName}</b> 👋
          </p>
          <p>여기에 대시보드 / 아쿠아리움 / 인벤토리 등을 붙이면 됩니다.</p>

          <div className="pt-2">
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
