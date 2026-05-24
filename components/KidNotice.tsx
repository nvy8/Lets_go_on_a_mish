import { ReactNode } from "react";
import {
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Search,
} from "lucide-react";
import { COLOR, RADIUS, SHADOW } from "@/lib/design-tokens";

export type KidNoticeTone = "info" | "success" | "warning" | "error" | "guidance";

type ToneStyle = {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  Icon: typeof Lightbulb;
  iconLabel: string;
  role: "status" | "alert";
};

const TONE_STYLES: Record<KidNoticeTone, ToneStyle> = {
  info: {
    bg: "#eaf1fb", // pale ballpoint wash
    border: COLOR.blue,
    text: COLOR.pencil,
    iconColor: COLOR.blue,
    Icon: Lightbulb,
    iconLabel: "info",
    role: "status",
  },
  success: {
    bg: COLOR.postItGreen,
    border: COLOR.pencil,
    text: COLOR.pencil,
    iconColor: "#2f7a2f",
    Icon: CheckCircle2,
    iconLabel: "success",
    role: "status",
  },
  warning: {
    bg: COLOR.postIt,
    border: COLOR.pencil,
    text: COLOR.pencil,
    iconColor: COLOR.red,
    Icon: AlertTriangle,
    iconLabel: "warning",
    role: "alert",
  },
  error: {
    bg: "#ffffff",
    border: COLOR.red,
    text: COLOR.pencil,
    iconColor: COLOR.red,
    Icon: HelpCircle,
    iconLabel: "needs attention",
    role: "alert",
  },
  guidance: {
    bg: COLOR.postIt,
    border: COLOR.pencil,
    text: COLOR.pencil,
    iconColor: COLOR.pencil,
    Icon: Search,
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
  const s = TONE_STYLES[tone];
  const Icon = s.Icon;
  return (
    <div
      role={s.role}
      className="flex items-start gap-3 border-[3px] p-4"
      style={{
        backgroundColor: s.bg,
        borderColor: s.border,
        color: s.text,
        borderRadius: RADIUS.notice,
        boxShadow: tone === "error" ? SHADOW.redSm : SHADOW.sm,
      }}
    >
      <Icon
        aria-label={s.iconLabel}
        size={24}
        strokeWidth={2.5}
        color={s.iconColor}
        className="shrink-0"
      />
      <div className="flex-1 text-base leading-6">
        {title && (
          <div
            style={{ fontFamily: "var(--font-kalam)", fontWeight: 700, fontSize: "1.15rem" }}
          >
            {title}
          </div>
        )}
        <div className={title ? "mt-1" : ""}>{children}</div>
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  );
}
