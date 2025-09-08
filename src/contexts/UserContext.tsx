"use client";

import React from "react";
import { toast } from "sonner";
import supabase from "@/lib/supabase";

// ===== 타입 =====
export type SessionUser = {
  id: string; // 이메일 제거
};

export type AppUser = {
  id: string;
  nickname: string;
  created_at?: string;
};

type Ctx = {
  loading: boolean;
  isAuthed: boolean;
  session: import("@supabase/supabase-js").Session | null;
  user: SessionUser | null; // auth.users (email 제거 버전)
  profile: AppUser | null; // public.app_users
  refresh: () => Promise<void>;
  updateNickname: (nickname: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const UserContext = React.createContext<Ctx | undefined>(undefined);

// ===== 유틸 =====
async function fetchProfile(userId: string): Promise<AppUser | null> {
  const { data, error } = await supabase
    .from("app_users")
    .select("id,nickname,created_at")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// ===== Provider =====

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<
    import("@supabase/supabase-js").Session | null
  >(null);
  const [user, setUser] = React.useState<SessionUser | null>(null);
  const [profile, setProfile] = React.useState<AppUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  // 최초 세션/프로필 적재 + Auth 구독
  React.useEffect(() => {
    let mounted = true;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      const u = data.session?.user;
      setUser(u ? { id: u.id } : null); // 이메일 제거
      if (u) {
        try {
          const p = await fetchProfile(u.id);
          if (mounted) setProfile(p);
        } catch (e: any) {
          toast.error(e?.message ?? "프로필을 불러오지 못했습니다");
        }
      }
      setLoading(false);
    })();

    const sub = supabase.auth.onAuthStateChange((_evt, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      const u = newSession?.user;
      setUser(u ? { id: u.id } : null); // 이메일 제거
      if (!u) setProfile(null); // 로그아웃 시 정리
      // 로그인/로그아웃 순간의 상세 프로필은 필요할 때 refresh로 불러옴
    });

    return () => {
      mounted = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  // 액션
  const refresh = React.useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const p = await fetchProfile(user.id);
      setProfile(p);
    } catch (e: any) {
      toast.error(e?.message ?? "프로필 새로고침 실패");
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateNickname = React.useCallback(
    async (nickname: string) => {
      if (!user) throw new Error("로그인이 필요합니다");
      if (!nickname || nickname.trim().length < 2)
        throw new Error("닉네임을 확인해 주세요");
      // 서버 유니크 충돌은 에러로 반환됨
      const { error } = await supabase
        .from("app_users")
        .update({ nickname: nickname.trim() })
        .eq("id", user.id);
      if (error) throw error;
      toast.success("닉네임을 변경했어요");
      await refresh();
    },
    [user, refresh]
  );

  // contexts/UserContext.tsx
  const signOut = React.useCallback(async () => {
    // 1) 로컬 상태를 즉시 비웁니다. (라우트 가드가 바로 비활성화됨)
    setProfile(null);
    setUser(null);
    setSession(null);

    // 2) Supabase 세션/스토리지 정리 (네트워크에 묶이지 않게 처리)
    try {
      if (typeof (supabase.auth.signOut as any) === "function") {
        // scope 옵션이 없는 버전이라도 try/catch 로 안전하게 처리
        await Promise.race([
          // scope: 'local' 이 지원되면 이게 가장 안전/빠름
          // (미지원이면 일반 signOut 이 호출됨)
          (supabase.auth as any).signOut?.({ scope: "local" }) ??
            supabase.auth.signOut(),
          new Promise<void>((resolve) => setTimeout(resolve, 800)), // 타임아웃 가드
        ]);
      }
    } catch {
      // 네트워크 실패/토큰만료 등은 무시 (이미 로컬 상태는 비워졌음)
    }
  }, []);

  const value: Ctx = {
    loading,
    isAuthed: !!session,
    session,
    user,
    profile,

    refresh,
    updateNickname,
    signOut,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

// ===== Hook =====
export function useUser() {
  const ctx = React.useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within <UserProvider>");
  return ctx;
}
