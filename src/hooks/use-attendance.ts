import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  googleSheetsService,
  AttendanceRecord,
  GoogleSheetsResponse,
} from "@/lib/google-sheets";
import { LocationData } from "./use-geolocation";

export interface AttendanceFormData {
  employeeId: string;
  employeeName: string;
  notes?: string;
  photoUrl?: string;
}

export interface AttendanceStats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalDays: number;
  streak: number;
  averageCheckInTime: string;
}

export interface UseAttendanceOptions {
  employeeId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseAttendanceReturn {
  // State
  todayAttendance: AttendanceRecord | null;
  allRecords: AttendanceRecord[];
  isLoading: boolean;
  error: string | null;
  stats: AttendanceStats | null;

  // Actions
  checkIn: (
    data: AttendanceFormData,
    location: LocationData
  ) => Promise<GoogleSheetsResponse<AttendanceRecord>>;
  checkOut: (
    checkOutTime?: string
  ) => Promise<GoogleSheetsResponse<AttendanceRecord>>;
  refreshAttendance: () => Promise<void>;
  getAttendanceByDate: (date: string) => AttendanceRecord | null;

  // Status helpers
  canCheckIn: boolean;
  canCheckOut: boolean;
  isWorkingHours: boolean;
  isLate: boolean;
}

/**
 * Custom hook for attendance management
 */
export function useAttendance(
  options: UseAttendanceOptions = {}
): UseAttendanceReturn {
  const {
    employeeId,
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
  } = options;

  // State
  const [todayAttendance, setTodayAttendance] =
    useState<AttendanceRecord | null>(null);
  const [allRecords, setAllRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  // Working hours configuration with useMemo to prevent re-creation
  const workingHours = useMemo(
    () => ({
      start: process.env.NEXT_PUBLIC_WORK_START_TIME || "09:00",
      end: process.env.NEXT_PUBLIC_WORK_END_TIME || "17:00",
      lateThreshold: process.env.NEXT_PUBLIC_LATE_THRESHOLD_TIME || "09:15",
    }),
    []
  );

  // Get current date in YYYY-MM-DD format
  const getCurrentDate = useCallback((): string => {
    return new Date().toISOString().split("T")[0];
  }, []);

  // Get current time in HH:MM format
  const getCurrentTime = useCallback((): string => {
    return new Date().toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Check if current time is within working hours
  const isWorkingHours = useCallback((): boolean => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return currentTime >= workingHours.start && currentTime <= workingHours.end;
  }, [workingHours]);

  // Check if current time is past late threshold
  const isLate = useCallback((): boolean => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return (
      currentTime > workingHours.lateThreshold &&
      currentTime <= workingHours.end
    );
  }, [workingHours]);

  // Calculate attendance statistics
  const calculateStats = useCallback(
    (records: AttendanceRecord[]): AttendanceStats => {
      const totalDays = records.length;
      const totalPresent = records.filter((r) => r.status === "present").length;
      const totalLate = records.filter((r) => r.status === "late").length;
      const totalAbsent = records.filter((r) => r.status === "absent").length;

      // Calculate streak (consecutive days present)
      let streak = 0;
      const sortedRecords = [...records]
        .filter((r) => r.status === "present" || r.status === "late")
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      for (const record of sortedRecords) {
        if (record.status === "present" || record.status === "late") {
          streak++;
        } else {
          break;
        }
      }

      // Calculate average check-in time
      const checkInTimes = records
        .filter((r) => r.checkIn)
        .map((r) => {
          const [hours, minutes] = r.checkIn.split(":").map(Number);
          return hours * 60 + minutes; // Convert to minutes
        });

      const avgMinutes =
        checkInTimes.length > 0
          ? Math.round(
              checkInTimes.reduce((sum, time) => sum + time, 0) /
                checkInTimes.length
            )
          : 0;

      const avgHours = Math.floor(avgMinutes / 60);
      const avgMins = avgMinutes % 60;
      const averageCheckInTime = `${avgHours
        .toString()
        .padStart(2, "0")}:${avgMins.toString().padStart(2, "0")}`;

      return {
        totalPresent,
        totalLate,
        totalAbsent,
        totalDays,
        streak,
        averageCheckInTime,
      };
    },
    []
  );

  // Get attendance record by date
  const getAttendanceByDate = useCallback(
    (date: string): AttendanceRecord | null => {
      return allRecords.find((record) => record.date === date) || null;
    },
    [allRecords]
  );

  // Refresh attendance data
  const refreshAttendance = useCallback(async (): Promise<void> => {
    if (!employeeId || !isMountedRef.current) return;

    setIsLoading(true);
    setError(null);

    try {
      // Get all records for the employee
      const allRecordsResponse =
        await googleSheetsService.getAttendanceRecords();

      if (allRecordsResponse.success && allRecordsResponse.data) {
        const employeeRecords = allRecordsResponse.data.filter(
          (record) => record.employeeId === employeeId
        );

        if (isMountedRef.current) {
          setAllRecords(employeeRecords);

          // Get today's record
          const today = getCurrentDate();
          const todayRecord = employeeRecords.find(
            (record) => record.date === today
          );
          setTodayAttendance(todayRecord || null);

          // Calculate stats
          const calculatedStats = calculateStats(employeeRecords);
          setStats(calculatedStats);
        }
      } else {
        throw new Error(
          allRecordsResponse.error || "Failed to fetch attendance records"
        );
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to refresh attendance data"
        );
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [employeeId, getCurrentDate, calculateStats]);

  // Check in function
  const checkIn = useCallback(
    async (
      data: AttendanceFormData,
      location: LocationData
    ): Promise<GoogleSheetsResponse<AttendanceRecord>> => {
      if (!employeeId) {
        return {
          success: false,
          error: "Employee ID is required",
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const today = getCurrentDate();
        const currentTime = getCurrentTime();

        const response = await googleSheetsService.createAttendanceRecord({
          employeeId,
          employeeName: data.employeeName,
          date: today,
          checkIn: currentTime,
          locationLat: location.latitude,
          locationLng: location.longitude,
          notes: data.notes,
          photoUrl: data.photoUrl,
        });

        if (response.success && response.data && isMountedRef.current) {
          setTodayAttendance(response.data);
          // Refresh all data to update stats
          await refreshAttendance();
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check in";
        if (isMountedRef.current) {
          setError(errorMessage);
        }
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [employeeId, getCurrentDate, getCurrentTime, refreshAttendance]
  );

  // Check out function
  const checkOut = useCallback(
    async (
      checkOutTime?: string
    ): Promise<GoogleSheetsResponse<AttendanceRecord>> => {
      if (!todayAttendance?.id) {
        return {
          success: false,
          error: "No check-in record found for today",
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const currentTime = checkOutTime || getCurrentTime();

        const response = await googleSheetsService.updateAttendanceCheckOut(
          todayAttendance.id,
          currentTime
        );

        if (response.success && response.data && isMountedRef.current) {
          setTodayAttendance(response.data);
          // Refresh all data to update stats
          await refreshAttendance();
        }

        return response;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to check out";
        if (isMountedRef.current) {
          setError(errorMessage);
        }
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        if (isMountedRef.current) {
          setIsLoading(false);
        }
      }
    },
    [todayAttendance, getCurrentTime, refreshAttendance]
  );

  // Status helpers
  const canCheckIn = !todayAttendance && isWorkingHours();
  const canCheckOut = Boolean(
    todayAttendance?.checkIn && !todayAttendance?.checkOut
  );

  // Auto refresh setup
  useEffect(() => {
    if (autoRefresh && employeeId) {
      refreshIntervalRef.current = setInterval(() => {
        refreshAttendance();
      }, refreshInterval);

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [autoRefresh, employeeId, refreshInterval, refreshAttendance]);

  // Initial data load
  useEffect(() => {
    if (employeeId) {
      refreshAttendance();
    }
  }, [employeeId, refreshAttendance]);

  // Cleanup
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  return {
    // State
    todayAttendance,
    allRecords,
    isLoading,
    error,
    stats,

    // Actions
    checkIn,
    checkOut,
    refreshAttendance,
    getAttendanceByDate,

    // Status helpers
    canCheckIn,
    canCheckOut,
    isWorkingHours: isWorkingHours(),
    isLate: isLate(),
  };
}
