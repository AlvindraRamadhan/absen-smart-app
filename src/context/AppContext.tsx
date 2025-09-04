/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import {
  useRealAttendance,
  type AttendanceRecord,
  type CheckInData,
  type CheckOutData,
  type ApiResponse,
} from "@/hooks/useRealAttendance";
import { useOfflineSync } from "@/hooks/useOfflineSync";

interface AppContextState {
  user: { id: string; name: string } | null;
  todayAttendance: AttendanceRecord | null;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  queueLength: number;
  canCheckIn: boolean;
  canCheckOut: boolean;
  checkIn: (data: CheckInData) => Promise<ApiResponse<AttendanceRecord>>;
  checkOut: (data: CheckOutData) => Promise<ApiResponse<AttendanceRecord>>;
  refreshAttendance: () => Promise<void>;
}

const AppContext = createContext<AppContextState>({
  user: null,
  todayAttendance: null,
  isLoading: true,
  error: null,
  isOnline: true,
  queueLength: 0,
  canCheckIn: false,
  canCheckOut: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkIn: async (_data: CheckInData) => ({
    success: false,
    error: "Provider not ready",
  }),
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  checkOut: async (_data: CheckOutData) => ({
    success: false,
    error: "Provider not ready",
  }),
  refreshAttendance: async () => {},
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const user = useMemo(() => ({ id: "EMP001", name: "John Doe" }), []);

  const { isOnline, addToQueue, queueLength } = useOfflineSync();
  const [offlineMessage, setOfflineMessage] = useState<string | null>(null);

  const {
    todayAttendance,
    isLoading,
    error,
    canCheckIn,
    canCheckOut,
    checkIn: realCheckIn,
    checkOut: realCheckOut,
    refreshAttendance,
  } = useRealAttendance(user.id);

  const smartCheckIn = async (
    data: CheckInData
  ): Promise<ApiResponse<AttendanceRecord>> => {
    if (isOnline) {
      return realCheckIn(data);
    } else {
      addToQueue("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkIn", data }),
      });
      setOfflineMessage(
        "Anda sedang offline. Absensi akan disinkronkan saat kembali online."
      );
      setTimeout(() => setOfflineMessage(null), 5000);
      return {
        success: true,
        data: {
          ...data,
          date: new Date().toISOString().split("T")[0],
          status: "present",
        } as AttendanceRecord,
      };
    }
  };

  const smartCheckOut = async (
    data: CheckOutData
  ): Promise<ApiResponse<AttendanceRecord>> => {
    if (isOnline) {
      return realCheckOut(data);
    } else {
      addToQueue("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkOut", data }),
      });
      setOfflineMessage(
        "Anda sedang offline. Absensi akan disinkronkan saat kembali online."
      );
      setTimeout(() => setOfflineMessage(null), 5000);
      return { success: true, data: todayAttendance as AttendanceRecord };
    }
  };

  const value = {
    user,
    todayAttendance,
    isLoading,
    error: offlineMessage || error,
    isOnline,
    queueLength,
    canCheckIn,
    canCheckOut,
    checkIn: smartCheckIn,
    checkOut: smartCheckOut,
    refreshAttendance,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
