// src/lib/rpc.ts
import supabase from "@/lib/supabase";

export type RpcOptions<T> = {
  signal?: AbortSignal; // 필요시 취소
  mapError?: (msg: string) => T; // 에러 커스텀 변환(선택)
};

export async function callRpc<TParams extends Record<string, any>, TResult>(
  name: string,
  params: TParams,
  opts: RpcOptions<any> = {}
): Promise<TResult> {
  // supabase-js는 fetch signal 전달 옵션이 제한적이라, 대부분은 생략 가능
  const { data, error } = await supabase.rpc(name, params);
  if (error) {
    const msg = error.message ?? "RPC 호출 실패";
    if (opts.mapError) throw opts.mapError(msg);
    throw new Error(msg);
  }
  return data as TResult;
}

/** 에러 메시지 사용자 친화적으로 변환하는 유틸 (선택) */
export function normalizeRpcError(e: unknown): string {
  const msg = (e as any)?.message ?? String(e);
  // 여기에 "already registered" → "이미 요청됨" 같은 변환 룰 추가
  return msg;
}
