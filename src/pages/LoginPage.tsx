"use client";

import React, { useEffect, useState } from "react";
import supabase from "@/lib/supabase";
import { toast } from "sonner";

// shadcn/ui
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

/**
 * 로그인 페이지 (Next.js 미의존)
 * - supabase.auth.signInWithPassword 사용
 * - 성공 시 /main 으로 이동
 * - 하단에 회원가입 링크(/signup)
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // 이미 로그인 상태면 바로 /main 으로
  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        window.location.replace("/main");
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const emailNorm = email.trim().toLowerCase();
  const emailOk = EMAIL_RE.test(emailNorm) && emailNorm.length <= 254;
  const passOk = password.length >= PASS_MIN;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: emailNorm,
        password,
      });
      if (error) throw error;
      toast.success("로그인 성공!");
      window.location.assign("/main");
    } catch (e: any) {
      toast.error(e?.message ?? "로그인에 실패했어요");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="w-full max-w-md bg-white border border-slate-200/70 shadow-sm">
        <CardHeader>
          <div className="mb-1 flex items-center gap-2">
            <Fish className="h-5 w-5 text-sky-600" />
            <span className="font-extrabold tracking-tight text-slate-800">
              AquaRing
            </span>
          </div>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            이메일/비밀번호를 입력해 로그인해요.
          </CardDescription>
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
                        aria-label={
                          showPw ? "비밀번호 숨기기" : "비밀번호 표시"
                        }
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

            {/* 파란 버튼 스타일 통일 */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:pointer-events-none"
              disabled={loading || !emailOk || !passOk}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
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
    </>
  );
}
