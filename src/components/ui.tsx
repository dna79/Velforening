import type { HTMLAttributes, ReactNode } from "react";

import { getBookingStatusLabel } from "@/lib/booking-status";

export const cardClassName =
  "rounded-[28px] bg-white shadow-[0_10px_28px_rgba(15,35,70,0.08)] ring-1 ring-[#DDE8F5]";

export const inputClassName =
  "rounded-[18px] border border-[#DDE8F5] bg-white px-4 text-base font-medium text-[#07122F] outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100";

export const primaryButtonClassName =
  "rounded-[18px] bg-blue-600 px-5 font-bold text-white shadow-lg shadow-blue-600/25 disabled:opacity-60";

export const secondaryButtonClassName =
  "rounded-[18px] bg-white px-5 font-bold text-blue-700 ring-1 ring-blue-200 disabled:opacity-60";

export const dangerButtonClassName =
  "rounded-[18px] bg-red-50 px-5 font-bold text-red-700 ring-1 ring-red-100 disabled:opacity-60";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`${cardClassName} ${className}`} {...props}>
      {children}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex w-fit rounded-full px-3 py-1.5 text-sm font-bold ring-1 ${getStatusBadgeClass(
        status,
      )}`}
    >
      Status: {getBookingStatusLabel(status)}
    </span>
  );
}

export function MessageBox({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success";
}) {
  const toneClassName = {
    error: "bg-red-50 text-red-700 ring-red-100",
    info: "bg-blue-50 text-blue-900 ring-blue-100",
    success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  }[tone];

  return (
    <p className={`rounded-[18px] p-4 text-sm font-bold ring-1 ${toneClassName}`}>
      {children}
    </p>
  );
}

function getStatusBadgeClass(status: string) {
  if (status === "rejected") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  if (status === "cancelled") {
    return "bg-slate-100 text-slate-600 ring-slate-200";
  }

  if (status === "approved") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  return "bg-blue-50 text-blue-700 ring-blue-100";
}
