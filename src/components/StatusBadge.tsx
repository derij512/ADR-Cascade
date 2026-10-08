import type { AdrStatus } from "@/lib/adr";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<AdrStatus, string> = {
  Proposed:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  Accepted:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  Deprecated:
    "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-400",
  Superseded:
    "border-slate-500/25 bg-slate-500/10 text-slate-600 dark:text-slate-300",
};

/** Soft tinted pill for the four ADR lifecycle states. */
export function StatusBadge({
  status,
  className,
}: {
  status: AdrStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-tight",
        STATUS_STYLES[status],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
