// src/features/xp/utils.ts
import { BLOCK_SIZE, MAJOR_SIZE, MAJOR_TIERS, SUB_LABELS } from "./constants";

export type XpDescriptor = {
  xp: number; // 총 XP
  majorIndex: number; // 0~4
  majorLabel: string; // 예: "입문자"
  majorColor: string;
  majorIcon: string;
  subIndex: number; // 0:초급, 1:중급, 2:고급
  subLabel: string; // 예: "중급"
  label: string; // 예: "중급 입문자"
  step: number; // 분자 (1~30)
  denom: number; // 분모 (항상 30)
};

export function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

export function describeXp(xpRaw: number): XpDescriptor {
  const xp = Math.max(0, Math.floor(xpRaw || 0));
  const maxMajor = MAJOR_TIERS.length - 1;

  // 어떤 대등급(입문/견습/...)인가
  const majorIndexUnclamped = Math.floor(xp / MAJOR_SIZE);
  const majorIndex = clamp(majorIndexUnclamped, 0, maxMajor);
  const major = MAJOR_TIERS[majorIndex];

  // 해당 대등급의 시작 xp
  const baseStart = majorIndex * MAJOR_SIZE;
  // (마스터를 넘어가면) 고급에서 고정되게 표시 — 필요 시 % 3로 순환하도록 바꿀 수 있음
  const rel = Math.max(0, xp - baseStart);
  const subIndex =
    majorIndex < maxMajor
      ? Math.floor(rel / BLOCK_SIZE)
      : clamp(Math.floor(rel / BLOCK_SIZE), 0, 2);

  const subLabel = SUB_LABELS[clamp(subIndex, 0, 2)];
  const step0 = rel - subIndex * BLOCK_SIZE; // 0~29
  const step = clamp(step0 + 1, 1, BLOCK_SIZE); // 1~30 로 보이게

  return {
    xp,
    majorIndex,
    majorLabel: major.label,
    majorColor: major.color,
    majorIcon: major.icon,
    subIndex,
    subLabel,
    label: `${subLabel} ${major.label}`,
    step,
    denom: BLOCK_SIZE,
  };
}

// 다음 승급(다음 sub단계)까지 남은 양 (UI 보조용)
export function xpToNextStep(xp: number): number {
  const d = describeXp(xp);
  const usedInBlock = d.step - 1; // 0~29
  return d.denom - usedInBlock; // 30~1
}
