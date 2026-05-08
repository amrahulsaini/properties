import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource, ResourceError } from "@/lib/resources";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN_LEFT = 34;
const MARGIN_RIGHT = 34;
const MARGIN_TOP = 34;
const MARGIN_BOTTOM = 34;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const LABEL_WIDTH = 150;
const VALUE_X = MARGIN_LEFT + LABEL_WIDTH;
const VALUE_WIDTH = CONTENT_WIDTH - LABEL_WIDTH;

const TITLE_COLOR = rgb(0.08, 0.08, 0.08);
const LABEL_COLOR = rgb(0.35, 0.35, 0.35);
const VALUE_COLOR = rgb(0.12, 0.12, 0.12);
const LINE_COLOR = rgb(0.87, 0.87, 0.87);
const ACCENT_COLOR = rgb(0.95, 0.42, 0.11);

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (Array.isArray(value)) {
    return value.map((item) => formatValue(item)).join(", ");
  }

  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "[object]";
    }
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function wrapTextLines(text: string, font: any, size: number, maxWidth: number) {
  const paragraphs = String(text ?? "").split(/\r?\n/);
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    if (!words.length) {
      lines.push("");
      continue;
    }

    let currentLine = words[0];
    for (const word of words.slice(1)) {
      const candidate = `${currentLine} ${word}`;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }

    lines.push(currentLine);
  }

  return lines.length ? lines : [""];
}

function drawWrappedText(
  page: any,
  text: string,
  x: number,
  y: number,
  font: any,
  size: number,
  color: any,
  maxWidth: number,
  lineHeight: number,
) {
  const lines = wrapTextLines(text, font, size, maxWidth);
  lines.forEach((line, index) => {
    page.drawText(line || " ", {
      x,
      y: y - index * lineHeight,
      size,
      font,
      color,
      maxWidth,
    });
  });
  return lines.length * lineHeight;
}

function drawPageHeader(
  page: any,
  bold: any,
  regular: any,
  resource: string,
  pageNumber: number,
  totalRows: number,
  rowIndex: number,
) {
  const headerY = PAGE_HEIGHT - MARGIN_TOP;

  page.drawText(`${titleCase(resource)} PDF Export`, {
    x: MARGIN_LEFT,
    y: headerY,
    size: 18,
    font: bold,
    color: ACCENT_COLOR,
  });

  page.drawText(`Record ${rowIndex + 1} of ${totalRows}`, {
    x: MARGIN_LEFT,
    y: headerY - 20,
    size: 9,
    font: regular,
    color: LABEL_COLOR,
  });

  page.drawText(`Page ${pageNumber}`, {
    x: PAGE_WIDTH - MARGIN_RIGHT - 60,
    y: headerY - 20,
    size: 9,
    font: regular,
    color: LABEL_COLOR,
  });

  page.drawLine({
    start: { x: MARGIN_LEFT, y: headerY - 28 },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: headerY - 28 },
    thickness: 1.5,
    color: ACCENT_COLOR,
  });
}

async function addRecordPages(
  pdf: PDFDocument,
  bold: any,
  regular: any,
  resource: string,
  row: Record<string, unknown>,
  rowIndex: number,
  totalRows: number,
) {
  const entries = Object.entries(row).filter(([key]) => !key.startsWith("_"));

  let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let pageNumber = pdf.getPageCount();
  let y = PAGE_HEIGHT - MARGIN_TOP - 48;

  drawPageHeader(page, bold, regular, resource, pageNumber, totalRows, rowIndex);

  for (const [key, value] of entries) {
    const label = titleCase(key);
    const valueText = formatValue(value);
    const valueLines = wrapTextLines(valueText, regular, 10, VALUE_WIDTH - 4);
    const rowHeight = Math.max(18, valueLines.length * 12);

    if (y - rowHeight < MARGIN_BOTTOM) {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber = pdf.getPageCount();
      y = PAGE_HEIGHT - MARGIN_TOP - 48;
      drawPageHeader(page, bold, regular, resource, pageNumber, totalRows, rowIndex);
    }

    page.drawText(label, {
      x: MARGIN_LEFT,
      y,
      size: 8.5,
      font: bold,
      color: LABEL_COLOR,
      maxWidth: LABEL_WIDTH - 8,
    });

    drawWrappedText(
      page,
      valueText,
      VALUE_X,
      y,
      regular,
      10,
      VALUE_COLOR,
      VALUE_WIDTH,
      12,
    );

    page.drawLine({
      start: { x: MARGIN_LEFT, y: y - rowHeight - 4 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: y - rowHeight - 4 },
      thickness: 0.5,
      color: LINE_COLOR,
    });

    y -= rowHeight + 12;
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireApiSession(request);
    const resource = request.nextUrl.searchParams.get("resource");

    if (!resource) {
      throw new ResourceError("resource query parameter is required.");
    }

    assertResourceAccess(session, resource, "read");

    const rows = await listResource(resource, request.nextUrl.searchParams);

    const pdf = await PDFDocument.create();
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    if (!rows.length) {
      const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

      drawPageHeader(page, bold, regular, resource, 1, 0, 0);
      page.drawText("No records available for export.", {
        x: MARGIN_LEFT,
        y: PAGE_HEIGHT - MARGIN_TOP - 80,
        size: 12,
        font: regular,
        color: VALUE_COLOR,
      });
    } else {
      for (let index = 0; index < rows.length; index += 1) {
        await addRecordPages(pdf, bold, regular, resource, rows[index] as Record<string, unknown>, index, rows.length);
      }
    }

    const output = await pdf.save();

    return new NextResponse(Buffer.from(output), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${resource}-report.pdf"`,
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
