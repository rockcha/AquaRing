// src/components/UserMenu.tsx
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown, LogOut } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { useNavigate } from "react-router-dom"; // ✅ 추가

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

type Props = {
  className?: string;
};

export default function UserMenu({ className }: Props) {
  const { loading, isAuthed, profile, signOut } = useUser();
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate(); // ✅ 추가

  if (loading) {
    return (
      <Button variant="ghost" className={className} disabled>
        로딩중…
      </Button>
    );
  }
  if (!isAuthed || !profile) {
    return null;
  }

  const nickname = profile.nickname || "User";

  const handleSignOut = async () => {
    try {
      setSigningOut(true);

      // 기다리지 말고: 로컬은 즉시 비워지므로 라우팅이 바로 가능
      signOut();

      // 즉시 라우팅
      navigate("/login", { replace: true });

      // 보호용 하드 리다이렉트 (라우터 컨텍스트가 꼬였을 때)
      setTimeout(() => {
        if (location.pathname !== "/login") {
          window.location.replace("/login");
        }
      }, 120);
    } catch (e: any) {
      toast.error(e?.message ?? "로그아웃 실패");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={className}
          disabled={signingOut}
          aria-label="사용자 메뉴 열기"
        >
          <span className="max-w-[120px] truncate">{nickname}</span>
          <ChevronDown className="ml-1 h-4 w-4 opacity-70" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate">{nickname}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="cursor-pointer text-red-600 focus:text-red-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
