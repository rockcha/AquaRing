"use client";

import React, { useEffect, useRef, useState } from "react";
import supabase from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

import {
  Fish,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

/* =============================================================================
   Nickname validation & check
============================================================================= */
const NICK_MIN = 2;
const NICK_MAX = 16;
const NICK_RE = new RegExp(`^[A-Za-z0-9가-힣_]{${NICK_MIN},${NICK_MAX}}$`);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASS_MIN = 6;

function validateNicknameLocal(nick: string): string | null {
  if (!nick) return "닉네임을 입력해 주세요";
  if (!NICK_RE.test(nick))
    return `${NICK_MIN}~${NICK_MAX}자, 영문/숫자/한글/_(언더스코어)만 허용`;
  return null;
}

type NickStatus =
  | "idle"
  | "checking"
  | "available"
  | "taken"
  | "invalid"
  | "error";

function useNicknameCheck(nickname: string) {
  const [status, setStatus] = useState<NickStatus>("idle");
  const [message, setMessage] = useState<string>("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const nick = nickname.trim();
    if (!nick) {
      setStatus("idle");
      setMessage("");
      return;
    }

    const localErr = validateNicknameLocal(nick);
    if (localErr) {
      setStatus("invalid");
      setMessage(localErr);
      return;
    }

    setStatus("checking");
    setMessage("중복 확인 중...");

    timer.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase.rpc("nickname_available", {
          p_nickname: nick,
        });
        if (error) throw error;
        if (data) {
          setStatus("available");
          setMessage("사용 가능한 닉네임입니다");
        } else {
          setStatus("taken");
          setMessage("이미 사용 중인 닉네임입니다");
        }
      } catch (e: any) {
        setStatus("error");
        setMessage(e?.message ?? "확인 중 오류");
      }
    }, 350);

    return () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
  }, [nickname]);

  return { status, message, ok: status === "available" };
}

/* =============================================================================
   Page: Signup (이메일 인증 OFF 가정)
============================================================================= */
export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(false);

  const { status, message, ok } = useNicknameCheck(nickname);

  // 이메일/비번 유효성
  const emailNorm = email.trim().toLowerCase();
  const emailOk = EMAIL_RE.test(emailNorm) && emailNorm.length <= 254;
  const passOk = password.length >= PASS_MIN;
  const canSubmit = !loading && ok && emailOk && passOk;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const nick = nickname.trim();
    const localErr = validateNicknameLocal(nick);
    if (localErr) return toast.warning(localErr);

    try {
      setLoading(true);

      // 1) signUp
      const { error: err1 } = await supabase.auth.signUp({
        email: emailNorm,
        password,
        options: { data: { nickname: nick } },
      });
      if (err1) throw err1;

      // 2) 세션 확보 (없으면 로그인)
      let { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        const { data: s2, error: err2 } =
          await supabase.auth.signInWithPassword({
            email: emailNorm,
            password,
          });
        if (err2) throw err2;
        s = { session: s2.session };
      }
      const userId = s.session?.user?.id;
      if (!userId) throw new Error("AUTH_SESSION_MISSING");

      // 3) app_users 보정: 실패해도 이동은 하도록 try/catch 분리
      try {
        const { error: upErr } = await supabase
          .from("app_users")
          .upsert(
            { id: userId, nickname: nick },
            { onConflict: "id" /*, returning: "minimal"*/ }
          );
        if (upErr) throw upErr;
      } catch (e: any) {
        console.error("app_users upsert error:", e);
        toast.error(
          `프로필 초기화 실패(나중에 다시 시도 가능): ${e?.message ?? e}`
        );
      }

      toast.success("회원가입 완료! 환영합니다 🐟");
      // 4) 리다이렉트는 항상 수행 (UPSERT 실패해도)
      window.location.assign("/login");
    } catch (err: any) {
      console.error("signup flow error:", err);
      const m = String(err?.message ?? err).toLowerCase();
      if (m.includes("already registered")) {
        toast.error("이미 가입된 이메일입니다. 로그인해 주세요.");
      } else if (m.includes("password")) {
        toast.error("비밀번호는 최소 6자 이상이어야 합니다.");
      } else if (m.includes("invalid email")) {
        toast.error("이메일 형식이 올바르지 않습니다.");
      } else if (
        m.includes("permission") ||
        m.includes("rls") ||
        m.includes("policy")
      ) {
        toast.error("권한 오류: DB 권한/정책을 점검해 주세요.");
      } else {
        toast.error(`회원가입 실패: ${err?.message ?? err}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const nickTone =
    status === "available"
      ? "text-sky-600"
      : status === "taken"
      ? "text-rose-600"
      : status === "invalid"
      ? "text-amber-600"
      : "text-slate-500";

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
          <CardTitle>회원가입</CardTitle>
          <CardDescription>
            이메일/비밀번호와 닉네임을 입력해 시작해요 (이메일 인증 없이).
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            {/* 이메일 */}
            <div className="grid gap-1.5">
              <Label htmlFor="su-email">이메일</Label>
              <Input
                id="su-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              <Label htmlFor="su-pass">비밀번호</Label>
              <div className="relative">
                <Input
                  id="su-pass"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={PASS_MIN}
                  autoComplete="new-password"
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
                        tabIndex={0}
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

            <Separator />

            {/* 닉네임 */}
            <div className="grid gap-1.5">
              <Label htmlFor="su-nick">닉네임</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="su-nick"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder={`${NICK_MIN}~${NICK_MAX}자, 영문/숫자/한글/_`}
                  autoComplete="off"
                  maxLength={NICK_MAX} // ✅ 길이 제한
                  aria-describedby="nick-help nick-count"
                  inputMode="text"
                />
                {status === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                )}
                {status === "available" && (
                  <CheckCircle className="h-4 w-4 text-sky-600" />
                )}
                {status === "taken" && (
                  <XCircle className="h-4 w-4 text-rose-600" />
                )}
                {status === "invalid" && (
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                )}
              </div>

              {!!message && (
                <div id="nick-help" className={cn("text-xs", nickTone)}>
                  {message}
                </div>
              )}

              {/* ✅ 실시간 글자 수 */}
              <div
                id="nick-count"
                className="ml-auto text-[11px] tabular-nums text-muted-foreground"
              >
                {nickname.length}/{NICK_MAX}
              </div>
            </div>

            {/* 파란 배경 + 흰 글자 버튼, 조건 만족 시만 활성화 */}
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:pointer-events-none"
              disabled={!canSubmit}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              회원가입 하기
            </Button>
          </form>
        </CardContent>

        <CardFooter className="text-xs text-slate-500">
          이메일 인증은 사용하지 않습니다. 필요 시 설정에서 나중에 켤 수 있어요.
        </CardFooter>
      </Card>
    </>
  );
}
