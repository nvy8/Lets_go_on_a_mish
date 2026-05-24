"use client";
import { ButtonHTMLAttributes, useState } from "react";
import { COLOR, RADIUS, SHADOW } from "@/lib/design-tokens";

type Variant = "primary" | "secondary" | "ghost";
type Size = "sm" | "md" | "lg";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
};

// Primary  : white bg + thick black border + Kalam text, fills red on hover, presses flat
// Secondary: muted bg + thick black border + Kalam text, fills blue on hover
// Ghost    : transparent + dashed border + smaller. Used for tertiary actions.
export function HDButton({
  variant = "primary",
  size = "md",
  className = "",
  style,
  disabled,
  children,
  ...rest
}: Props) {
  const [pressed, setPressed] = useState(false);
  const [hover, setHover] = useState(false);

  const sizeClass =
    size === "sm"
      ? "px-4 py-2 text-base"
      : size === "lg"
      ? "px-7 py-4 text-xl"
      : "px-5 py-3 text-lg";

  const radius = size === "sm" ? RADIUS.buttonSm : RADIUS.button;

  const fillHover =
    variant === "primary" ? COLOR.red : variant === "secondary" ? COLOR.blue : COLOR.muted;

  const baseBg =
    variant === "primary"
      ? "white"
      : variant === "secondary"
      ? COLOR.muted
      : "transparent";

  const baseColor = COLOR.pencil;
  const hoverTextColor = variant === "ghost" ? COLOR.pencil : "white";

  const enabledShadow = pressed ? SHADOW.flat : hover ? SHADOW.sm : SHADOW.md;
  const enabledTranslate = pressed
    ? "translate-x-[3px] translate-y-[3px]"
    : hover
    ? "translate-x-[1px] translate-y-[1px]"
    : "";

  const computedStyle: React.CSSProperties = {
    fontFamily: "var(--font-kalam)",
    fontWeight: 700,
    borderRadius: radius,
    borderWidth: 3,
    borderStyle: variant === "ghost" ? "dashed" : "solid",
    borderColor: disabled ? `${COLOR.pencil}4d` : COLOR.pencil,
    backgroundColor: disabled
      ? COLOR.muted
      : hover
      ? fillHover
      : baseBg,
    color: disabled
      ? `${COLOR.pencil}66`
      : hover
      ? hoverTextColor
      : baseColor,
    boxShadow: disabled ? SHADOW.flat : enabledShadow,
    transition: "background-color 100ms, color 100ms, box-shadow 100ms, transform 100ms",
    ...style,
  };

  return (
    <button
      {...rest}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onBlur={() => {
        setHover(false);
        setPressed(false);
      }}
      style={computedStyle}
      className={`inline-flex items-center justify-center gap-2 ${sizeClass} ${
        disabled ? "cursor-not-allowed" : enabledTranslate
      } ${className}`}
    >
      {children}
    </button>
  );
}
