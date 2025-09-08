// src/features/friends/FriendTestCard.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Check, X, Ban, Users } from "lucide-react";

import { FriendService, type FriendEdge } from "./friends";

/* ----------------------- 유틸 ----------------------- */
function fmt(t?: string | null) {
  if (!t) return "-";
  const d = new Date(t);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

/* ----------------------- 메인 ----------------------- */
export default function FriendTestCard() {
  const [meId, setMeId] = useState<string | null>(null);
  const [edges, setEdges] = useState<FriendEdge[]>([]);
  const [nickMap, setNickMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const [reqNick, setReqNick] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null); // edge-action or "request"

  // 초기 로드
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
        toast.error(e?.message ?? "데이터 로드 실패");
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

  const pendingOut = useMemo(
    () =>
      edges
        .filter(
          (e) => e.status === "pending" && meId && e.requested_by === meId
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

  /* 액션: 닉네임으로 요청 */
  async function onRequest() {
    const nick = reqNick.normalize("NFKC").trim();
    if (!nick) return;
    try {
      setBusyKey("request");
      await FriendService.requestByNickname(nick);
      toast.success(`요청 전송: ${nick}`);
      setReqNick("");
      if (meId) await reload(meId);
    } catch (e: any) {
      toast.error(e?.message ?? "요청 실패");
    } finally {
      setBusyKey(null);
    }
  }

  /* 액션: 수락/거절 */
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

  /* 액션: 보낸 요청 취소 */
  async function cancelPending(otherId: string) {
    const key = `cancel-${otherId}`;
    try {
      setBusyKey(key);
      const nickname = nickMap[otherId];
      await FriendService.cancel({
        nickname,
        otherId: nickname ? undefined : otherId,
      });
      toast.success("요청 취소됨");
      if (meId) await reload(meId);
    } catch (e: any) {
      toast.error(e?.message ?? "취소 실패");
    } finally {
      setBusyKey(null);
    }
  }

  /* 액션: 친구 끊기 */
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

  return (
    <Card className="w-full max-w-3xl bg-white border border-slate-200/70 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-sky-600" />
          <CardTitle>Friends — 임시 테스트 패널</CardTitle>
        </div>
        <CardDescription>
          닉네임으로 친구 요청을 보내고, 내 친구/대기 목록과 friend_edges 상태를
          확인·관리합니다.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 요청 보내기 */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            친구 요청 보내기
          </h3>
          <div className="flex items-center gap-2">
            <Input
              placeholder="상대 닉네임 (대소문자 무관)"
              value={reqNick}
              onChange={(e) => setReqNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && onRequest()}
            />
            <Button
              onClick={onRequest}
              disabled={!reqNick.trim() || busyKey === "request"}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {busyKey === "request" ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="mr-2 h-4 w-4" />
              )}
              요청
            </Button>
          </div>
        </section>

        <Separator />

        {/* 내 친구 목록 (accepted) */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            내 친구 ({accepted.length})
          </h3>
          {loading ? (
            <div className="text-sm text-slate-500">로딩 중...</div>
          ) : accepted.length === 0 ? (
            <div className="text-sm text-slate-500">친구가 없습니다.</div>
          ) : (
            <ul className="space-y-2">
              {accepted.map(({ edge, otherId }) => (
                <li
                  key={edge.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      accepted
                    </Badge>
                    <span className="font-medium text-slate-800">
                      {labelOf(otherId)}
                    </span>
                    <span className="text-xs text-slate-500">
                      since {fmt(edge.responded_at)}
                    </span>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => unfriend(otherId)}
                    disabled={busyKey === `unfriend-${otherId}`}
                  >
                    {busyKey === `unfriend-${otherId}` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Ban className="mr-2 h-4 w-4" />
                    )}
                    친구 끊기
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* 대기 중: 받은 요청 */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            받은 요청 (대기) — {pendingIn.length}
          </h3>
          {pendingIn.length === 0 ? (
            <div className="text-sm text-slate-500">없음</div>
          ) : (
            <ul className="space-y-2">
              {pendingIn.map(({ edge, otherId }) => (
                <li
                  key={edge.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-600 hover:bg-amber-600">
                      pending-in
                    </Badge>
                    <span className="font-medium text-slate-800">
                      {labelOf(otherId)}
                    </span>
                    <span className="text-xs text-slate-500">
                      요청 시각 {fmt(edge.requested_at)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      onClick={() => respond(otherId, "accept")}
                      disabled={busyKey === `respond-${otherId}-accept`}
                    >
                      {busyKey === `respond-${otherId}-accept` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      수락
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => respond(otherId, "decline")}
                      disabled={busyKey === `respond-${otherId}-decline`}
                    >
                      {busyKey === `respond-${otherId}-decline` ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <X className="mr-2 h-4 w-4" />
                      )}
                      거절
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 대기 중: 내가 보낸 요청 */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            보낸 요청 (대기) — {pendingOut.length}
          </h3>
          {pendingOut.length === 0 ? (
            <div className="text-sm text-slate-500">없음</div>
          ) : (
            <ul className="space-y-2">
              {pendingOut.map(({ edge, otherId }) => (
                <li
                  key={edge.id}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-600 hover:bg-amber-600">
                      pending-out
                    </Badge>
                    <span className="font-medium text-slate-800">
                      {labelOf(otherId)}
                    </span>
                    <span className="text-xs text-slate-500">
                      요청 시각 {fmt(edge.requested_at)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => cancelPending(otherId)}
                    disabled={busyKey === `cancel-${otherId}`}
                  >
                    {busyKey === `cancel-${otherId}` ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    취소
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Separator />

        {/* 디버그: friend_edges 전체 상태 */}
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-slate-700">
            friend_edges 상태 (디버그)
          </h3>
          {edges.length === 0 ? (
            <div className="text-sm text-slate-500">레코드 없음</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="px-2 py-1">상대</th>
                    <th className="px-2 py-1">status</th>
                    <th className="px-2 py-1">requested_by</th>
                    <th className="px-2 py-1">requested_at</th>
                    <th className="px-2 py-1">responded_by</th>
                    <th className="px-2 py-1">responded_at</th>
                  </tr>
                </thead>
                <tbody>
                  {edges.map((e) => {
                    const otherId = meId
                      ? e.user_a === meId
                        ? e.user_b
                        : e.user_a
                      : "";
                    const statusColor =
                      e.status === "accepted"
                        ? "bg-emerald-600"
                        : e.status === "pending"
                        ? "bg-amber-600"
                        : "bg-slate-500";
                    return (
                      <tr key={e.id} className="border-t">
                        <td className="px-2 py-1 font-medium text-slate-800">
                          {otherId ? labelOf(otherId) : "-"}
                        </td>
                        <td className="px-2 py-1">
                          <span
                            className={`inline-block rounded px-2 py-0.5 text-white ${statusColor}`}
                          >
                            {e.status}
                          </span>
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {e.requested_by?.slice(0, 8)}
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {fmt(e.requested_at)}
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {e.responded_by ? e.responded_by.slice(0, 8) : "-"}
                        </td>
                        <td className="px-2 py-1 text-slate-700">
                          {fmt(e.responded_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </CardContent>

      <CardFooter className="text-xs text-slate-500">
        * 닉네임 해석은 <code>app_users</code>에서 가져옵니다(권한 없으면 ID로
        표시).
      </CardFooter>
    </Card>
  );
}
