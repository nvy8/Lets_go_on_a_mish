import jsPDF from 'jspdf';

type ExportData = {
  display_name: string;
  mission: { title: string; topic: string };
  refined_query: string | null;
  badges: string[];
  sources: Array<{ url: string; title: string; domain: string }>;
  facts: Array<{ fact: string; explanation?: string; grade?: string }>;
  hallucination_score?: { correct: number; total: number };
  source_score?: { agree: number; total: number };
};

// ─── Palette ──────────────────────────────────────────────────────────
const COLOR = {
  ink: [45, 45, 45] as [number, number, number],
  muted: [120, 120, 120] as [number, number, number],
  faint: [180, 180, 180] as [number, number, number],
  accent: [200, 130, 0] as [number, number, number], // warm gold — matches in-app
  red: [196, 60, 60] as [number, number, number],
  link: [54, 90, 161] as [number, number, number],
};

// ─── Unicode font loader ──────────────────────────────────────────────
// jsPDF's bundled Helvetica only ships WinAnsi — it can't render Romanian
// ț/ș/ă or any non-Latin1 script. We vendor Inter (Latin + Latin-Ext
// subset, ~143KB per weight) under /public/fonts/ and register it as the
// document font on first use. Promises are cached so a kid clicking
// "Download" twice doesn't refetch.
const FONT_NAME = 'Inter';
let fontCache: Promise<{ regular: string; bold: string }> | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;
  fontCache = (async () => {
    const [reg, bold] = await Promise.all([
      fetch('/fonts/Inter-Regular.ttf').then(toBase64),
      fetch('/fonts/Inter-Bold.ttf').then(toBase64),
    ]);
    return { regular: reg, bold };
  })();
  return fontCache;
}

async function toBase64(res: Response): Promise<string> {
  if (!res.ok) throw new Error(`Font fetch failed: ${res.status}`);
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let bin = '';
  // String.fromCharCode.apply chokes on large arrays; chunk it.
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(bin);
}

function registerFonts(doc: jsPDF, regular: string, bold: string) {
  doc.addFileToVFS('Inter-Regular.ttf', regular);
  doc.addFileToVFS('Inter-Bold.ttf', bold);
  doc.addFont('Inter-Regular.ttf', FONT_NAME, 'normal');
  doc.addFont('Inter-Bold.ttf', FONT_NAME, 'bold');
}

// ─── PDF generation ───────────────────────────────────────────────────
export async function generatePDF(data: ExportData): Promise<void> {
  const fonts = await loadFonts();

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  registerFonts(doc, fonts.regular, fonts.bold);

  const margin = 56;
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const maxW = pageW - margin * 2;
  const bottomLimit = pageH - margin - 30; // leave room for footer

  let y = margin;
  let pageNum = 1;

  // ─── Primitives ──────────────────────────────────────────────────────
  function ensureRoom(needed: number) {
    if (y + needed > bottomLimit) {
      drawFooter();
      doc.addPage();
      pageNum += 1;
      y = margin;
    }
  }

  function setStyle(opts: { size?: number; bold?: boolean; color?: [number, number, number] }) {
    doc.setFont(FONT_NAME, opts.bold ? 'bold' : 'normal');
    doc.setFontSize(opts.size ?? 11);
    doc.setTextColor(...(opts.color ?? COLOR.ink));
  }

  // Draws text with the baseline placed *below* the current y; advances y
  // by the line height for each rendered line. Doing this *before* the
  // draw (not after) is what prevents the next call's larger glyphs from
  // crashing into the previous call's tail.
  function line(
    text: string,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; leading?: number } = {},
  ) {
    const size = opts.size ?? 11;
    const lh = (opts.leading ?? 1.3) * size;
    setStyle(opts);
    const split = doc.splitTextToSize(text, maxW);
    for (const ln of split) {
      ensureRoom(lh);
      y += lh;
      doc.text(ln, margin, y);
    }
  }

  function indentLine(
    text: string,
    indent: number,
    opts: { size?: number; bold?: boolean; color?: [number, number, number]; leading?: number } = {},
  ) {
    const size = opts.size ?? 11;
    const lh = (opts.leading ?? 1.3) * size;
    setStyle(opts);
    const split = doc.splitTextToSize(text, maxW - indent);
    for (const ln of split) {
      ensureRoom(lh);
      y += lh;
      doc.text(ln, margin + indent, y);
    }
  }

  function gap(n = 8) {
    y += n;
  }

  function hr() {
    doc.setDrawColor(...COLOR.faint);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageW - margin, y);
    gap(14);
  }

  function sectionLabel(label: string) {
    line(label, { size: 9, bold: true, color: COLOR.accent });
    gap(2);
  }

  function drawFooter() {
    doc.setDrawColor(...COLOR.faint);
    doc.setLineWidth(0.4);
    doc.line(margin, pageH - margin - 18, pageW - margin, pageH - margin - 18);
    setStyle({ size: 8, color: COLOR.faint });
    doc.text('Generated by Sleuth — research with friction', margin, pageH - margin - 4);
    const right = `Page ${pageNum}`;
    const w = doc.getTextWidth(right);
    doc.text(right, pageW - margin - w, pageH - margin - 4);
  }

  // ─── Header band ─────────────────────────────────────────────────────
  doc.setFillColor(...COLOR.accent);
  doc.rect(0, 0, pageW, 6, 'F');

  y = margin - 6; // line() will advance by leading before drawing
  line('SLEUTH RESEARCH BRIEF', { size: 9, bold: true, color: COLOR.accent });
  gap(4);
  line(data.mission.title, { size: 24, bold: true, leading: 1.15 });
  line(`by ${data.display_name}`, { size: 11, color: COLOR.muted });
  gap(10);
  hr();

  // ─── Research question ───────────────────────────────────────────────
  sectionLabel('RESEARCH QUESTION');
  line(data.refined_query || data.mission.topic, { size: 13, leading: 1.4 });
  gap(14);

  // ─── Badges + Scores (two-column when both present) ──────────────────
  const hasBadges = data.badges.length > 0;
  const hasScores = !!(data.source_score || data.hallucination_score);

  if (hasBadges || hasScores) {
    if (hasBadges && hasScores) {
      const colY = y;
      const colW = (maxW - 20) / 2;

      // Badges column
      setStyle({ size: 9, bold: true, color: COLOR.accent });
      y = colY;
      y += 9 * 1.3;
      doc.text('BADGES EARNED', margin, y);
      y += 4;
      setStyle({ size: 11, color: COLOR.ink });
      for (const b of data.badges) {
        y += 11 * 1.3;
        doc.text(`• ${b}`, margin, y);
      }
      const leftEnd = y;

      // Scores column
      const rightX = margin + colW + 20;
      setStyle({ size: 9, bold: true, color: COLOR.accent });
      y = colY;
      y += 9 * 1.3;
      doc.text('SCORES', rightX, y);
      y += 4;
      setStyle({ size: 11, color: COLOR.ink });
      if (data.source_score) {
        y += 11 * 1.3;
        doc.text(
          `Source judgment: ${data.source_score.agree}/${data.source_score.total}`,
          rightX,
          y,
        );
      }
      if (data.hallucination_score) {
        y += 11 * 1.3;
        doc.text(
          `Hallucination spotting: ${data.hallucination_score.correct}/${data.hallucination_score.total}`,
          rightX,
          y,
        );
      }
      const rightEnd = y;
      y = Math.max(leftEnd, rightEnd);
      gap(14);
    } else if (hasBadges) {
      sectionLabel('BADGES EARNED');
      for (const b of data.badges) line(`• ${b}`, { size: 11 });
      gap(12);
    } else {
      sectionLabel('SCORES');
      if (data.source_score)
        line(`Source judgment: ${data.source_score.agree}/${data.source_score.total} agreed with coach`);
      if (data.hallucination_score)
        line(
          `Hallucination spotting: ${data.hallucination_score.correct}/${data.hallucination_score.total} correct`,
        );
      gap(12);
    }
  }

  hr();

  // ─── Triangulated facts ──────────────────────────────────────────────
  sectionLabel('TRIANGULATED FACTS');
  gap(2);
  data.facts.forEach((f, i) => {
    // Keep fact heading + first body line together across page breaks.
    ensureRoom(12 * 1.3 + 11 * 1.4 + 14);
    line(`${i + 1}. ${f.fact}`, { size: 12, bold: true, leading: 1.35 });
    if (f.explanation) {
      indentLine(`In my own words: ${f.explanation}`, 14, { size: 11, leading: 1.4 });
    }
    if (f.grade) {
      indentLine(`(coach grade: ${f.grade})`, 14, { size: 9, color: COLOR.muted });
    }
    gap(10);
  });

  gap(6);
  hr();

  // ─── Sources ─────────────────────────────────────────────────────────
  sectionLabel('SOURCES CITED');
  gap(2);
  data.sources.forEach((s, i) => {
    line(`[${i + 1}] ${s.title}`, { size: 11, bold: true });
    indentLine(s.url, 16, { size: 9, color: COLOR.link });
    gap(6);
  });

  drawFooter();

  const safeName = data.display_name.replace(/[^a-z0-9]/gi, '_') || 'kid';
  doc.save(`Sleuth-Research-Brief-${safeName}.pdf`);
}
