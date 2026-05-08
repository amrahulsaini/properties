import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource, ResourceError } from "@/lib/resources";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 20;
const TITLE_Y = PAGE_HEIGHT - 28;
const HEADER_HEIGHT = 24;
const ROW_MIN_HEIGHT = 18;
const ROW_LINE_HEIGHT = 10;
const HEADER_BG = rgb(0.95, 0.42, 0.11);
const BORDER_COLOR = rgb(0.88, 0.88, 0.88);
const ROW_BG = rgb(1, 1, 1);
const ALT_ROW_BG = rgb(0.98, 0.98, 0.98);
const TEXT_COLOR = rgb(0.16, 0.16, 0.16);
const MUTED_TEXT = rgb(0.45, 0.45, 0.45);
const HEADER_TEXT = rgb(1, 1, 1);

function titleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function formatValue(value: unknown): string {
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

function estimateColumnWidths(columns: string[], rows: Record<string, unknown>[], font: any) {
  const widths: Record<string, number> = {};

  for (const column of columns) {
    let width = font.widthOfTextAtSize(titleCase(column), 9) + 14;

    for (const row of rows) {
      const value = formatValue(row[column]);
      const lineWidth = font.widthOfTextAtSize(value, 8) + 10;
      if (lineWidth > width) {
        width = lineWidth;
      }
    }

    widths[column] = Math.min(Math.max(width, 70), 180);
  }

  return widths;
}

function chunkColumns(columns: string[], widths: Record<string, number>) {
  const maxContentWidth = PAGE_WIDTH - MARGIN * 2;
  const groups: string[][] = [];
  let currentGroup: string[] = [];
  let currentWidth = 0;

  for (const column of columns) {
    const width = widths[column];
    const nextWidth = currentGroup.length ? currentWidth + width : width;

    if (currentGroup.length && nextWidth > maxContentWidth) {
      groups.push(currentGroup);
      currentGroup = [column];
      currentWidth = width;
    } else {
      currentGroup.push(column);
      currentWidth = nextWidth;
    }
  }

  if (currentGroup.length) {
    groups.push(currentGroup);
  }

  return groups;
}

function drawTableHeader(
  page: any,
  bold: any,
  resource: string,
  groupColumns: string[],
  groupIndex: number,
  groupCount: number,
  rowStart: number,
  rowEnd: number,
  totalRows: number,
) {
  page.drawText(`${titleCase(resource)} Report`, {
    x: MARGIN,
    y: TITLE_Y,
    size: 13,
    font: bold,
    color: TEXT_COLOR,
  });

  page.drawText(`Columns ${groupIndex + 1} of ${groupCount}: ${groupColumns.map(titleCase).join(" | ")}`, {
    x: MARGIN,
    y: TITLE_Y - 14,
    size: 8,
    font: bold,
    color: MUTED_TEXT,
  });

  page.drawText(`Rows ${rowStart + 1}-${rowEnd} of ${totalRows}`, {
    x: PAGE_WIDTH - MARGIN - 150,
    y: TITLE_Y - 14,
    size: 8,
    font: bold,
    color: MUTED_TEXT,
    maxWidth: 150,
  });

  page.drawLine({
    start: { x: MARGIN, y: TITLE_Y - 20 },
    end: { x: PAGE_WIDTH - MARGIN, y: TITLE_Y - 20 },
    thickness: 1.2,
    color: HEADER_BG,
  });
}

function drawColumnHeaderRow(
  page: any,
  bold: any,
  groupColumns: string[],
  widths: Record<string, number>,
  topY: number,
) {
  let x = MARGIN;

  page.drawRectangle({
    x: MARGIN,
    y: topY - HEADER_HEIGHT,
    width: PAGE_WIDTH - MARGIN * 2,
    height: HEADER_HEIGHT,
    color: HEADER_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 0.75,
  });

  for (const column of groupColumns) {
    const width = widths[column];

    page.drawText(titleCase(column), {
      x: x + 4,
      y: topY - 16,
      size: 8.5,
      font: bold,
      color: HEADER_TEXT,
      maxWidth: width - 8,
    });

    page.drawLine({
      start: { x: x + width, y: topY },
      end: { x: x + width, y: topY - HEADER_HEIGHT },
      thickness: 0.5,
      color: BORDER_COLOR,
    });

    x += width;
  }
}

function drawRow(
  page: any,
  regular: any,
  groupColumns: string[],
  widths: Record<string, number>,
  row: Record<string, unknown>,
  yTop: number,
  rowIndex: number,
) {
  let rowHeight = ROW_MIN_HEIGHT;
  const wrappedValues: Record<string, string[]> = {};

  for (const column of groupColumns) {
    const value = formatValue(row[column]);
    const lines = wrapTextLines(value, regular, 8, widths[column] - 8);
    wrappedValues[column] = lines;
    rowHeight = Math.max(rowHeight, lines.length * ROW_LINE_HEIGHT + 6);
  }

  page.drawRectangle({
    x: MARGIN,
    y: yTop - rowHeight,
    width: PAGE_WIDTH - MARGIN * 2,
    height: rowHeight,
    color: rowIndex % 2 === 0 ? ROW_BG : ALT_ROW_BG,
    borderColor: BORDER_COLOR,
    borderWidth: 0.5,
  });

  let x = MARGIN;
  for (const column of groupColumns) {
    const width = widths[column];
    const lines = wrappedValues[column];
    const textY = yTop - 11;

    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: x + 4,
        y: textY - lineIndex * ROW_LINE_HEIGHT,
        size: 8,
        font: regular,
        color: TEXT_COLOR,
        maxWidth: width - 8,
      });
    });

    page.drawLine({
      start: { x: x + width, y: yTop },
      end: { x: x + width, y: yTop - rowHeight },
      thickness: 0.5,
      color: BORDER_COLOR,
    });

    x += width;
  }

  return rowHeight;
}

async function renderGroupedTablePages(
  pdf: PDFDocument,
  bold: any,
  regular: any,
  resource: string,
  rows: Record<string, unknown>[],
  columns: string[],
) {
  const widths = estimateColumnWidths(columns, rows, regular);
  const groups = chunkColumns(columns, widths);
  let pageNumber = 0;

  for (let groupIndex = 0; groupIndex < groups.length; groupIndex += 1) {
    const groupColumns = groups[groupIndex];
    const groupWidths: Record<string, number> = {};
    let groupWidth = 0;

    for (const column of groupColumns) {
      groupWidths[column] = widths[column];
      groupWidth += widths[column];
    }

    let rowStart = 0;
    while (rowStart < rows.length) {
      const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      pageNumber += 1;

      const availableTop = PAGE_HEIGHT - MARGIN - 34;
      const footerY = MARGIN + 8;
      let y = availableTop - HEADER_HEIGHT;
      let rowEnd = rowStart;

      while (rowEnd < rows.length) {
        const testPage = { drawRectangle: () => undefined };
        const rowHeight = Math.max(
          ROW_MIN_HEIGHT,
          ...groupColumns.map((column) => {
            const lines = wrapTextLines(formatValue(rows[rowEnd][column]), regular, 8, groupWidths[column] - 8);
            return lines.length * ROW_LINE_HEIGHT + 6;
          }),
        );

        if (rowEnd > rowStart && y - rowHeight < footerY + 6) {
          break;
        }

        y -= rowHeight;
        rowEnd += 1;
      }

      if (rowEnd === rowStart) {
        rowEnd = rowStart + 1;
      }

      drawTableHeader(
        page,
        bold,
        resource,
        groupColumns,
        groupIndex,
        groups.length,
        rowStart,
        rowEnd,
        rows.length,
      );

      drawColumnHeaderRow(page, bold, groupColumns, groupWidths, availableTop - 8);

      let currentY = availableTop - HEADER_HEIGHT - 10;
      for (let index = rowStart; index < rowEnd; index += 1) {
        const rowHeight = drawRow(page, regular, groupColumns, groupWidths, rows[index], currentY, index);
        currentY -= rowHeight;
      }

      page.drawText(`Page ${pageNumber}`, {
        x: MARGIN,
        y: 14,
        size: 7.5,
        font: regular,
        color: MUTED_TEXT,
      });

      rowStart = rowEnd;
    }
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
      page.drawText("No records available for export.", {
        x: MARGIN,
        y: TITLE_Y,
        size: 12,
        font: regular,
        color: TEXT_COLOR,
      });
    } else {
      const columns = Object.keys(rows[0] as Record<string, unknown>).filter(
        (key) => !key.startsWith("_"),
      );

      await renderGroupedTablePages(
        pdf,
        bold,
        regular,
        resource,
        rows as Record<string, unknown>[],
        columns,
      );
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
