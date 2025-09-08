// src/features/friend/FriendsDock.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Handshake, Loader2, Check, X, Ban, ExternalLink } from "lucide-react";
import { FriendService, type FriendEdge } from "@/features/friend/friends";

export default function FriendsDock() {
  // Popover & Dialog
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  // 데이터 상태
  const [meId, setMeId] = useState<string | null>(null);
  const [edges, setEdges] = useState<FriendEdge[]>([]);
  const [nickMap, setNickMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  // 요청용 닉네임
  const [reqNick, setReqNick] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const uid = await FriendService.getCurrentUserId();
        if (!uid) {
          toast.error("로그인이 필요합니다.");
          setLoading(false);
          return;
        }
        setMeId(uid);
        await reload(uid);
      } catch (e: any) {
        toast.error(e?.message ?? "친구 정보를 불러오지 못했어요");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function reload(uid: string) {
    const list = await FriendService.listEdgesForUser(uid);
    setEdges(list);

    const otherIds = Array.from(
      new Set(list.map((e) => (e.user_a === uid ? e.user_b : e.user_a)))
    );
    setNickMap(await FriendService.getNickMap(otherIds));
  }

  // 파생 목록
  const accepted = useMemo(
    () =>
      edges
        .filter((e) => e.status === "accepted")
        .map((e) => ({
          edge: e,
          otherId: meId && e.user_a === meId ? e.user_b : e.user_a,
        })),
    [edges, meId]
  );

  const pendingIn = useMemo(
    () =>
      edges
        .filter(
          (e) => e.status === "pending" && meId && e.requested_by !== meId
        )
        .map((e) => ({
          edge: e,
          otherId: meId && e.user_a === meId ? e.user_b : e.user_a,
        })),
    [edges, meId]
  );

  function labelOf(id: string) {
    return nickMap[id] ?? id.slice(0, 8);
  }

  // ===== FriendTestCard의 요청 로직 그대로 =====
  async function onRequest() {
    const nick = reqNick.normalize("NFKC").trim();
    if (!nick) return;
    try {
      setBusyKey("request");
      await FriendService.requestByNickname(nick);
      toast.success(`요청 전송: ${nick}`);
      setReqNick("");
      setAddOpen(false);
      if (meId) await reload(meId);
    } catch (e: any) {
      toast.error(e?.message ?? "요청 실패");
    } finally {
      setBusyKey(null);
    }
  }

  async function respond(otherId: string, action: "accept" | "decline") {
    const key = `respond-${otherId}-${action}`;
    try {
      setBusyKey(key);
      const nickname = nickMap[otherId];
      await FriendService.respond({
        action,
        nickname,
        otherId: nickname ? undefined : otherId,
      });
      toast.success(action === "accept" ? "수락 완료" : "거절 완료");
      if (meId) await reload(meId);
    } catch (e: any) {
      toast.error(e?.message ?? "처리 실패");
    } finally {
      setBusyKey(null);
    }
  }

  async function unfriend(otherId: string) {
    const key = `unfriend-${otherId}`;
    try {
      setBusyKey(key);
      const nickname = nickMap[otherId];
      await FriendService.unfriend({
        nickname,
        otherId: nickname ? undefined : otherId,
      });
      toast.success("친구 끊기 완료");
      if (meId) await reload(meId);
    } catch (e: any) {
      toast.error(e?.message ?? "친구 끊기 실패");
    } finally {
      setBusyKey(null);
    }
  }

  const showAlertRing = pendingIn.length > 0 && !open;
  const friendCount = accepted.length;

  return (
    <div className="fixed left-3 bottom-3 z-40">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-800 text-neutral-50 shadow-lg ring-1 ring-black/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500"
            aria-label={`친구 패널 열기 (친구 ${friendCount}명)`}
          >
            {showAlertRing && (
              <>
                <span className="pointer-events-none absolute -inset-2 rounded-full bg-sky-500/20 animate-ping" />
                <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-sky-400/70" />
              </>
            )}
            <Handshake className="h-5 w-5" aria-hidden />
            <span className="absolute -bottom-1 -right-1 min-w-5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-neutral-900 ring-1 ring-black/10">
              {friendCount}
            </span>
          </button>
        </PopoverTrigger>

        <PopoverContent
          side="top"
          align="start"
          sideOffset={12}
          className={[
            "w-[360px] sm:w-[420px] max-w-[calc(100vw-24px)] p-0 overflow-hidden",
            "transition-all duration-200 ease-out will-change-transform",
            "data-[state=closed]:opacity-0 data-[state=closed]:translate-y-2",
            "data-[state=open]:opacity-100 data-[state=open]:translate-y-0",
            "bg-white/95 dark:bg-neutral-900/95 border border-neutral-200 dark:border-neutral-700 backdrop-blur shadow-xl",
          ].join(" ")}
        >
          {/* 헤더: 타이틀 + 친구추가 모달 */}
          <div className="px-4 py-3 border-b border-neutral-200/80 dark:border-neutral-700/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="h-4 w-4 text-neutral-500" />
              <h2 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
                친구
              </h2>
              <Badge className="ml-1 bg-sky-100 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/50 dark:text-sky-200">
                {friendCount}
              </Badge>
            </div>

            {/* 친구 추가 모달 */}
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-sky-600 hover:bg-sky-700 text-white"
                >
                  + 친구 추가
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                  <DialogTitle>친구 추가</DialogTitle>
                  <DialogDescription>
                    닉네임을 입력해 친구 요청을 보냅니다.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-3 pt-2">
                  <Label htmlFor="add-friend-nick">닉네임</Label>
                  <Input
                    id="add-friend-nick"
                    placeholder="예: aqua_dev"
                    value={reqNick}
                    onChange={(e) => setReqNick(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && onRequest()}
                    autoFocus
                  />
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                    disabled={busyKey === "request"}
                  >
                    취소
                  </Button>
                  <Button
                    className="bg-sky-600 hover:bg-sky-700 text-white"
                    onClick={onRequest}
                    disabled={!reqNick.trim() || busyKey === "request"}
                  >
                    {busyKey === "request" ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Handshake className="mr-2 h-4 w-4" />
                    )}
                    요청 보내기
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* 본문 */}
          <div className="p-4 space-y-6">
            {/* 친구 목록 (닉네임만) */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-500 text-center">
                내 친구
              </h3>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70">
                {loading ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    로딩 중...
                  </div>
                ) : accepted.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    친구가 없습니다.
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                    {accepted.map(({ edge, otherId }) => (
                      <li
                        key={edge.id}
                        className="p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                      >
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate text-center w-full">
                          {labelOf(otherId)}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() =>
                              toast.message("방문하기 TODO", {
                                description: "프로필/홈으로 이동 연결 예정",
                              })
                            }
                          >
                            <ExternalLink className="mr-1.5 h-4 w-4" />
                            방문하기
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => unfriend(otherId)}
                            disabled={busyKey === `unfriend-${otherId}`}
                          >
                            {busyKey === `unfriend-${otherId}` ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Ban className="mr-1.5 h-4 w-4" />
                            )}
                            끊기
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>

            {/* 받은 요청 (닉네임만 + 수락/거절) */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold text-neutral-500 text-center">
                받은 요청 (대기)
              </h3>
              <div className="rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white/70 dark:bg-neutral-900/70">
                {loading ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    로딩 중...
                  </div>
                ) : pendingIn.length === 0 ? (
                  <div className="py-8 text-center text-sm text-neutral-500">
                    없음
                  </div>
                ) : (
                  <ul className="max-h-56 overflow-y-auto divide-y divide-neutral-200 dark:divide-neutral-800">
                    {pendingIn.map(({ edge, otherId }) => (
                      <li
                        key={edge.id}
                        className="p-3 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors"
                      >
                        <div className="text-sm font-medium text-neutral-800 dark:text-neutral-100 truncate text-center w-full">
                          {labelOf(otherId)}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => respond(otherId, "accept")}
                            disabled={busyKey === `respond-${otherId}-accept`}
                          >
                            {busyKey === `respond-${otherId}-accept` ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="mr-1.5 h-4 w-4" />
                            )}
                            수락
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                            onClick={() => respond(otherId, "decline")}
                            disabled={busyKey === `respond-${otherId}-decline`}
                          >
                            {busyKey === `respond-${otherId}-decline` ? (
                              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : (
                              <X className="mr-1.5 h-4 w-4" />
                            )}
                            거절
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
