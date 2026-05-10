import { NextResponse } from "next/server";
import { queryRows } from "@/lib/db";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    const currentYear = new Date().getFullYear();

    const [totalsRows, monthlyRows, recentBookings] = await Promise.all([
      queryRows<any>(`
        SELECT
          (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM advance_bookings
          ) +
          (
            SELECT COALESCE(SUM(total_amount), 0)
            FROM advance_agreements
          ) AS sales,
          (
            SELECT COALESCE(SUM(amount), 0)
            FROM development_entries
          ) AS expenses,
          (
            SELECT COUNT(*)
            FROM advance_bookings
          ) AS bookings
      `),
      queryRows<any>(`
        SELECT
          m.month_num,
          COALESCE(ab.sales, 0) + COALESCE(aa.sales, 0) AS sales,
          COALESCE(de.expenses, 0) AS expenses
        FROM (
          SELECT 1 AS month_num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4
          UNION SELECT 5 UNION SELECT 6 UNION SELECT 7 UNION SELECT 8
          UNION SELECT 9 UNION SELECT 10 UNION SELECT 11 UNION SELECT 12
        ) m
        LEFT JOIN (
          SELECT MONTH(created_at) AS month_num, SUM(total_amount) AS sales
          FROM advance_bookings
          WHERE YEAR(created_at) = ?
          GROUP BY MONTH(created_at)
        ) ab ON ab.month_num = m.month_num
        LEFT JOIN (
          SELECT MONTH(created_at) AS month_num, SUM(total_amount) AS sales
          FROM advance_agreements
          WHERE YEAR(created_at) = ?
          GROUP BY MONTH(created_at)
        ) aa ON aa.month_num = m.month_num
        LEFT JOIN (
          SELECT MONTH(created_at) AS month_num, SUM(amount) AS expenses
          FROM development_entries
          WHERE YEAR(created_at) = ?
          GROUP BY MONTH(created_at)
        ) de ON de.month_num = m.month_num
        WHERE m.month_num <= MONTH(NOW())
        ORDER BY m.month_num ASC
      `, [currentYear, currentYear, currentYear]),
      queryRows<any>(`
        SELECT
          id,
          customer_name,
          village,
          advance_amount,
          remaining_amount
        FROM advance_bookings
        ORDER BY created_at DESC
        LIMIT 5
      `),
    ]);

    const totals = totalsRows[0] || {};
    const totalSales = Number(totals.sales ?? 0);
    const totalExpenses = Number(totals.expenses ?? 0);

    const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const monthly = (monthlyRows || []).map((row: any) => {
      const sales = Number(row.sales ?? 0);
      const expenses = Number(row.expenses ?? 0);
      return {
        month: MONTH_NAMES[(Number(row.month_num) - 1)] ?? String(row.month_num),
        sales,
        expenses,
        profit: sales - expenses,
      };
    });

    return NextResponse.json({
      totals: {
        sales: totalSales,
        expenses: totalExpenses,
        profit: totalSales - totalExpenses,
        bookings: Number(totals.bookings ?? 0),
      },
      monthly,
      highlights: {
        topAgent: null,
        topProject: null,
        topLocation: null,
      },
      reminders: [],
      recentBookings: recentBookings || [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
