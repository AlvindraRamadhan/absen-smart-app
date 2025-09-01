import { google } from "googleapis";
import { format } from "date-fns";

// Types for attendance data
export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  distance: number;
  status: "present" | "late" | "absent";
  notes?: string;
  photoUrl?: string;
  deviceInfo?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  worksheetName: string;
  serviceAccount: {
    client_email: string;
    private_key: string;
  };
}

class GoogleSheetsService {
  private sheets: any;
  private auth: any;
  private config: GoogleSheetsConfig;

  constructor(config: GoogleSheetsConfig) {
    this.config = config;
    this.initializeAuth();
  }

  private initializeAuth() {
    this.auth = new google.auth.JWT(
      this.config.serviceAccount.client_email,
      undefined,
      this.config.serviceAccount.private_key.replace(/\\n/g, "\n"),
      ["https://www.googleapis.com/auth/spreadsheets"]
    );

    this.sheets = google.sheets({ version: "v4", auth: this.auth });
  }

  // Test connection to Google Sheets
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.sheets.spreadsheets.get({
        spreadsheetId: this.config.spreadsheetId,
      });

      return {
        success: true,
        message: `Connected to: ${response.data.properties.title}`,
      };
    } catch (error) {
      console.error("Google Sheets connection error:", error);
      return {
        success: false,
        message: `Connection failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Initialize headers if sheet is empty
  async initializeHeaders(): Promise<void> {
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
      // Check if headers exist
      const existingData = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A1:N1`,
      });

      if (!existingData.data.values || existingData.data.values.length === 0) {
        // Add headers
        await this.sheets.spreadsheets.values.update({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.worksheetName}!A1:N1`,
          valueInputOption: "RAW",
          requestBody: {
            values: [headers],
          },
        });
        console.log("Headers initialized in Google Sheets");
      }
    } catch (error) {
      console.error("Error initializing headers:", error);
      throw error;
    }
  }

  // Get existing attendance record for today
  async getTodayAttendance(
    employeeId: string
  ): Promise<AttendanceRecord | null> {
    const today = format(new Date(), "yyyy-MM-dd");

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A:N`,
      });

      const rows = response.data.values || [];

      // Skip header row and find today's record
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === employeeId && row[2] === today) {
          return {
            employeeId: row[0],
            employeeName: row[1],
            date: row[2],
            checkInTime: row[3],
            checkOutTime: row[4],
            location: {
              latitude: parseFloat(row[5]) || 0,
              longitude: parseFloat(row[6]) || 0,
              accuracy: parseFloat(row[7]) || 0,
            },
            distance: parseFloat(row[8]) || 0,
            status: row[9] as "present" | "late" | "absent",
            notes: row[10],
            photoUrl: row[11],
            deviceInfo: row[12],
          };
        }
      }

      return null;
    } catch (error) {
      console.error("Error getting today attendance:", error);
      throw error;
    }
  }

  // Record check-in
  async recordCheckIn(data: {
    employeeId: string;
    employeeName: string;
    location: { latitude: number; longitude: number; accuracy: number };
    distance: number;
    notes?: string;
    photoUrl?: string;
  }): Promise<{ success: boolean; message: string; rowId?: number }> {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm:ss");
    const createdAt = format(now, "yyyy-MM-dd HH:mm:ss");

    // Determine status based on time and company policy
    const workStart = new Date();
    workStart.setHours(8, 0, 0, 0); // 08:00 AM
    const isLate = now > workStart;
    const status = isLate ? "late" : "present";

    const deviceInfo =
      typeof navigator !== "undefined"
        ? `${navigator.userAgent.substring(0, 100)}...`
        : "Unknown";

    try {
      // Initialize headers if needed
      await this.initializeHeaders();

      // Check if employee already checked in today
      const existingRecord = await this.getTodayAttendance(data.employeeId);

      if (existingRecord && existingRecord.checkInTime) {
        return {
          success: false,
          message: "Anda sudah melakukan check-in hari ini",
        };
      }

      const rowData = [
        data.employeeId,
        data.employeeName,
        today,
        currentTime, // Check In Time
        "", // Check Out Time (empty)
        data.location.latitude,
        data.location.longitude,
        data.location.accuracy,
        data.distance,
        status,
        data.notes || "",
        data.photoUrl || "",
        deviceInfo,
        createdAt,
      ];

      if (existingRecord) {
        // Update existing row
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.worksheetName}!A:A`,
        });

        const rows = response.data.values || [];
        let rowIndex = -1;

        for (let i = 1; i < rows.length; i++) {
          if (rows[i][0] === data.employeeId) {
            // Check if this row has today's date
            const dateResponse = await this.sheets.spreadsheets.values.get({
              spreadsheetId: this.config.spreadsheetId,
              range: `${this.config.worksheetName}!C${i + 1}`,
            });

            if (
              dateResponse.data.values &&
              dateResponse.data.values[0][0] === today
            ) {
              rowIndex = i + 1;
              break;
            }
          }
        }

        if (rowIndex > 0) {
          await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.config.spreadsheetId,
            range: `${this.config.worksheetName}!A${rowIndex}:N${rowIndex}`,
            valueInputOption: "RAW",
            requestBody: {
              values: [rowData],
            },
          });
        }
      } else {
        // Append new row
        await this.sheets.spreadsheets.values.append({
          spreadsheetId: this.config.spreadsheetId,
          range: `${this.config.worksheetName}!A:N`,
          valueInputOption: "RAW",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [rowData],
          },
        });
      }

      return {
        success: true,
        message: `Check-in berhasil pada ${currentTime}`,
      };
    } catch (error) {
      console.error("Error recording check-in:", error);
      return {
        success: false,
        message: `Check-in gagal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Record check-out
  async recordCheckOut(data: {
    employeeId: string;
    location: { latitude: number; longitude: number; accuracy: number };
    distance: number;
    notes?: string;
  }): Promise<{ success: boolean; message: string }> {
    const now = new Date();
    const today = format(now, "yyyy-MM-dd");
    const currentTime = format(now, "HH:mm:ss");

    try {
      // Find today's record
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A:N`,
      });

      const rows = response.data.values || [];
      let rowIndex = -1;

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row[0] === data.employeeId && row[2] === today) {
          rowIndex = i + 1;
          break;
        }
      }

      if (rowIndex === -1) {
        return {
          success: false,
          message: "Tidak ada record check-in untuk hari ini",
        };
      }

      if (rows[rowIndex - 1][4]) {
        // Check if already checked out
        return {
          success: false,
          message: "Anda sudah melakukan check-out hari ini",
        };
      }

      // Update check-out time
      await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!E${rowIndex}`,
        valueInputOption: "RAW",
        requestBody: {
          values: [[currentTime]],
        },
      });

      return {
        success: true,
        message: `Check-out berhasil pada ${currentTime}`,
      };
    } catch (error) {
      console.error("Error recording check-out:", error);
      return {
        success: false,
        message: `Check-out gagal: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      };
    }
  }

  // Get attendance history
  async getAttendanceHistory(
    employeeId?: string,
    startDate?: string,
    endDate?: string,
    limit = 50
  ): Promise<AttendanceRecord[]> {
    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.spreadsheetId,
        range: `${this.config.worksheetName}!A:N`,
      });

      const rows = response.data.values || [];
      const records: AttendanceRecord[] = [];

      // Skip header row
      for (let i = 1; i < rows.length && records.length < limit; i++) {
        const row = rows[i];

        // Filter by employee ID if provided
        if (employeeId && row[0] !== employeeId) continue;

        // Filter by date range if provided
        if (startDate && row[2] < startDate) continue;
        if (endDate && row[2] > endDate) continue;

        records.push({
          employeeId: row[0],
          employeeName: row[1],
          date: row[2],
          checkInTime: row[3],
          checkOutTime: row[4],
          location: {
            latitude: parseFloat(row[5]) || 0,
            longitude: parseFloat(row[6]) || 0,
            accuracy: parseFloat(row[7]) || 0,
          },
          distance: parseFloat(row[8]) || 0,
          status: row[9] as "present" | "late" | "absent",
          notes: row[10],
          photoUrl: row[11],
          deviceInfo: row[12],
        });
      }

      return records.reverse(); // Most recent first
    } catch (error) {
      console.error("Error getting attendance history:", error);
      throw error;
    }
  }
}

// Export singleton instance
let googleSheetsService: GoogleSheetsService | null = null;

export const getGoogleSheetsService = (): GoogleSheetsService => {
  if (!googleSheetsService) {
    const config: GoogleSheetsConfig = {
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID || "",
      worksheetName: "Attendance",
      serviceAccount: {
        client_email:
          process.env.NEXT_PUBLIC_GOOGLE_SERVICE_ACCOUNT_EMAIL || "",
        private_key: process.env.NEXT_PUBLIC_GOOGLE_PRIVATE_KEY || "",
      },
    };

    googleSheetsService = new GoogleSheetsService(config);
  }

  return googleSheetsService;
};

export default GoogleSheetsService;
