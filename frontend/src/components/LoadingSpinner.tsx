"use client";

import { useEffect, useState } from "react";

interface LoadingSpinnerProps {
  timeoutMs?: number;
  onTimeout?: () => void;
  message?: string;
}

export default function LoadingSpinner({
  timeoutMs = 30000,
  onTimeout,
  message = "AI가 분석 중입니다…",
}: LoadingSpinnerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);

    const timeout = setTimeout(() => {
      setTimedOut(true);
    }, timeoutMs);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [timeoutMs]);

  return (
    <div className="flex flex-col items-center gap-4 py-10">
      {/* Spinner */}
      <div
        className="w-12 h-12 rounded-full border-4 border-[#E8F5EE] border-t-[#00954F] animate-spin"
        role="status"
        aria-label="로딩 중"
      />

      <p className="text-sm text-gray-600 font-medium">{message}</p>
      <p className="text-xs text-gray-400">{elapsed}초 경과</p>

      {timedOut && (
        <div className="mt-2 rounded-xl bg-amber-50 border border-amber-200 p-4 text-center max-w-xs">
          <p className="text-sm text-amber-800 mb-3">
            AI 분석이 지연되고 있습니다. 샘플 데이터로 진행할까요?
          </p>
          <button
            onClick={onTimeout}
            className="px-5 py-2 rounded-full bg-[#00954F] text-white text-sm font-semibold active:bg-[#006B38] transition-colors"
          >
            샘플 데이터로 진행
          </button>
        </div>
      )}
    </div>
  );
}
