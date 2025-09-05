/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { sheets_v4 } from "googleapis";

// --- INTERFACES ---
interface AttendanceData {
  employeeId: string;
  employeeName: string;
  notes: string;
  location: { latitude: number; longitude: number; accuracy: number };
  photoUrl?: string;
}

interface CheckOutData {
  employeeId: string;
  location: { latitude: number; longitude: number; accuracy: number };
}

// --- FUNGSI UTAMA GOOGLE SHEETS ---

function getGoogleSheetsClient(): sheets_v4.Sheets {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
    key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

async function initializeHeaders(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string
) {
  const headers = [
    "Employee ID",
    "Employee Name",
    "Date",
    "Check In Time",
    "Check Out Time",
    "Latitude",
    "Longitude",
    "GPS Accuracy (m)",
    "Distance from Office (m)",
    "Status",
    "Notes",
    "Photo URL",
    "Device Info",
    "Created At",
  ];
  try {
    const existingData = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Attendance!A1:N1",
    });
    if (!existingData.data.values || existingData.data.values.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "Attendance!A1:N1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
      console.log("Headers initialized in Google Sheets");
    }
  } catch (error) {
    console.error("Error initializing headers:", error);
    throw error;
  }
}

async function getTodayAttendance(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  employeeId: string
) {
  const today = new Date().toISOString().split("T")[0];
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Attendance!A:N",
    });
    const rows = response.data.values || [];
    for (let i = rows.length - 1; i >= 1; i--) {
      const row = rows[i];
      if (row[0] === employeeId && row[2] === today) {
        return {
          rowIndex: i + 1,
          employeeId: row[0],
          employeeName: row[1],
          date: row[2],
          checkIn: row[3],
          checkOut: row[4],
          status: row[9],
          notes: row[10],
          photoUrl: row[11],
        };
      }
    }
    return null;
  } catch (error) {
    console.error("Error in getTodayAttendance:", error);
    throw new Error("Gagal mengambil data absensi hari ini.");
  }
}

// --- API ROUTE HANDLERS (GET & POST) ---

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const employeeId = searchParams.get("employeeId");
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error("Google Sheets configuration missing");
    }

    const sheets = getGoogleSheetsClient();
    await initializeHeaders(sheets, spreadsheetId);

    // Jika ada employeeId, ambil data hari ini untuk employee tersebut
    if (employeeId) {
      const record = await getTodayAttendance(
        sheets,
        spreadsheetId,
        employeeId
      );
      return NextResponse.json({ success: true, data: record });
    }

    // **BAGIAN BARU:** Jika tidak ada employeeId, ambil semua data untuk dashboard
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "Attendance!A2:N", // Ambil semua baris dari baris kedua
    });

    const rows = response.data.values || [];
    const allRecords = rows
      .map((row) => ({
        employeeId: row[0],
        employeeName: row[1],
        date: row[2],
        checkIn: row[3],
        checkOut: row[4],
        status: row[9],
      }))
      .filter((rec) => rec.date); // Filter data yang tidak punya tanggal

    return NextResponse.json({ success: true, data: allRecords });
  } catch (error: any) {
    console.error("API GET Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data } = body;
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    if (!spreadsheetId) throw new Error("Google Sheets configuration missing");

    const sheets = getGoogleSheetsClient();
    await initializeHeaders(sheets, spreadsheetId);

    let result;
    switch (action) {
      case "checkIn":
        result = await handleCheckIn(sheets, spreadsheetId, data, request);
        break;
      case "checkOut":
        result = await handleCheckOut(sheets, spreadsheetId, data);
        break;
      default:
        throw new Error("Invalid action");
    }
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API POST Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// ... (Sisa fungsi handleCheckIn, handleCheckOut, calculateDistance tetap sama)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function handleCheckIn(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  data: AttendanceData,
  request: NextRequest
) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const createdAt = now.toISOString();
  const workStart = new Date();
  workStart.setHours(8, 0, 0, 0);
  const status = now > workStart ? "late" : "present";
  const userAgent = request.headers.get("user-agent") || "Unknown";
  const campusLat = -7.8003;
  const campusLng = 110.3752;
  const distance = calculateDistance(
    data.location.latitude,
    data.location.longitude,
    campusLat,
    campusLng
  );

  const existingRecord = await getTodayAttendance(
    sheets,
    spreadsheetId,
    data.employeeId
  );
  if (existingRecord && existingRecord.checkIn) {
    throw new Error("Anda sudah melakukan check-in hari ini");
  }

  const rowData = [
    data.employeeId,
    data.employeeName,
    today,
    currentTime,
    "",
    data.location.latitude,
    data.location.longitude,
    data.location.accuracy,
    Math.round(distance),
    status,
    data.notes || "",
    data.photoUrl || "",
    userAgent.substring(0, 150),
    createdAt,
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: "Attendance!A:N",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [rowData] },
  });

  return { success: true, data: { checkIn: currentTime, status } };
}

async function handleCheckOut(
  sheets: sheets_v4.Sheets,
  spreadsheetId: string,
  data: CheckOutData
) {
  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const existingRecord = await getTodayAttendance(
    sheets,
    spreadsheetId,
    data.employeeId
  );
  if (!existingRecord)
    throw new Error("Tidak ada data check-in untuk hari ini.");
  if (existingRecord.checkOut)
    throw new Error("Anda sudah melakukan check-out hari ini.");

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `Attendance!E${existingRecord.rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[currentTime]] },
  });

  return { success: true, data: { checkOut: currentTime } };
}
