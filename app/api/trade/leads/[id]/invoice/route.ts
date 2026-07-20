import { readFile } from "fs/promises";
import { join } from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import productsData from "@/data/products.json";
import { getTradeLead } from "@/lib/server/trade-lead-store";
import { isAdminRequest } from "@/lib/server/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CHARCOAL = rgb(0.06, 0.06, 0.06);
const DARK_GRAY = rgb(0.25, 0.25, 0.24);
const MID_GRAY = rgb(0.48, 0.48, 0.45);
const LIGHT_GRAY = rgb(0.78, 0.78, 0.75);
const WARM_BG = rgb(0.96, 0.96, 0.95);
const WHITE = rgb(1, 1, 1);
const ACCENT = rgb(0.78, 0.7, 0.48);
const DRAFT_BG = rgb(0.98, 0.94, 0.85);
const DRAFT_TEXT = rgb(0.5, 0.36, 0.1);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;
const VAT_RATE = 0.14;

function parseAmount(value: string | undefined): number | null {
  if (!value) return null;
  const digits = value.replace(/[^0-9.]/g, "");
  const num = Number(digits);
  return Number.isFinite(num) && num > 0 ? num : null;
}

function wrapText(text: string, font: Awaited<ReturnType<PDFDocument["embedFont"]>>, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

async function loadLogo(): Promise<Buffer | null> {
  try {
    const logoPath = join(process.cwd(), "public", "images", "logo-dark.png");
    return await readFile(logoPath) as unknown as Buffer;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(request)) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  if (!id) return Response.json({ error: "A lead id is required." }, { status: 400 });

  const lead = await getTradeLead(id);
  if (!lead) return Response.json({ error: "Not found." }, { status: 404 });

  const rows = lead.project.items.flatMap((item) => {
    const product = productsData.products.find((p) => p.slug === item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    return [{ product, variant, quantity: item.quantity, lineTotal: variant.price * item.quantity }];
  });
  const retailTotal = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const quotedTotal = parseAmount(lead.quoteAmount);
  const grandTotal = quotedTotal ?? retailTotal;
  const subtotal = grandTotal / (1 + VAT_RATE);
  const vatAmount = grandTotal - subtotal;

  const now = new Date();
  const invoiceRef = `STM-INV-DRAFT-${lead.reference.replace(/^STM-LEAD-/, "")}`;
  const d = lead.project.details;

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const logoBytes = await loadLogo();
  const logoImage = logoBytes ? await doc.embedPng(logoBytes) : null;

  const page = doc.addPage([PAGE_W, PAGE_H]);

  // Header band
  page.drawRectangle({ x: 0, y: PAGE_H - 120, width: PAGE_W, height: 120, color: CHARCOAL });
  page.drawRectangle({ x: 0, y: PAGE_H - 124, width: PAGE_W, height: 4, color: ACCENT });

  if (logoImage) {
    const dims = logoImage.scale(0.14);
    page.drawImage(logoImage, { x: MARGIN, y: PAGE_H - 35 - dims.height / 2, width: dims.width, height: dims.height, opacity: 0.95 });
  } else {
    page.drawText("STEINHEIM", { x: MARGIN, y: PAGE_H - 42, size: 22, font: helveticaBold, color: WHITE });
  }
  page.drawText("TAX INVOICE (DRAFT PROTOTYPE)", { x: MARGIN, y: PAGE_H - 68, size: 9, font: helvetica, color: LIGHT_GRAY });

  const refWidth = helvetica.widthOfTextAtSize(invoiceRef, 8);
  page.drawText(invoiceRef, { x: PAGE_W - MARGIN - refWidth, y: PAGE_H - 42, size: 8, font: helvetica, color: LIGHT_GRAY });
  const dateStr = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dateWidth = helvetica.widthOfTextAtSize(dateStr, 8);
  page.drawText(dateStr, { x: PAGE_W - MARGIN - dateWidth, y: PAGE_H - 56, size: 8, font: helvetica, color: LIGHT_GRAY });

  // Draft warning banner
  let y = PAGE_H - 150;
  const bannerLines = [
    "This is a design prototype only — it has NOT been submitted to, or validated by, the Egyptian Tax",
    "Authority (ETA) e-invoicing system. Do not send to a client as a real tax document. Steinheim's actual",
    "tax registration number, ETA credentials, and digital signature must be added before this can be a",
    "legally valid Egyptian VAT invoice.",
  ];
  const bannerHeight = 18 + bannerLines.length * 12;
  page.drawRectangle({ x: MARGIN, y: y - bannerHeight, width: CONTENT_W, height: bannerHeight, color: DRAFT_BG });
  page.drawText("DRAFT — NOT ETA CERTIFIED", { x: MARGIN + 10, y: y - 14, size: 9, font: helveticaBold, color: DRAFT_TEXT });
  let by = y - 28;
  for (const line of bannerLines) {
    page.drawText(line, { x: MARGIN + 10, y: by, size: 7.5, font: helvetica, color: DRAFT_TEXT });
    by -= 12;
  }
  y -= bannerHeight + 24;

  // Seller / Buyer
  const colW = CONTENT_W / 2 - 10;
  page.drawText("SELLER", { x: MARGIN, y, size: 8, font: helveticaBold, color: MID_GRAY });
  page.drawText("BUYER", { x: MARGIN + CONTENT_W / 2 + 10, y, size: 8, font: helveticaBold, color: MID_GRAY });
  y -= 16;

  const sellerLines = [
    "Steinheim Egypt (El Sharbatly International Group)",
    "Cairo, Egypt",
    "Tax Registration No.: [ADD STEINHEIM ETA TRN]",
    "inquiries@steinheim-eg.com",
  ];
  const buyerLines = [
    d.company || d.contactName || "—",
    d.contactName && d.company ? d.contactName : "",
    d.location || "—",
    "Tax Registration No.: [TO BE PROVIDED BY CLIENT]",
    d.email || "—",
  ].filter(Boolean);

  const startY = y;
  sellerLines.forEach((line, i) => {
    const wrapped = wrapText(line, helvetica, 9, colW);
    wrapped.forEach((w, j) => page.drawText(w, { x: MARGIN, y: startY - (i + j) * 13, size: 9, font: i === 0 ? helveticaBold : helvetica, color: DARK_GRAY }));
  });
  buyerLines.forEach((line, i) => {
    const wrapped = wrapText(line, helvetica, 9, colW);
    wrapped.forEach((w, j) => page.drawText(w, { x: MARGIN + CONTENT_W / 2 + 10, y: startY - (i + j) * 13, size: 9, font: i === 0 ? helveticaBold : helvetica, color: DARK_GRAY }));
  });
  y -= Math.max(sellerLines.length, buyerLines.length) * 13 + 28;

  // Item table
  page.drawRectangle({ x: MARGIN, y: y - 4, width: CONTENT_W, height: 20, color: WARM_BG });
  page.drawText("DESCRIPTION", { x: MARGIN + 6, y, size: 7.5, font: helveticaBold, color: MID_GRAY });
  page.drawText("QTY", { x: MARGIN + 330, y, size: 7.5, font: helveticaBold, color: MID_GRAY });
  page.drawText("UNIT PRICE", { x: MARGIN + 380, y, size: 7.5, font: helveticaBold, color: MID_GRAY });
  page.drawText("LINE TOTAL", { x: MARGIN + 460, y, size: 7.5, font: helveticaBold, color: MID_GRAY });
  y -= 26;

  for (const row of rows) {
    if (y < 140) break; // prototype: keep to one page
    const series = productsData.series.find((s) => s.id === row.product.series);
    const label = `${series?.name ?? row.product.series} ${row.product.name} — ${row.variant.finish} (${row.variant.model})`;
    const wrapped = wrapText(label, helvetica, 9, 310);
    page.drawText(wrapped[0], { x: MARGIN + 6, y, size: 9, font: helvetica, color: DARK_GRAY });
    page.drawText(`${row.quantity}`, { x: MARGIN + 330, y, size: 9, font: helvetica, color: DARK_GRAY });
    page.drawText(`LE ${row.variant.price.toLocaleString("en-US")}`, { x: MARGIN + 380, y, size: 9, font: helvetica, color: DARK_GRAY });
    page.drawText(`LE ${row.lineTotal.toLocaleString("en-US")}`, { x: MARGIN + 460, y, size: 9, font: helveticaBold, color: CHARCOAL });
    y -= 18;
  }

  y -= 10;
  page.drawRectangle({ x: MARGIN, y: y - 0.5, width: CONTENT_W, height: 0.5, color: rgb(0.85, 0.85, 0.82) });
  y -= 24;

  // VAT summary
  const summaryX = MARGIN + CONTENT_W - 200;
  const summaryRows: Array<[string, string]> = [
    ["Subtotal (excl. VAT)", `LE ${Math.round(subtotal).toLocaleString("en-US")}`],
    [`VAT (${Math.round(VAT_RATE * 100)}%)`, `LE ${Math.round(vatAmount).toLocaleString("en-US")}`],
  ];
  for (const [label, value] of summaryRows) {
    page.drawText(label, { x: summaryX, y, size: 9, font: helvetica, color: MID_GRAY });
    const vw = helvetica.widthOfTextAtSize(value, 9);
    page.drawText(value, { x: MARGIN + CONTENT_W - vw, y, size: 9, font: helvetica, color: DARK_GRAY });
    y -= 16;
  }
  page.drawRectangle({ x: summaryX - 10, y: y - 26, width: CONTENT_W - (summaryX - MARGIN) + 10, height: 32, color: CHARCOAL });
  page.drawText("TOTAL (incl. VAT)", { x: summaryX, y: y - 16, size: 10, font: helveticaBold, color: WHITE });
  const totalStr = `LE ${Math.round(grandTotal).toLocaleString("en-US")}`;
  const totalW = helveticaBold.widthOfTextAtSize(totalStr, 13);
  page.drawText(totalStr, { x: MARGIN + CONTENT_W - totalW, y: y - 17, size: 13, font: helveticaBold, color: WHITE });
  y -= 60;

  if (!quotedTotal) {
    page.drawText("No confirmed quote amount is set for this lead — totals shown use retail reference pricing.", {
      x: MARGIN, y, size: 8, font: helvetica, color: MID_GRAY,
    });
    y -= 20;
  }

  page.drawText(`Reference: ${lead.reference}`, { x: MARGIN, y, size: 8, font: helvetica, color: MID_GRAY });

  // Footer
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 34, color: CHARCOAL });
  page.drawText("Prototype for internal review — Steinheim Egypt  |  El Sharbatly International Group", {
    x: MARGIN, y: 13, size: 7, font: helvetica, color: LIGHT_GRAY,
  });

  const pdfBytes = await doc.save();
  return new Response(Buffer.from(pdfBytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="steinheim-invoice-draft-${lead.reference}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
