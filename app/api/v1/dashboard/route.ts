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

    // High performance query with single roundtrip to the database
    const [totalsRows, recentBookings] = await Promise.all([
      queryRows<any>(`
        SELECT 
          (SELECT SUM(amount) FROM development_entries) AS expenses,
          (SELECT COUNT(*) FROM document_folders) AS bookings
      `),
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
      `)
    ]);

    const totals = totalsRows[0] || {};

    return NextResponse.json({
      totals: {
        sales: 0, 
        expenses: totals.expenses ?? 0,
        profit: (0 - (totals.expenses ?? 0)),
        bookings: totals.bookings ?? 0,
      },
      monthly: [
        { month: "Jan", sales: 0, expenses: 0, profit: 0 },
        { month: "Feb", sales: 0, expenses: 0, profit: 0 },
        { month: "Mar", sales: 0, expenses: 0, profit: 0 },
        { month: "Apr", sales: 0, expenses: 0, profit: 0 },
      ],
      highlights: {
        topAgent: "Ajay",
        topProject: "City Center",
        topLocation: "Khandwa",
      },
      reminders: [],
      recentBookings: recentBookings || [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
