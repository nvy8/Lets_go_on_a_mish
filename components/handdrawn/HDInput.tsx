"use client";
import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { COLOR, RADIUS, SHADOW } from "@/lib/design-tokens";

type Common = {
  invalid?: boolean;
};

export function HDInput({
  invalid,
  className = "",
  style,
  ...rest
}: InputHTMLAttributes<HTMLInputElement> & Common) {
  return (
    <input
      {...rest}
      className={`px-4 py-3 text-lg border-[3px] focus:outline-none focus:ring-4 focus:ring-[#f7b100]/40 ${className}`}
      style={{
        borderColor: invalid ? COLOR.red : COLOR.pencil,
        backgroundColor: "white",
        color: COLOR.pencil,
        borderRadius: RADIUS.input,
        boxShadow: invalid ? SHADOW.redSm : SHADOW.sm,
        ...style,
      }}
    />
  );
}

export function HDTextarea({
  invalid,
  className = "",
  style,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & Common) {
  return (
    <textarea
      {...rest}
      className={`px-4 py-3 text-lg leading-7 border-[3px] focus:outline-none focus:ring-2 ${className}`}
      style={{
        borderColor: invalid ? COLOR.red : COLOR.pencil,
        backgroundColor: "white",
        color: COLOR.pencil,
        borderRadius: RADIUS.input,
        boxShadow: invalid ? SHADOW.redSm : SHADOW.sm,
        ...style,
      }}
    />
  );
}
