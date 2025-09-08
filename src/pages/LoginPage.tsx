// src/pages/LoginPage.tsx (동일 파일)
"use client";

import React, { useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Fish, Eye, EyeOff, Loader2 } from "lucide-react";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_MIN = 6;
const LOGIN_TIMEOUT_MS = 10000; // 10초 타임아웃

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race<T>([
    p,
    new Promise<T>((_, rej) =>
      setTimeout(() => rej(new Error("LOGIN_TIMEOUT")), ms)
    ),
  ]);
}

/**
 * 로그인 페이지
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(true);

  // 이미 로그인 상태면 /main
  useEffect(() => {
    mountedRef.current = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mountedRef.current) return;
      if (data.session) {
        // 세션이 있으면 즉시 메인으로
        window.location.replace("/main");
      }
    })();

    // 보너스: auth 상태 변화 감지 → 성공시 바로 이동
    const sub = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mountedRef.current) return;
      if (session) window.location.replace("/main");
    });

    return () => {
      mountedRef.current = false;
      sub.data.subscription.unsubscribe();
    };
  }, []);

  const emailNorm = email.trim().toLowerCase();
  const emailOk = EMAIL_RE.test(emailNorm) && emailNorm.length <= 254;
  const passOk = password.length >= PASS_MIN;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!navigator.onLine) {
      toast.error("오프라인 상태입니다. 네트워크를 확인해 주세요.");
      return;
    }

    try {
      setLoading(true);

      // 타임아웃 가드 포함
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({ email: emailNorm, password }),
        LOGIN_TIMEOUT_MS
      );

      if (error) {
        // 일반적인 인증 오류 메시지
        throw error;
      }

      // 성공: onAuthStateChange가 redirect 하므로 여기서는 보조용
      toast.success("로그인 성공!");
      window.location.replace("/main");
    } catch (err: any) {
      if (err?.message === "LOGIN_TIMEOUT") {
        toast.error(
          "로그인이 지연되고 있어요. 네트워크를 확인하고 다시 시도해 주세요."
        );
      } else {
        toast.error(err?.message ?? "로그인에 실패했어요");
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white border border-slate-200/70 shadow-sm">
      <CardHeader>
        <div className="mb-1 flex items-center gap-2">
          <Fish className="h-5 w-5 text-sky-600" />
          <span className="font-extrabold tracking-tight text-slate-800">
            AquaRing
          </span>
        </div>
        <CardTitle>로그인</CardTitle>
        <CardDescription>이메일/비밀번호를 입력해 로그인해요.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          {/* 이메일 */}
          <div className="grid gap-1.5">
            <Label htmlFor="li-email">이메일</Label>
            <Input
              id="li-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
            />
            {email.length > 0 && !emailOk && (
              <div className="text-xs text-rose-600">
                유효한 이메일 주소를 입력하세요.
              </div>
            )}
          </div>

          {/* 비밀번호 */}
          <div className="grid gap-1.5">
            <Label htmlFor="li-pass">비밀번호</Label>
            <div className="relative">
              <Input
                id="li-pass"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASS_MIN}
                autoComplete="current-password"
                className="pr-10"
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute inset-y-0 right-2 grid place-items-center text-slate-500 hover:text-slate-700"
                      aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 표시"}
                    >
                      {showPw ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left" className="text-xs">
                    {showPw ? "숨기기" : "표시"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {password.length > 0 && !passOk && (
              <div className="text-xs text-rose-600">
                비밀번호는 최소 {PASS_MIN}자 이상이어야 합니다.
              </div>
            )}
          </div>

          {/* 제출 */}
          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:pointer-events-none"
            disabled={loading || !emailOk || !passOk}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            로그인
          </Button>
        </form>

        <Separator className="my-4" />

        <div className="text-sm text-slate-600">
          계정이 없으신가요?{" "}
          <a
            href="/signup"
            className="font-medium text-amber-700 hover:underline"
          >
            회원가입
          </a>
        </div>
      </CardContent>

      <CardFooter className="text-xs text-slate-500">
        문제가 계속된다면 관리자에게 문의해 주세요.
      </CardFooter>
    </Card>
  );
}
