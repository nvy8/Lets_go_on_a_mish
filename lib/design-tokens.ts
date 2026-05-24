import type { CSSProperties } from "react";

// Hand-drawn / sketchbook design tokens.
// One source of truth so we don't drift across components.

export const COLOR = {
  paper: "#fdfbf7",      // warm paper bg
  pencil: "#2d2d2d",     // soft pencil black (never pure black)
  muted: "#e5e0d8",      // old paper / erased pencil
  red: "#ff4d4d",        // correction marker — primary accent
  blue: "#2d5da1",       // ballpoint pen — secondary accent / focus
  postIt: "#fff9c4",     // post-it yellow
  postItGreen: "#d8f5c4", // post-it light green (success / verified)
  postItPink: "#ffd4d4", // post-it pink (highlights / wrong picks)
  ink: "#1a1a1a",        // dark ink for text on light bg
  // — Kid-flow warm palette —
  gold: "#f7b100",       // primary celebratory accent — buttons, stars, focus
  goldSoft: "#fff1c2",   // gold tinted background wash
  lavender: "#d3d7ec",   // soft lavender-gray — secondary surfaces / disabled
  lavenderSoft: "#eef0fa",
  teal: "#7fb3a3",       // warm soft teal accent
  peach: "#fce3c4",      // mascot skin / warm wash
  rust: "#a8551f",       // detective hat / hero accent
} as const;

// Alpha helpers — pencil at various opacities for muted text / borders.
export const pencilAlpha = (alphaHex: string) => `${COLOR.pencil}${alphaHex}`;

// Reusable irregular border-radius values. Each is an irregular ellipse so
// no container has a perfect geometric shape.
export const RADIUS = {
  card: "30px 60px 25px 70px / 60px 25px 70px 30px",        // large container
  cardSm: "20px 35px 18px 38px / 35px 18px 38px 20px",      // medium container
  cardLg: "40px 80px 35px 90px / 80px 35px 90px 40px",      // hero / marketing card
  oval: "62% 38% 50% 50% / 45% 55% 45% 55%",                // rough circle / brand mark
  input: "15px 25px 18px 22px / 20px 16px 24px 18px",       // form field
  button: "30px 50px 30px 50px / 50px 30px 50px 30px",      // primary action
  buttonSm: "20px 30px 20px 30px / 30px 20px 30px 20px",    // secondary action
  notice: "20px 30px 18px 28px / 25px 18px 28px 20px",      // alert / notice box
  tag: "12px 8px 10px 6px / 8px 12px 6px 10px",             // tag / chip
  chip: "16px 6px 12px 8px / 6px 16px 8px 12px",            // badge chip
  sticky: "8px 4px 6px 5px / 4px 8px 5px 6px",              // sticky-note edges
} as const;

// Hard offset shadows — solid color, no blur. Three intensities.
export const SHADOW = {
  flat: "none",
  sm: `2px 2px 0px 0px ${COLOR.pencil}`,
  md: `4px 4px 0px 0px ${COLOR.pencil}`,
  lg: `6px 6px 0px 0px ${COLOR.pencil}`,
  xl: `8px 8px 0px 0px ${COLOR.pencil}`,
  redSm: `2px 2px 0px 0px ${COLOR.red}`,
  redMd: `4px 4px 0px 0px ${COLOR.red}`,
  // Subtle "card sits on paper" — much lighter than the brand shadow.
  paper: "3px 3px 0px 0px rgba(45, 45, 45, 0.1)",
} as const;

// Warm-paper background with dot-pattern grain. Apply to any <main> that
// wants the sketchbook feel.
export const PAPER_BG: CSSProperties = {
  backgroundColor: COLOR.paper,
  backgroundImage: `radial-gradient(${COLOR.muted} 1px, transparent 1px)`,
  backgroundSize: "24px 24px",
};

// Plain warm-paper without the dot grain (for tighter dashboards etc).
export const PAPER_PLAIN: CSSProperties = {
  backgroundColor: COLOR.paper,
};

// Standard Kalam heading style — inline style, since the font is loaded
// via next/font/google and referenced through CSS variable.
export const KALAM: CSSProperties = {
  fontFamily: "var(--font-kalam)",
  fontWeight: 700,
};

export const KALAM_REGULAR: CSSProperties = {
  fontFamily: "var(--font-kalam)",
  fontWeight: 400,
};
