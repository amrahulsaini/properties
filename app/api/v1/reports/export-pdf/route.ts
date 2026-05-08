import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { assertResourceAccess, listResource, ResourceError } from "@/lib/resources";

const PAGE_WIDTH = 842;
const PAGE_HEIGHT = 595;
const MARGIN = 20;
const HEADER_HEIGHT = 30;
const ROW_HEIGHT = 18;
const HEADER_COLOR = rgb(0.15, 0.15, 0.15);
const HEADER_BG = rgb(0.95, 0.42, 0.11);
const ROW_BG = rgb(1, 1, 1);
const BORDER_COLOR = rgb(0.9, 0.9, 0.9);
const TEXT_COLOR = rgb(0.2, 0.2, 0.2);

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

function getColumnWidths(
  columns: string[],
  rows: Record<string, unknown>[],
  font: any,
  fontSize: number,
  maxWidth: number,
) {
  const widths: Record<string, number> = {};
  const minColWidth = 60;
  const maxColWidth = 200;

  for (const col of columns) {
    let width = font.widthOfTextAtSize(titleCase(col), fontSize) + 16;

    for (const row of rows) {
      const val = formatValue(row[col]);
      const textWidth = font.widthOfTextAtSize(val, fontSize - 1) + 12;
      width = Math.max(width, textWidth);
    }

    widths[col] = Math.min(maxColWidth, Math.max(minColWidth, width));
  }

  const totalWidth = Object.values(widths).reduce((a, b) => a + b, 0);
  const scaleFactor = Math.min(1, maxWidth / totalWidth);

  for (const col in widths) {
    widths[col] *= scaleFactor;
  }

  return widths;
}

async function addTablePage(
  pdf: PDFDocument,
  bold: any,
  regular: any,
  resource: string,
  columns: string[],
  columnWidths: Record<string, number>,
  rows: Record<string, unknown>[],
  startRowIndex: number,
  pageIndex: number,
  totalPages: number,
  totalRows: number,
): Promise<number> {
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN - 20;

  page.drawText(`${titleCase(resource)} Report - Page ${pageIndex + 1}/${totalPages}`, {
    x: MARGIN,
    y,
    size: 12,
    font: bold,
    color: rgb(0.15, 0.15, 0.15),
  });

  y -= 25;

  let x = MARGIN;
  const headerY = y;
  page.drawRectangle({
    x: MARGIN,
    y: headerY - HEADER_HEIGHT,
    width: PAGE_WIDTH - 2 * MARGIN,
    height: HEADER_HEIGHT,
    color: HEADER_BG,
  });

  for (const col of columns) {
    const colWidth = columnWidths[col];
    page.drawText(titleCase(col), {
      x: x + 4,
      y: headerY - 20,
      size: 9,
      font: bold,
      color: rgb(1, 1, 1),
      maxWidth: colWidth - 8,
    });

    page.drawLine({
      start: { x: x + colWidth, y: headerY },
      end: { x: x + colWidth, y: headerY - HEADER_HEIGHT },
      thickness: 0.5,
      color: BORDER_COLOR,
    });

    x += colWidth;
  }

  y = headerY - HEADER_HEIGHT - 2;
  let rowIndex = startRowIndex;

  for (const row of rows) {
    const rowTextHeight = ROW_HEIGHT;

    if (y - rowTextHeight < MARGIN) {
      break;
    }

    page.drawRectangle({
      x: MARGIN,
      y: y - rowTextHeight,
      width: PAGE_WIDTH - 2 * MARGIN,
      height: rowTextHeight,
      color: rowIndex % 2 === 0 ? rgb(0.98, 0.98, 0.98) : ROW_BG,
    });

    x = MARGIN;
    for (const col of columns) {
      const colWidth = columnWidths[col];
      const value = formatValue(row[col]);

      page.drawText(value, {
        x: x + 4,
        y: y - 14,
        size: 8,
        font: regular,
        color: TEXT_COLOR,
        maxWidth: colWidth - 8,
      });

      page.drawLine({
        start: { x: x + colWidth, y },
        end: { x: x + colWidth, y: y - rowTextHeight },
        thickness: 0.5,
        color: BORDER_COLOR,
      });

      x += colWidth;
    }

    page.drawLine({
      start: { x: MARGIN, y: y - rowTextHeight },
      end: { x: PAGE_WIDTH - MARGIN, y: y - rowTextHeight },
      thickness: 0.5,
      color: BORDER_COLOR,
    });

    y -= rowTextHeight;
    rowIndex++;
  }

  page.drawText(
    `Showing rows ${startRowIndex + 1}-${Math.min(rowIndex, totalRows)} of ${totalRows}`,
    {
      x: MARGIN,
      y: MARGIN - 5,
      size: 7,
      font: regular,
      color: rgb(0.6, 0.6, 0.6),
    },
  );

  return rowIndex;
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
        y: PAGE_HEIGHT - MARGIN,
        size: 12,
        font: regular,
        color: TEXT_COLOR,
      });
    } else {
      const columns = Object.keys(rows[0] as Record<string, unknown>).filter(
        (key) => !key.startsWith("_"),
      );

      const contentWidth = PAGE_WIDTH - 2 * MARGIN;
      const columnWidths = getColumnWidths(columns, rows, regular, 9, contentWidth);

      const rowsPerPage = Math.floor((PAGE_HEIGHT - 100) / ROW_HEIGHT);
      const totalPages = Math.ceil(rows.length / rowsPerPage);

      let rowIndex = 0;
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const pageRows = rows.slice(
          pageIndex * rowsPerPage,
          (pageIndex + 1) * rowsPerPage,
        ) as Record<string, unknown>[];

        rowIndex = await addTablePage(
          pdf,
          bold,
          regular,
          resource,
          columns,
          columnWidths,
          pageRows,
          pageIndex * rowsPerPage,
          pageIndex,
          totalPages,
          rows.length,
        );
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
