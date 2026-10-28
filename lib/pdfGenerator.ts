import jsPDF from 'jspdf';
import { PipeProject } from './types';
import { calculateBuffer, calculateRowTotal, calculateSizeTotals, calculateGrandTotal } from './calculator';
import {
  SOLARITHM_LOGO_DATA_URL,
  SOLARITHM_LOGO_WIDTH,
  SOLARITHM_LOGO_HEIGHT,
} from './solarithmLogo';

// Exact ReportLab colors
export const PDF_COLORS = {
  GREEN: '#063D25',
  MID: '#1F6B3F',
  GOLD: '#C9961A',
  LGOLD: '#F3E3B0',
  CREAM: '#FAF6EA',
  INK: '#1B2A22',
  MUTE: '#9AA39D',
  LINE: '#E6DFC8',
  RED: '#9B1C1C',
  RED_BG: '#FDF1F1',
  MUTE_TEXT: '#CFE3D6',
  GREY_DASH: '#C5CBC7',
  WHITE: '#FFFFFF',
};

/**
 * Alpha-blends a foreground hex color over a background hex color at alpha [0..1].
 * Guarantees viewer-independent exact opacity without PDF GState stroke-opacity quirks.
 */
export function blendHex(fgHex: string, bgHex: string, alpha: number): string {
  const fg = fgHex.replace('#', '');
  const bg = bgHex.replace('#', '');
  const fr = parseInt(fg.substring(0, 2), 16);
  const fgG = parseInt(fg.substring(2, 4), 16);
  const fb = parseInt(fg.substring(4, 6), 16);
  const br = parseInt(bg.substring(0, 2), 16);
  const bgG = parseInt(bg.substring(2, 4), 16);
  const bb = parseInt(bg.substring(4, 6), 16);

  const r = Math.round(br * (1 - alpha) + fr * alpha);
  const g = Math.round(bgG * (1 - alpha) + fgG * alpha);
  const b = Math.round(bb * (1 - alpha) + fb * alpha);

  return (
    '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0')
  );
}

/**
 * Clips a 2D line segment (x1, y1) -> (x2, y2) to an axis-aligned rectangle [xmin, ymin, xmax, ymax]
 * using the Liang-Barsky algorithm. Avoids jsPDF clip() state bugs.
 */
function clipLineToRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const p = [-dx, dx, -dy, dy];
  const q = [x1 - xmin, xmax - x1, y1 - ymin, ymax - y1];
  let u1 = 0;
  let u2 = 1;

  for (let i = 0; i < 4; i++) {
    if (p[i] === 0) {
      if (q[i] < 0) return null;
    } else {
      const t = q[i] / p[i];
      if (p[i] < 0) {
        if (t > u2) return null;
        if (t > u1) u1 = t;
      } else {
        if (t < u1) return null;
        if (t < u2) u2 = t;
      }
    }
  }

  return [x1 + u1 * dx, y1 + u1 * dy, x1 + u2 * dx, y1 + u2 * dy];
}

/**
 * Compute 'contain' placement of an image inside a bounding box, centered both horizontally and vertically.
 */
export function fitLogoContain(
  boxX: number,
  boxY: number,
  boxW: number,
  boxH: number,
  imgW: number = SOLARITHM_LOGO_WIDTH,
  imgH: number = SOLARITHM_LOGO_HEIGHT
): { x: number; y: number; width: number; height: number } {
  const aspect = imgW > 0 && imgH > 0 ? imgW / imgH : SOLARITHM_LOGO_WIDTH / SOLARITHM_LOGO_HEIGHT;
  let width = boxW;
  let height = width / aspect;
  if (height > boxH) {
    height = boxH;
    width = height * aspect;
  }
  const x = boxX + (boxW - width) / 2;
  const y = boxY + (boxH - height) / 2;
  return { x, y, width, height };
}

/**
 * Creates the exact vector A4 PDF matching the reference ReportLab python script.
 */
export function generatePipeSummaryPdf(project: PipeProject): jsPDF {
  // A4 dimensions in pt: 595.28 x 841.89
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const W = 595.28;
  const H = 841.89;

  // Set document metadata
  doc.setProperties({
    title: `Pipe Requirement Summary - ${project.projectName}`,
    subject: 'Structure pipe quantity estimate',
    author: project.companyName || 'Solarithm Design & Engineering',
    creator: 'Solarithm Pipe Calculator',
  });

  // Safe color setter helpers
  const setFillHex = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    doc.setFillColor(r, g, b);
  };

  const setStrokeHex = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    doc.setDrawColor(r, g, b);
  };

  const setTextColorHex = (hex: string) => {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    doc.setTextColor(r, g, b);
  };

  // Helper: subtle drop shadow simulator
  const drawShadow = (x: number, y: number, w: number, h: number, r: number = 8) => {
    doc.saveGraphicsState();
    doc.setGState(new (doc as any).GState({ opacity: 0.035 }));
    doc.setFillColor(0, 0, 0);
    for (let i = 0; i < 4; i++) {
      doc.roundedRect(x - i + 1, y - i + 1, w + 2 * i, h + i, r + i, r + i, 'F');
    }
    doc.restoreGraphicsState();
  };

  // ----------------------------------------------------
  // 1. HEADER BANNER (HH = 205)
  // ----------------------------------------------------
  const HH = 205;
  setFillHex(PDF_COLORS.GREEN);
  doc.rect(0, 0, W, HH, 'F');

  // Sun motif (top-right cx = W - 70, cy = 40)
  // Low opacity (7% fill for sun disk, 10% stroke for radial rays) so foreground white & gold text is 100% crisp
  const cx = W - 70;
  const cy = 40;

  // Background sun disks (5% outer halo, 7% inner disk)
  const sunOuterHex = blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.05);
  const sunInnerHex = blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.07);
  const sunRayStrokeHex = blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.10);

  setFillHex(sunOuterHex);
  doc.circle(cx, cy, 86, 'F');

  setFillHex(sunInnerHex);
  doc.circle(cx, cy, 56, 'F');

  // Faint radial sun rays (10% gold opacity, geometrically clipped to header [0, W] x [0, HH - 4])
  setStrokeHex(sunRayStrokeHex);
  doc.setLineWidth(1.1);
  for (let k = 0; k < 360; k += 12) {
    const a = (k * Math.PI) / 180;
    const x1 = cx + 60 * Math.cos(a);
    const y1 = cy + 60 * Math.sin(a);
    const x2 = cx + 330 * Math.cos(a);
    const y2 = cy + 330 * Math.sin(a);
    const clipped = clipLineToRect(x1, y1, x2, y2, 0, 0, W, HH - 4);
    if (clipped) {
      doc.line(clipped[0], clipped[1], clipped[2], clipped[3]);
    }
  }

  // Diagonal gold bands across bottom of header
  setFillHex(PDF_COLORS.GOLD);
  doc.lines(
    [
      [W, -32],
      [0, 12],
      [-W, 32],
    ],
    0,
    HH - 26,
    [1, 1],
    'F',
    true
  );

  setFillHex(blendHex(PDF_COLORS.GOLD, PDF_COLORS.GREEN, 0.45));
  doc.lines(
    [
      [W, -30],
      [0, 4],
      [-W, 30],
    ],
    0,
    HH - 10,
    [1, 1],
    'F',
    true
  );

  // Bottom 4pt solid gold line on header
  setFillHex(PDF_COLORS.GOLD);
  doc.rect(0, HH - 4, W, 4, 'F');

  // ----------------------------------------------------
  // LOGO CARD (x = 36, y = 34, lw = 214, lh = 73.35)
  // ----------------------------------------------------
  const lw = 214;
  const lh = (lw * SOLARITHM_LOGO_HEIGHT) / SOLARITHM_LOGO_WIDTH;
  const pw = lw + 30;
  const ph = lh + 26;
  const cardX = 36;
  const cardY = 34;

  drawShadow(cardX, cardY, pw, ph, 10);
  setFillHex(PDF_COLORS.WHITE);
  doc.roundedRect(cardX, cardY, pw, ph, 10, 10, 'F');

  // Dynamically inject the uploaded company logo or official Solarithm high-res PNG logo
  const activeLogoDataUrl =
    project.logoUrl && project.logoUrl.startsWith('data:image')
      ? project.logoUrl
      : SOLARITHM_LOGO_DATA_URL;
  const imgFormat =
    activeLogoDataUrl.includes('image/jpeg') || activeLogoDataUrl.includes('image/jpg')
      ? 'JPEG'
      : 'PNG';
  const fittedLogo = fitLogoContain(
    cardX + 15,
    cardY + 13,
    lw,
    lh,
    SOLARITHM_LOGO_WIDTH,
    SOLARITHM_LOGO_HEIGHT
  );
  doc.addImage(
    activeLogoDataUrl,
    imgFormat,
    fittedLogo.x,
    fittedLogo.y,
    fittedLogo.width,
    fittedLogo.height,
    undefined,
    'FAST'
  );

  // ----------------------------------------------------
  // FOREGROUND TITLE BLOCK (Right-aligned at W - 40)
  // ----------------------------------------------------
  setTextColorHex(PDF_COLORS.GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('S O L A R I T H M   D E S I G N   &   E N G I N E E R I N G', W - 40, 52, {
    align: 'right',
  });

  // High-contrast foreground white & gold header titles
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(27);
  doc.text('PIPE REQUIREMENT', W - 40, 86, { align: 'right' });

  setTextColorHex(PDF_COLORS.GOLD);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(27);
  doc.text('SUMMARY', W - 40, 116, { align: 'right' });

  // Gold underline
  setStrokeHex(PDF_COLORS.GOLD);
  doc.setLineWidth(1.5);
  doc.line(W - 130, 128, W - 40, 128);

  setTextColorHex(PDF_COLORS.MUTE_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text('Structure pipe quantity estimate', W - 40, 144, { align: 'right' });

  // ----------------------------------------------------
  // 2. INFO STRIP (sx = 40, st = 215, sw = W - 80, sh = 50)
  // ----------------------------------------------------
  const sx = 40;
  const st = 215;
  const sw = W - 80;
  const sh = 50;

  drawShadow(sx, st, sw, sh, 8);
  setFillHex(PDF_COLORS.WHITE);
  doc.roundedRect(sx, st, sw, sh, 8, 8, 'F');

  // Left 4pt gold indicator
  setFillHex(PDF_COLORS.GOLD);
  doc.roundedRect(sx, st, 4, sh, 2, 2, 'F');

  const cols = [
    { label: 'PROJECT', val: project.projectName || 'Solar Structure Project', frac: 0 },
    { label: 'DATE', val: project.submissionDate || '05 Oct 2026', frac: 0.52 },
    {
      label: 'STANDARD PIPE LENGTH',
      val: `${project.standardPipeLength || 20} ${project.pipeLengthUnit || 'ft'}`,
      frac: 0.76,
    },
  ];

  cols.forEach((col, idx) => {
    const x = sx + 18 + sw * col.frac;

    setTextColorHex(PDF_COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(col.label, x, st + 20);

    setTextColorHex(PDF_COLORS.GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(col.val, x, st + 37);

    if (idx > 0) {
      setStrokeHex(PDF_COLORS.LINE);
      doc.setLineWidth(0.8);
      doc.line(x - 14, st + 10, x - 14, st + sh - 10);
    }
  });

  // ----------------------------------------------------
  // 3. SUMMARY CARDS
  // ----------------------------------------------------
  const ct = st + sh + 20; // 285
  const chh = 92;
  const gap = 10;
  const cwid = (W - 80 - 3 * gap) / 4;

  const activeSizes = project.pipeSizes.slice(0, 3);
  while (activeSizes.length < 3) {
    activeSizes.push(`Size ${activeSizes.length + 1}`);
  }

  const totals = calculateSizeTotals(project.rows, activeSizes);
  const grandTotal = calculateGrandTotal(project.rows, activeSizes);

  const cardAccents = [PDF_COLORS.GREEN, PDF_COLORS.MID, PDF_COLORS.GOLD];

  for (let i = 0; i < 4; i++) {
    const x = 40 + i * (cwid + gap);
    const isLast = i === 3;
    const n = isLast ? grandTotal : totals[activeSizes[i]] || 0;
    const [lo, hi] = calculateBuffer(n);

    drawShadow(x, ct, cwid, chh, 8);

    // Card background
    setFillHex(isLast ? PDF_COLORS.GREEN : PDF_COLORS.WHITE);
    doc.roundedRect(x, ct, cwid, chh, 8, 8, 'F');

    // Colored accent band on top (cards 0..2)
    if (!isLast) {
      setFillHex(cardAccents[i] || PDF_COLORS.GREEN);
      doc.roundedRect(x, ct, cwid, 6, 3, 3, 'F');
      doc.rect(x, ct + 3, cwid, 3, 'F');
    }

    // Header label
    setTextColorHex(isLast ? PDF_COLORS.GOLD : PDF_COLORS.MUTE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    const title = isLast ? 'TOTAL PIPES' : `${activeSizes[i]} PIPES`;
    doc.text(title, x + 14, ct + 26);

    // Large number
    setTextColorHex(isLast ? PDF_COLORS.WHITE : PDF_COLORS.GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(32);
    doc.text(String(n), x + 14, ct + 58);

    // 'pcs' label next to number
    const numWidth = doc.getTextWidth(String(n));
    setTextColorHex(isLast ? PDF_COLORS.MUTE_TEXT : PDF_COLORS.MUTE);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text('pcs', x + 14 + numWidth + 5, ct + 58);

    // Horizontal divider line
    setStrokeHex(isLast ? PDF_COLORS.GOLD : PDF_COLORS.LINE);
    doc.setLineWidth(0.6);
    doc.line(x + 14, ct + 68, x + cwid - 14, ct + 68);

    // Bottom buffer text
    setTextColorHex(isLast ? PDF_COLORS.MUTE_TEXT : PDF_COLORS.MUTE);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.2);
    doc.text('With 10-15% extra:', x + 14, ct + 79);

    setTextColorHex(isLast ? PDF_COLORS.GOLD : PDF_COLORS.GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`${lo}-${hi}`, x + cwid - 14, ct + 79, { align: 'right' });
  }

  // ----------------------------------------------------
  // 4. CATEGORY-WISE BREAKDOWN TABLE
  // ----------------------------------------------------
  const tt = ct + chh + 22;

  // Title with gold indicator
  setFillHex(PDF_COLORS.GOLD);
  doc.rect(40, tt - 2, 4, 16, 'F');

  setTextColorHex(PDF_COLORS.GREEN);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.text('CATEGORY-WISE BREAKDOWN', 52, tt + 10);

  setTextColorHex(PDF_COLORS.MUTE);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Quantities in number of pipes', W - 40, tt + 10, { align: 'right' });

  const ty = tt + 22;
  const tw = W - 80;
  const x0 = 40;
  const colWidths = [tw * 0.27, tw * 0.165, tw * 0.165, tw * 0.165, tw * 0.235];

  const hh = 32;
  const rh = 29;
  const gh = 38;
  const rows = project.rows;
  const tbh = hh + rh * rows.length + gh;

  drawShadow(x0, ty, tw, tbh, 8);

  // Outer rounded white card for table
  setFillHex(PDF_COLORS.WHITE);
  doc.roundedRect(x0, ty, tw, tbh, 8, 8, 'F');

  // Table Header Row (<thead>): strictly #063D25 dark forest green background with #C9961A bold gold text
  setFillHex(PDF_COLORS.GREEN);
  doc.roundedRect(x0, ty, tw, hh, 8, 8, 'F');
  doc.rect(x0, ty + hh - 8, tw, 8, 'F');

  const headers = ['CATEGORY', ...activeSizes, 'ROW TOTAL'];
  let curX = x0;
  headers.forEach((h, i) => {
    setTextColorHex(PDF_COLORS.GOLD);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    if (i === 0) {
      doc.text(h, curX + 18, ty + hh / 2 + 3.5);
    } else {
      doc.text(h, curX + colWidths[i] / 2, ty + hh / 2 + 3.5, { align: 'center' });
    }
    curX += colWidths[i];
  });

  // Calculate max row total for proportional mini progress bar
  const rowTotals = rows.map((r) => calculateRowTotal(r, activeSizes));
  const maxRowTotal = Math.max(1, ...rowTotals);

  // Table Body Rows (<tbody>): strictly alternate between Pure White (#FFFFFF) and Soft Light Cream (#FAF6EA)
  let yy = ty + hh;
  rows.forEach((r, k) => {
    const rowBgHex = k % 2 === 0 ? PDF_COLORS.WHITE : PDF_COLORS.CREAM;
    setFillHex(rowBgHex);
    doc.rect(x0, yy, tw, rh, 'F');

    // 3pt gold accent bar on the left of each body row
    setFillHex(PDF_COLORS.GOLD);
    doc.rect(x0, yy, 3, rh, 'F');

    // Category Name (Purlin, Rafter, Leg, Supports, Walkway, Bypass, Stairs): Bold Dark Green (#063D25)
    setTextColorHex(PDF_COLORS.GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(r.category, x0 + 18, yy + rh / 2 + 3.5);

    // Pipe Size Values (40 x 40, 60 x 40, 80 x 40)
    let cellX = x0 + colWidths[0];
    activeSizes.forEach((size, sIdx) => {
      const val = Number(r.quantities[size]) || 0;
      const colW = colWidths[sIdx + 1];
      if (val > 0) {
        // Non-zero numbers: Bold Dark Charcoal (#1B2A22), centered
        setTextColorHex(PDF_COLORS.INK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text(String(val), cellX + colW / 2, yy + rh / 2 + 3.7, { align: 'center' });
      } else {
        // Zero / empty cells: Dash (-) in muted light gray (#C5CBC7), centered
        setTextColorHex(PDF_COLORS.GREY_DASH);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10.5);
        doc.text('-', cellX + colW / 2, yy + rh / 2 + 3.7, { align: 'center' });
      }
      cellX += colW;
    });

    // Row Total column: Horizontal progress bar (#E6DFC8 track + #C9961A gold fill) + bold #063D25 number
    const rt = calculateRowTotal(r, activeSizes);
    const lastColW = colWidths[4];
    const barMaxWidth = 58;
    const barWidth = Math.max(3, (barMaxWidth * rt) / maxRowTotal);

    // Track bar
    setFillHex(PDF_COLORS.LINE);
    doc.roundedRect(cellX + 12, yy + rh / 2 - 3, barMaxWidth, 6, 3, 3, 'F');

    // Fill bar
    setFillHex(PDF_COLORS.GOLD);
    doc.roundedRect(cellX + 12, yy + rh / 2 - 3, barWidth, 6, 3, 3, 'F');

    // Row Total Number
    setTextColorHex(PDF_COLORS.GREEN);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.text(String(rt), cellX + lastColW - 18, yy + rh / 2 + 3.7, { align: 'right' });

    // Subtle horizontal row divider
    setStrokeHex(PDF_COLORS.LINE);
    doc.setLineWidth(0.5);
    doc.line(x0, yy + rh, x0 + tw, yy + rh);

    yy += rh;
  });

  // Vertical column separator lines across body rows
  setStrokeHex(PDF_COLORS.LINE);
  doc.setLineWidth(0.5);
  let vX = x0;
  for (let i = 0; i < 4; i++) {
    vX += colWidths[i];
    doc.line(vX, ty + hh, vX, ty + hh + rh * rows.length);
  }

  // Grand Total Row (<tfoot>): Solid warm gold background (#C9961A) with bold white numerals and dark green final total
  setFillHex(PDF_COLORS.GOLD);
  doc.roundedRect(x0, yy, tw, gh, 8, 8, 'F');
  doc.rect(x0, yy, tw, 8, 'F');

  const grandVals = ['GRAND TOTAL', ...activeSizes.map((s) => totals[s] || 0), grandTotal];
  let gX = x0;
  grandVals.forEach((v, idx) => {
    setTextColorHex(PDF_COLORS.WHITE);
    if (idx === 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(String(v), gX + 18, yy + gh / 2 + 4.2);
    } else if (idx === 4) {
      setTextColorHex(PDF_COLORS.GREEN);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.text(String(v), gX + colWidths[idx] - 18, yy + gh / 2 + 5, { align: 'right' });
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.text(String(v), gX + colWidths[idx] / 2, yy + gh / 2 + 5, { align: 'center' });
    }
    gX += colWidths[idx];
  });

  // ----------------------------------------------------
  // 5. IMPORTANT NOTE CARD
  // ----------------------------------------------------
  const nt = ty + tbh + 18;
  const nh = 52;

  setFillHex(PDF_COLORS.RED_BG);
  doc.roundedRect(x0, nt, tw, nh, 8, 8, 'F');

  // Red accent border on left
  setFillHex(PDF_COLORS.RED);
  doc.roundedRect(x0, nt, 5, nh, 2.5, 2.5, 'F');

  // Red circular badge with '!'
  doc.circle(70, nt + nh / 2, 13, 'F');
  setTextColorHex(PDF_COLORS.WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text('!', 70, nt + nh / 2 + 6, { align: 'center' });

  // Note text
  setTextColorHex(PDF_COLORS.RED);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('IMPORTANT NOTE', 96, nt + 19);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    project.noteText || 'PLEASE QUOTE 10-15% EXTRA PIPES OF ALL SIZES FOR ON-SITE VARIATION.',
    96,
    nt + 35
  );

  // Subtext below
  setTextColorHex(PDF_COLORS.MUTE);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.text(
    `Calculation based on standard pipe length of ${project.standardPipeLength || 20} ${
      project.pipeLengthUnit || 'ft'
    }.`,
    W / 2,
    nt + nh + 17,
    { align: 'center' }
  );

  // ----------------------------------------------------
  // 6. FOOTER
  // ----------------------------------------------------
  setFillHex(PDF_COLORS.GREEN);
  doc.rect(0, H - 40, W, 40, 'F');

  setFillHex(PDF_COLORS.GOLD);
  doc.rect(0, H - 43, W, 3, 'F');

  const footerLeft = project.companyName || 'Solarithm Design & Engineering';
  const footerCity = `|  ${project.companyCity || 'Surat, India'}`;

  setTextColorHex(PDF_COLORS.WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(footerLeft, 40, H - 15);

  const leftWidth = doc.getTextWidth(footerLeft);
  setTextColorHex(PDF_COLORS.GOLD);
  doc.text(footerCity, 40 + leftWidth + 8, H - 15);

  setTextColorHex(PDF_COLORS.MUTE_TEXT);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Pipe Requirement Summary  |  ${project.projectName}`, W - 40, H - 15, {
    align: 'right',
  });

  return doc;
}
