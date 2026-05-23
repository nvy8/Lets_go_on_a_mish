import { ReactNode } from "react";

export type KidNoticeTone = "info" | "success" | "warning" | "error" | "guidance";

const TONE_STYLES: Record<
  KidNoticeTone,
  { container: string; icon: string; iconLabel: string; role: "status" | "alert" }
> = {
  info: {
    container: "border-sky-200 bg-sky-50 text-sky-900",
    icon: "💡",
    iconLabel: "info",
    role: "status",
  },
  success: {
    container: "border-green-300 bg-green-50 text-green-900",
    icon: "✓",
    iconLabel: "success",
    role: "status",
  },
  warning: {
    container: "border-amber-300 bg-amber-50 text-amber-900",
    icon: "⚠️",
    iconLabel: "warning",
    role: "alert",
  },
  error: {
    container: "border-red-300 bg-red-50 text-red-900",
    icon: "🤔",
    iconLabel: "needs attention",
    role: "alert",
  },
  guidance: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "🔍",
    iconLabel: "tip",
    role: "status",
  },
};

export function KidNotice({
  tone = "info",
  title,
  children,
  action,
}: {
  tone?: KidNoticeTone;
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const styles = TONE_STYLES[tone];
  return (
    <div
      role={styles.role}
      className={`flex items-start gap-3 rounded-xl border-2 p-4 ${styles.container}`}
    >
      <span aria-label={styles.iconLabel} className="text-2xl leading-none">
        {styles.icon}
      </span>
      <div className="flex-1 text-base leading-6">
        {title && <div className="font-semibold">{title}</div>}
        <div className={title ? "mt-1" : ""}>{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
