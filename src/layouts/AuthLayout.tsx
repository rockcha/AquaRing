"use client";

import React from "react";
import { cn } from "@/lib/utils";

type AuthLayoutProps = {
  children: React.ReactNode;
  className?: string; // 레이아웃(바깥) 추가 스타일
  containerClassName?: string; // 가운데 컨테이너 추가 스타일
};

export default function AuthLayout({
  children,
  className,
  containerClassName,
}: AuthLayoutProps) {
  return (
    <div
      className={cn(
        "min-h-screen w-full bg-[length:100%] bg-center bg-no-repeat",
        className
      )}
      style={{ backgroundImage: "url(/auth-background.png)" }}
    >
      {/* 자식 가로·세로 중앙 정렬 */}
      <div
        className={cn(
          "flex min-h-screen items-center justify-center p-6",
          containerClassName
        )}
      >
        {children}
      </div>
    </div>
  );
}
