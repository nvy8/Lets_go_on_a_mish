"use client";
import { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { COLOR, RADIUS, SHADOW } from "@/lib/design-tokens";

type Variant = "default" | "postIt" | "postItGreen" | "postItPink" | "muted";
type Decoration = "none" | "tape" | "tack";
type Size = "sm" | "md" | "lg";

type Props = HTMLAttributes<HTMLDivElement> & {
  variant?: Variant;
  decoration?: Decoration;
  size?: Size;
  children: ReactNode;
};

const BG: Record<Variant, string> = {
  default: "#ffffff",
  postIt: COLOR.postIt,
  postItGreen: COLOR.postItGreen,
  postItPink: COLOR.postItPink,
  muted: COLOR.muted,
};

// HDCard — wobbly card container with optional tape strip or thumbtack decoration.
// Use variant="postIt" for sticky-note style content.
export function HDCard({
  variant = "default",
  decoration = "none",
  size = "md",
  className = "",
  style,
  children,
  ...rest
}: Props) {
  const radius =
    size === "sm" ? RADIUS.cardSm : size === "lg" ? RADIUS.cardLg : RADIUS.card;
  const shadow = size === "lg" ? SHADOW.lg : SHADOW.md;

  const computed: CSSProperties = {
    position: "relative",
    backgroundColor: BG[variant],
    borderColor: COLOR.pencil,
    borderWidth: 3,
    borderStyle: "solid",
    borderRadius: radius,
    boxShadow: shadow,
    ...style,
  };

  return (
    <div {...rest} className={className} style={computed}>
      {decoration === "tape" && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -top-3 w-24 h-6 -rotate-3 pointer-events-none"
          style={{
            backgroundColor: "rgba(45, 45, 45, 0.12)",
            borderLeft: "1px dashed rgba(45, 45, 45, 0.25)",
            borderRight: "1px dashed rgba(45, 45, 45, 0.25)",
          }}
        />
      )}
      {decoration === "tack" && (
        <div
          aria-hidden="true"
          className="absolute left-1/2 -translate-x-1/2 -top-3 h-6 w-6 rounded-full pointer-events-none"
          style={{
            backgroundColor: COLOR.red,
            border: `2px solid ${COLOR.pencil}`,
            boxShadow: `1px 1px 0 0 ${COLOR.pencil}`,
          }}
        />
      )}
      {children}
    </div>
  );
}
