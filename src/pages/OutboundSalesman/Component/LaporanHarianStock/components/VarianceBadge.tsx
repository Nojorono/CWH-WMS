import React from "react";
import { formatSigned } from "../logic";

export function VarianceBadge({ value }: { value: number }) {
  const isZero = value === 0;
  const isNeg = value < 0;
  return (
    <span
      className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-bold ${
        isZero
          ? "bg-emerald-100 text-emerald-700"
          : isNeg
            ? "bg-rose-100 text-rose-700"
            : "bg-amber-100 text-amber-700"
      }`}
    >
      {formatSigned(value)}
    </span>
  );
}
