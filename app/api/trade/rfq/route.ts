import { readFile } from "fs/promises";
import { join } from "path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import productsData from "@/data/products.json";
import finishesData from "@/data/finishes.json";
import { sanitizeTradeProject, type TradeProject } from "@/lib/trade-project";

export const runtime = "nodejs";

const CHARCOAL = rgb(0.06, 0.06, 0.06);
const DARK_GRAY = rgb(0.25, 0.25, 0.24);
const MID_GRAY = rgb(0.48, 0.48, 0.45);
const LIGHT_GRAY = rgb(0.78, 0.78, 0.75);
const WARM_BG = rgb(0.96, 0.96, 0.95);
const WHITE = rgb(1, 1, 1);
const ACCENT = rgb(0.78, 0.7, 0.48);

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN = 48;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface ResolvedItem {
  product: (typeof productsData.products)[number];
  variant: (typeof productsData.products)[number]["variants"][number];
  finish: (typeof finishesData)[number] | undefined;
  quantity: number;
  lineTotal: number;
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255
  );
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

async function loadProductImage(slug: string, finish: string): Promise<Buffer | null> {
  try {
    const series = slug.split("-")[0];
    const productName = slug.replace(`${series}-`, "");
    const imgPath = join(process.cwd(), "public", "images", "products", series, productName, `${finish}.png`);
    return await readFile(imgPath) as unknown as Buffer;
  } catch {
    return null;
  }
}

function resolveItems(project: TradeProject): ResolvedItem[] {
  return project.items.flatMap((item) => {
    const product = productsData.products.find((p) => p.slug === item.slug);
    const variant = product?.variants.find((v) => v.finish === item.finish);
    if (!product || !variant) return [];
    const finish = finishesData.find((f) => f.id === item.finish);
    return [{ product, variant, finish, quantity: item.quantity, lineTotal: variant.price * item.quantity }];
  });
}

async function buildPremiumPdf(project: TradeProject) {
  const now = new Date();
  const reference = `STM-RFQ-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(now.getTime()).slice(-6)}`;
  const rows = resolveItems(project);
  const total = rows.reduce((sum, r) => sum + r.lineTotal, 0);
  const detail = project.details;

  const doc = await PDFDocument.create();
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesRoman = await doc.embedFont(StandardFonts.TimesRoman);
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic);

  const logoBytes = await loadLogo();
  const logoImage = logoBytes ? await doc.embedPng(logoBytes) : null;

  // ──────────────────── PAGE 1: COVER ────────────────────
  const cover = doc.addPage([PAGE_W, PAGE_H]);

  // Dark header band
  cover.drawRectangle({ x: 0, y: PAGE_H - 160, width: PAGE_W, height: 160, color: CHARCOAL });
  // Accent line
  cover.drawRectangle({ x: 0, y: PAGE_H - 166, width: PAGE_W, height: 6, color: ACCENT });

  // Logo
  if (logoImage) {
    const logoDims = logoImage.scale(0.18);
    cover.drawImage(logoImage, {
      x: MARGIN,
      y: PAGE_H - 45 - logoDims.height / 2,
      width: logoDims.width,
      height: logoDims.height,
      opacity: 0.95,
    });
  } else {
    cover.drawText("STEINHEIM", { x: MARGIN, y: PAGE_H - 52, size: 28, font: helveticaBold, color: WHITE });
  }

  // Header text
  cover.drawText("TRADE PROJECT SPECIFICATION", {
    x: MARGIN, y: PAGE_H - 88, size: 9, font: helvetica, color: LIGHT_GRAY,
  });
  cover.drawText("REQUEST FOR QUOTATION", {
    x: MARGIN, y: PAGE_H - 102, size: 9, font: helvetica, color: LIGHT_GRAY,
  });

  // Reference number (right-aligned in header)
  const refText = reference;
  const refWidth = helvetica.widthOfTextAtSize(refText, 8);
  cover.drawText(refText, {
    x: PAGE_W - MARGIN - refWidth, y: PAGE_H - 52, size: 8, font: helvetica, color: LIGHT_GRAY,
  });
  const dateText = now.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const dateWidth = helvetica.widthOfTextAtSize(dateText, 8);
  cover.drawText(dateText, {
    x: PAGE_W - MARGIN - dateWidth, y: PAGE_H - 66, size: 8, font: helvetica, color: LIGHT_GRAY,
  });

  // Project title
  let y = PAGE_H - 220;
  cover.drawText("Project", { x: MARGIN, y, size: 9, font: helvetica, color: MID_GRAY });
  y -= 28;
  const projectTitle = detail.projectName || "Untitled Project";
  cover.drawText(projectTitle, { x: MARGIN, y, size: 32, font: timesRoman, color: CHARCOAL });
  y -= 14;

  // Decorative divider
  cover.drawRectangle({ x: MARGIN, y: y - 4, width: 50, height: 1.5, color: ACCENT });
  y -= 30;

  // Project details grid
  const gridItems = [
    ["Client", detail.contactName || "—"],
    ["Company", detail.company || "—"],
    ["Role", detail.role || "—"],
    ["Email", detail.email || "—"],
    ["Phone", detail.phone || "—"],
    ["Project type", detail.projectType || "—"],
    ["Location", detail.location || "—"],
    ["Timeline", detail.timeline || "—"],
  ];

  const colWidth = CONTENT_W / 2;
  for (let i = 0; i < gridItems.length; i++) {
    const [label, value] = gridItems[i];
    const col = i % 2;
    const row = Math.floor(i / 2);
    const xPos = MARGIN + col * colWidth;
    const yPos = y - row * 48;

    cover.drawText(label.toUpperCase(), {
      x: xPos, y: yPos, size: 7.5, font: helveticaBold, color: MID_GRAY,
    });
    cover.drawText(value, {
      x: xPos, y: yPos - 14, size: 11, font: helvetica, color: CHARCOAL,
    });
  }

  y -= (Math.ceil(gridItems.length / 2)) * 48 + 16;

  // Summary strip
  cover.drawRectangle({ x: MARGIN, y: y - 70, width: CONTENT_W, height: 70, color: WARM_BG });
  const summaryY = y - 25;
  const summaryItems = [
    [`${rows.length}`, "Products"],
    [`${rows.reduce((s, r) => s + r.quantity, 0)}`, "Total units"],
    [`${new Set(rows.map((r) => r.product.series)).size}`, "Collections"],
    [`${new Set(rows.map((r) => r.finish?.name ?? r.variant.finish)).size}`, "Finishes"],
  ];
  const stripColW = CONTENT_W / summaryItems.length;
  summaryItems.forEach(([num, label], i) => {
    const sx = MARGIN + i * stripColW + 16;
    cover.drawText(num, { x: sx, y: summaryY, size: 20, font: timesRoman, color: CHARCOAL });
    cover.drawText(label.toUpperCase(), { x: sx, y: summaryY - 18, size: 7, font: helvetica, color: MID_GRAY });
  });

  y -= 100;

  // Notes (if present)
  if (detail.notes) {
    cover.drawText("PROJECT NOTES", { x: MARGIN, y, size: 8, font: helveticaBold, color: MID_GRAY });
    y -= 18;
    const noteLines = wrapText(detail.notes, helvetica, 10, CONTENT_W);
    for (const line of noteLines) {
      if (y < 60) break;
      cover.drawText(line, { x: MARGIN, y, size: 10, font: helvetica, color: DARK_GRAY });
      y -= 16;
    }
  }

  // Footer
  cover.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 40, color: CHARCOAL });
  cover.drawText("Steinheim Egypt  |  El Sharbatly International Group  |  inquiries@steinheim-eg.com", {
    x: MARGIN, y: 15, size: 7, font: helvetica, color: LIGHT_GRAY,
  });
  const p1Text = "Page 1";
  const p1Width = helvetica.widthOfTextAtSize(p1Text, 7);
  cover.drawText(p1Text, {
    x: PAGE_W - MARGIN - p1Width, y: 15, size: 7, font: helvetica, color: LIGHT_GRAY,
  });

  // ──────────────────── PAGE 2+: PRODUCT SCHEDULE ────────────────────
  let currentPage = doc.addPage([PAGE_W, PAGE_H]);
  let pageNum = 2;

  function drawPageHeader(page: ReturnType<PDFDocument["addPage"]>, num: number) {
    page.drawRectangle({ x: 0, y: PAGE_H - 60, width: PAGE_W, height: 60, color: CHARCOAL });
    page.drawRectangle({ x: 0, y: PAGE_H - 63, width: PAGE_W, height: 3, color: ACCENT });

    if (logoImage) {
      const dims = logoImage.scale(0.1);
      page.drawImage(logoImage, {
        x: MARGIN, y: PAGE_H - 30 - dims.height / 2,
        width: dims.width, height: dims.height, opacity: 0.9,
      });
    } else {
      page.drawText("STEINHEIM", { x: MARGIN, y: PAGE_H - 38, size: 14, font: helveticaBold, color: WHITE });
    }

    const pgText = `Product Schedule  |  ${reference}`;
    const pgWidth = helvetica.widthOfTextAtSize(pgText, 7);
    page.drawText(pgText, {
      x: PAGE_W - MARGIN - pgWidth, y: PAGE_H - 35, size: 7, font: helvetica, color: LIGHT_GRAY,
    });

    // Footer
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 40, color: CHARCOAL });
    page.drawText("Trade pricing subject to Steinheim confirmation  |  Retail references only", {
      x: MARGIN, y: 15, size: 7, font: helvetica, color: LIGHT_GRAY,
    });
    const pText = `Page ${num}`;
    const pWidth = helvetica.widthOfTextAtSize(pText, 7);
    page.drawText(pText, {
      x: PAGE_W - MARGIN - pWidth, y: 15, size: 7, font: helvetica, color: LIGHT_GRAY,
    });
  }

  drawPageHeader(currentPage, pageNum);

  // Section title
  y = PAGE_H - 100;
  currentPage.drawText("Product Schedule", { x: MARGIN, y, size: 22, font: timesRoman, color: CHARCOAL });
  y -= 10;
  currentPage.drawRectangle({ x: MARGIN, y: y - 4, width: 40, height: 1.5, color: ACCENT });
  y -= 24;

  // Table header
  function drawTableHeader(page: ReturnType<PDFDocument["addPage"]>, yPos: number) {
    page.drawRectangle({ x: MARGIN, y: yPos - 4, width: CONTENT_W, height: 20, color: WARM_BG });
    const headers = [
      { text: "#", x: MARGIN + 6, w: 20 },
      { text: "PRODUCT", x: MARGIN + 30, w: 200 },
      { text: "MODEL", x: MARGIN + 230, w: 90 },
      { text: "FINISH", x: MARGIN + 320, w: 80 },
      { text: "QTY", x: MARGIN + 400, w: 35 },
      { text: "LINE TOTAL", x: MARGIN + 435, w: 65 },
    ];
    for (const h of headers) {
      page.drawText(h.text, { x: h.x, y: yPos, size: 6.5, font: helveticaBold, color: MID_GRAY });
    }
    return yPos - 28;
  }

  y = drawTableHeader(currentPage, y);

  // Product rows with images
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ROW_HEIGHT = 72;

    if (y - ROW_HEIGHT < 60) {
      pageNum++;
      currentPage = doc.addPage([PAGE_W, PAGE_H]);
      drawPageHeader(currentPage, pageNum);
      y = PAGE_H - 100;
      currentPage.drawText("Product Schedule (continued)", { x: MARGIN, y, size: 16, font: timesRoman, color: CHARCOAL });
      y -= 30;
      y = drawTableHeader(currentPage, y);
    }

    // Alternating row background
    if (i % 2 === 0) {
      currentPage.drawRectangle({
        x: MARGIN, y: y - ROW_HEIGHT + 16, width: CONTENT_W, height: ROW_HEIGHT, color: rgb(0.985, 0.985, 0.98),
      });
    }

    // Row separator
    currentPage.drawRectangle({
      x: MARGIN, y: y - ROW_HEIGHT + 16, width: CONTENT_W, height: 0.5, color: rgb(0.9, 0.9, 0.88),
    });

    const series = productsData.series.find((s) => s.id === row.product.series);
    const seriesName = series?.name ?? row.product.series;

    // Product image
    try {
      const imgBytes = await loadProductImage(row.product.slug, row.variant.finish);
      if (imgBytes) {
        const img = await doc.embedPng(imgBytes);
        const imgSize = 48;
        const imgDims = img.scaleToFit(imgSize, imgSize);
        currentPage.drawRectangle({
          x: MARGIN + 30, y: y - 40, width: 52, height: 52, color: rgb(0.96, 0.96, 0.95),
        });
        currentPage.drawImage(img, {
          x: MARGIN + 30 + (52 - imgDims.width) / 2,
          y: y - 40 + (52 - imgDims.height) / 2,
          width: imgDims.width,
          height: imgDims.height,
        });
      }
    } catch {
      // Skip image if it can't be loaded
    }

    // Row number
    currentPage.drawText(`${i + 1}`, {
      x: MARGIN + 10, y: y - 10, size: 9, font: helvetica, color: MID_GRAY,
    });

    // Product name and series
    currentPage.drawText(`${seriesName} ${row.product.name}`, {
      x: MARGIN + 88, y: y - 6, size: 10, font: helveticaBold, color: CHARCOAL,
    });
    currentPage.drawText(row.product.type.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()), {
      x: MARGIN + 88, y: y - 20, size: 7.5, font: helvetica, color: MID_GRAY,
    });

    // Model number
    currentPage.drawText(row.variant.model, {
      x: MARGIN + 230, y: y - 6, size: 9, font: helvetica, color: DARK_GRAY,
    });

    // Finish name with color swatch
    const finishName = row.finish?.name ?? row.variant.finish;
    if (row.finish?.hex) {
      currentPage.drawCircle({
        x: MARGIN + 324, y: y - 7, size: 5, color: hexToRgb(row.finish.hex),
      });
      currentPage.drawCircle({
        x: MARGIN + 324, y: y - 7, size: 5, borderColor: rgb(0.8, 0.8, 0.78), borderWidth: 0.5,
      });
    }
    currentPage.drawText(finishName, {
      x: MARGIN + 334, y: y - 10, size: 8, font: helvetica, color: DARK_GRAY,
    });

    // PVD badge
    if (row.finish?.type === "pvd") {
      const pvdX = MARGIN + 334 + helvetica.widthOfTextAtSize(finishName, 8) + 5;
      currentPage.drawRectangle({
        x: pvdX, y: y - 14, width: 20, height: 11, color: rgb(0.94, 0.94, 0.92),
      });
      currentPage.drawText("PVD", { x: pvdX + 3, y: y - 11, size: 6, font: helveticaBold, color: MID_GRAY });
    }

    // Quantity
    currentPage.drawText(`${row.quantity}`, {
      x: MARGIN + 410, y: y - 6, size: 10, font: helveticaBold, color: CHARCOAL,
    });

    // Line total
    const totalStr = `LE ${row.lineTotal.toLocaleString("en-US")}`;
    currentPage.drawText(totalStr, {
      x: MARGIN + 435, y: y - 6, size: 10, font: helveticaBold, color: CHARCOAL,
    });

    // Unit price
    currentPage.drawText(`@ LE ${row.variant.price.toLocaleString("en-US")} each`, {
      x: MARGIN + 435, y: y - 20, size: 7, font: helvetica, color: MID_GRAY,
    });

    y -= ROW_HEIGHT;
  }

  // Totals row
  y -= 8;
  currentPage.drawRectangle({ x: MARGIN, y: y - 32, width: CONTENT_W, height: 36, color: CHARCOAL });
  currentPage.drawText("RETAIL REFERENCE TOTAL", {
    x: MARGIN + 12, y: y - 18, size: 9, font: helveticaBold, color: LIGHT_GRAY,
  });
  const totalStr = `LE ${total.toLocaleString("en-US")}`;
  const totalWidth = helveticaBold.widthOfTextAtSize(totalStr, 16);
  currentPage.drawText(totalStr, {
    x: PAGE_W - MARGIN - totalWidth - 12, y: y - 22, size: 16, font: helveticaBold, color: WHITE,
  });

  y -= 54;

  // Disclaimer
  if (y > 120) {
    currentPage.drawText("COMMERCIAL STATUS", {
      x: MARGIN, y, size: 8, font: helveticaBold, color: MID_GRAY,
    });
    y -= 18;
    const disclaimers = [
      "Trade pricing is confirmed after Steinheim review. Retail prices shown are references only.",
      "Stock availability, lead times, delivery, payment terms, and final discounts: to be confirmed.",
      "This document does not constitute a binding quotation or purchase agreement.",
    ];
    for (const text of disclaimers) {
      currentPage.drawText(`•  ${text}`, { x: MARGIN, y, size: 8, font: helvetica, color: MID_GRAY });
      y -= 14;
    }
  }

  // ──────────────────── FINAL PAGE: NEXT STEPS ────────────────────
  const closingPage = doc.addPage([PAGE_W, PAGE_H]);
  pageNum++;
  drawPageHeader(closingPage, pageNum);

  y = PAGE_H - 140;
  closingPage.drawText("Next Steps", { x: MARGIN, y, size: 28, font: timesRoman, color: CHARCOAL });
  y -= 10;
  closingPage.drawRectangle({ x: MARGIN, y: y - 4, width: 40, height: 1.5, color: ACCENT });
  y -= 36;

  const steps = [
    ["1", "Review", "Our team will review your product selection and project requirements within 24 hours."],
    ["2", "Trade pricing", "You will receive confirmed trade pricing based on your project scope and volume."],
    ["3", "Coordination", "We will coordinate delivery schedules, payment terms, and any technical support."],
  ];

  for (const [num, title, desc] of steps) {
    closingPage.drawRectangle({ x: MARGIN, y: y - 64, width: CONTENT_W, height: 72, color: WARM_BG });

    // Step number circle
    closingPage.drawCircle({ x: MARGIN + 28, y: y - 28, size: 16, color: CHARCOAL });
    const numW = helveticaBold.widthOfTextAtSize(num, 14);
    closingPage.drawText(num, {
      x: MARGIN + 28 - numW / 2, y: y - 33, size: 14, font: helveticaBold, color: WHITE,
    });

    closingPage.drawText(title, {
      x: MARGIN + 56, y: y - 16, size: 13, font: helveticaBold, color: CHARCOAL,
    });

    const descLines = wrapText(desc, helvetica, 10, CONTENT_W - 70);
    let descY = y - 34;
    for (const line of descLines) {
      closingPage.drawText(line, { x: MARGIN + 56, y: descY, size: 10, font: helvetica, color: DARK_GRAY });
      descY -= 14;
    }

    y -= 88;
  }

  y -= 20;
  closingPage.drawRectangle({ x: MARGIN, y: y - 80, width: CONTENT_W, height: 80, color: CHARCOAL });
  closingPage.drawText("Get in touch", {
    x: MARGIN + 20, y: y - 28, size: 18, font: timesRoman, color: WHITE,
  });
  closingPage.drawText("inquiries@steinheim-eg.com", {
    x: MARGIN + 20, y: y - 48, size: 10, font: helvetica, color: LIGHT_GRAY,
  });
  closingPage.drawText("steinheim-eg.com", {
    x: MARGIN + 20, y: y - 64, size: 10, font: helvetica, color: LIGHT_GRAY,
  });

  y -= 110;
  closingPage.drawText("Thank you for considering Steinheim for your project.", {
    x: MARGIN, y, size: 12, font: timesItalic, color: MID_GRAY,
  });

  const pdfBytes = await doc.save();
  return { pdf: Buffer.from(pdfBytes), reference };
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 100_000) {
    return Response.json({ error: "Request is too large." }, { status: 413 });
  }

  const value = await request.json().catch(() => null);
  const project = sanitizeTradeProject(value);

  if (
    !project ||
    project.items.length === 0 ||
    !project.details.projectName ||
    !project.details.contactName ||
    !/^\S+@\S+\.\S+$/.test(project.details.email)
  ) {
    return Response.json(
      { error: "Project name, contact, email, and at least one valid product are required." },
      { status: 400 }
    );
  }

  const { pdf, reference } = await buildPremiumPdf(project);
  const safeName = project.details.projectName
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "project";

  return new Response(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="steinheim-${safeName}-rfq.pdf"`,
      "Cache-Control": "no-store",
      "X-Steinheim-RFQ": reference,
    },
  });
}
