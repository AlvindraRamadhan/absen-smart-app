/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback, useEffect } from "react";

export interface AttendanceRecord {
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: "present" | "late" | "absent";
}

export interface CheckInData {
  employeeId: string;
  employeeName: string;
  notes: string;
  location: { latitude: number; longitude: number; accuracy: number };
  photoUrl?: string;
}

export interface CheckOutData {
  employeeId: string;
  location: { latitude: number; longitude: number; accuracy: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UseRealAttendanceReturn {
  todayAttendance: AttendanceRecord | null;
  isLoading: boolean;
  error: string | null;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkIn: (data: CheckInData) => Promise<ApiResponse<AttendanceRecord>>;
  checkOut: (data: CheckOutData) => Promise<ApiResponse<AttendanceRecord>>;
  refreshAttendance: () => Promise<void>;
  clearError: () => void;
}

export function useRealAttendance(employeeId: string): UseRealAttendanceReturn {
  const [todayAttendance, setTodayAttendance] =
    useState<AttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Mulai dengan loading true
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const refreshAttendance = useCallback(async () => {
    if (!employeeId) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/attendance?employeeId=${employeeId}`);
      const result: ApiResponse<AttendanceRecord> = await response.json();

      if (response.ok && result.success) {
        setTodayAttendance(result.data || null);
      } else {
        throw new Error(result.error || "Gagal memuat status absensi.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Gagal terhubung ke server.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [employeeId]);

  const checkIn = useCallback(
    async (data: CheckInData): Promise<ApiResponse<AttendanceRecord>> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkIn", data }),
        });
        const result: ApiResponse<AttendanceRecord> = await response.json();
        if (response.ok && result.success) {
          await refreshAttendance();
          return result;
        } else {
          throw new Error(result.error || "Proses Check-in gagal.");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Proses Check-in gagal.";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAttendance]
  );

  const checkOut = useCallback(
    async (data: CheckOutData): Promise<ApiResponse<AttendanceRecord>> => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "checkOut", data }),
        });
        const result: ApiResponse<AttendanceRecord> = await response.json();
        if (response.ok && result.success) {
          await refreshAttendance();
          return result;
        } else {
          throw new Error(result.error || "Proses Check-out gagal.");
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Proses Check-out gagal.";
        setError(errorMessage);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [refreshAttendance]
  );

  const canCheckIn = !todayAttendance?.checkIn;
  const canCheckOut = !!(
    todayAttendance?.checkIn && !todayAttendance?.checkOut
  );

  useEffect(() => {
    if (employeeId) {
      refreshAttendance();
    }
  }, [employeeId, refreshAttendance]);

  return {
    todayAttendance,
    isLoading,
    error,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    refreshAttendance,
    clearError,
  };
}
