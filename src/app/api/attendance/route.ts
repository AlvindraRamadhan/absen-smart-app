import { NextRequest, NextResponse } from "next/server";
import { googleSheetsService } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;

    switch (action) {
      case "checkIn":
        const result = await googleSheetsService.createAttendanceRecord(data);
        return NextResponse.json(result);

      case "checkOut":
        const checkOutResult =
          await googleSheetsService.updateAttendanceCheckOut(
            data.id,
            data.checkOut
          );
        return NextResponse.json(checkOutResult);

      case "getToday":
        const todayResult =
          await googleSheetsService.getAttendanceByEmployeeAndDate(
            data.employeeId,
            data.date
          );
        return NextResponse.json(todayResult);

      default:
        return NextResponse.json({ success: false, error: "Invalid action" });
    }
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Internal server error",
    });
  }
}

export async function GET() {
  try {
    const records = await googleSheetsService.getAttendanceRecords();
    return NextResponse.json(records);
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch attendance records",
    });
  }
}
