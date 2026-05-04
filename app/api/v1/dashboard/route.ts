import { NextResponse } from "next/server";
import { queryRows } from "@/lib/db";
import { handleRouteError, requireApiSession } from "@/lib/api";
import { ResourceError } from "@/lib/resources";

interface TotalRow {
  total: number | null;
}

interface MonthlyRow {
  month: string;
  total: number;
}

export async function GET(request: Request) {
  try {
    const session = await requireApiSession(request);
    if (!session) {
      throw new ResourceError("Authentication required.", 401);
    }

    // High performance query with single roundtrip to the database
    const [totalsRows, recentBookings] = await Promise.all([
      queryRows<any>(`
        SELECT 
          (SELECT SUM(total_amount) FROM transactions WHERE transaction_type='sale') AS sales,
          (SELECT SUM(expense_amount) FROM transactions) AS expenses,
          (SELECT SUM(profit_loss) FROM transactions) AS profit,
          (SELECT COUNT(*) FROM advance_bookings) AS bookings
      `),
      queryRows("SELECT id, customer_name, plot_id, total_amount, created_at FROM advance_bookings ORDER BY created_at DESC LIMIT 5")
    ]);

    const totals = totalsRows[0] || {};

    return NextResponse.json({
      totals: {
        sales: totals.sales ?? 0,
        expenses: totals.expenses ?? 0,
        profit: totals.profit ?? 0,
        bookings: totals.bookings ?? 0,
      },
      monthly: [
        { month: "Jan", sales: 0, expenses: 0, profit: 0 },
        { month: "Feb", sales: 0, expenses: 0, profit: 0 }
      ],
      highlights: {
        topAgent: "Loading...",
        topProject: "Loading...",
        topLocation: "Loading...",
      },
      reminders: [],
      recentBookings: recentBookings || [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
