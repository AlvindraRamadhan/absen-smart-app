"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Navigation,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AttendanceCardProps {
  status:
    | "idle"
    | "checking_location"
    | "ready"
    | "processing"
    | "success"
    | "error";
  userLocation?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  onCheckIn: () => void;
  onCheckOut: () => void;
  onGetLocation: () => void;
  isWithinRadius: boolean;
  distance?: number;
  workingHours: {
    start: string;
    end: string;
    lateThreshold: string;
  };
}

export function AttendanceCard({
  status,
  userLocation,
  onCheckIn,
  onGetLocation,
  isWithinRadius,
  distance,
  workingHours,
}: AttendanceCardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeUntilWork, setTimeUntilWork] = useState("");
  const [timeUntilEnd, setTimeUntilEnd] = useState("");
  const [isLate, setIsLate] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);

      // Calculate countdown timers
      const today = now.toISOString().split("T")[0];
      const workStart = new Date(`${today}T${workingHours.start}:00`);
      const workEnd = new Date(`${today}T${workingHours.end}:00`);
      const lateThreshold = new Date(
        `${today}T${workingHours.lateThreshold}:00`
      );

      // Time until work starts
      if (now < workStart) {
        const diff = workStart.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeUntilWork(
          `${hours.toString().padStart(2, "0")}:${minutes
            .toString()
            .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      } else {
        setTimeUntilWork("");
      }

      // Time until work ends
      if (now < workEnd) {
        const diff = workEnd.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeUntilEnd(`${hours}j ${minutes}m`);
      } else {
        setTimeUntilEnd("Waktu kerja selesai");
      }

      // Check if late
      setIsLate(now > lateThreshold && now < workEnd);
    }, 1000);

    return () => clearInterval(timer);
  }, [workingHours]);

  const getStatusDisplay = () => {
    switch (status) {
      case "checking_location":
        return {
          icon: Navigation,
          text: "Mengambil lokasi...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "ready":
        return {
          icon: isWithinRadius ? CheckCircle : AlertTriangle,
          text: isWithinRadius
            ? "Siap untuk absen"
            : "Di luar jangkauan kantor",
          color: isWithinRadius ? "text-green-600" : "text-red-600",
          bgColor: isWithinRadius ? "bg-green-50" : "bg-red-50",
        };
      case "processing":
        return {
          icon: Loader2,
          text: "Memproses absensi...",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
        };
      case "success":
        return {
          icon: CheckCircle,
          text: "Absensi berhasil!",
          color: "text-green-600",
          bgColor: "bg-green-50",
        };
      case "error":
        return {
          icon: AlertTriangle,
          text: "Gagal melakukan absensi",
          color: "text-red-600",
          bgColor: "bg-red-50",
        };
      default:
        return {
          icon: Clock,
          text: "Ketuk untuk memulai absensi",
          color: "text-gray-600",
          bgColor: "bg-gray-50",
        };
    }
  };

  if (!mounted) {
    return (
      <Card className="bg-white shadow-lg border border-gray-200">
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Card>
    );
  }

  const statusDisplay = getStatusDisplay();
  const currentHour = currentTime.getHours();
  const isWorkingHours = currentHour >= 9 && currentHour < 17;

  return (
    <Card className="bg-white shadow-lg border border-gray-200 overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
              statusDisplay.bgColor
            )}
            animate={{
              scale: status === "processing" ? [1, 1.1, 1] : 1,
            }}
            transition={{
              duration: 1,
              repeat: status === "processing" ? Infinity : 0,
            }}
          >
            <statusDisplay.icon
              className={cn(
                "w-10 h-10",
                statusDisplay.color,
                status === "processing" && "animate-spin"
              )}
            />
          </motion.div>

          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Absensi Hari Ini
          </h3>

          <p className={cn("text-lg", statusDisplay.color)}>
            {statusDisplay.text}
          </p>
        </div>

        {/* Time Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-3xl font-mono font-bold text-gray-800">
              {currentTime.toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </div>
            <div className="text-sm text-gray-500 mt-1">Waktu Sekarang</div>
          </div>

          <div className="text-center p-4 bg-gray-50 rounded-lg">
            {timeUntilWork ? (
              <>
                <div className="text-3xl font-mono font-bold text-blue-600">
                  {timeUntilWork}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Sampai Jam Kerja
                </div>
              </>
            ) : (
              <>
                <div className="text-lg font-semibold text-gray-600">
                  {timeUntilEnd}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Sisa Waktu Kerja
                </div>
              </>
            )}
          </div>
        </div>

        {/* Location Information */}
        {status === "ready" && userLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-800">
                    {isWithinRadius
                      ? "Dalam jangkauan kantor"
                      : "Di luar jangkauan kantor"}
                  </div>
                  {distance && (
                    <div className="text-sm text-gray-500">
                      Jarak: {distance.toFixed(0)} meter dari kantor
                    </div>
                  )}
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isWithinRadius ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>
          </motion.div>
        )}

        {/* Late Warning */}
        <AnimatePresence>
          {isLate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <div className="flex items-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 mr-3" />
                <div>
                  <div className="font-medium text-amber-800">
                    Perhatian: Anda terlambat
                  </div>
                  <div className="text-sm text-amber-600">
                    Batas waktu normal adalah {workingHours.lateThreshold}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="space-y-3">
          {status === "idle" && (
            <Button
              onClick={onGetLocation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Mulai Absensi
            </Button>
          )}

          {status === "ready" && isWithinRadius && isWorkingHours && (
            <Button
              onClick={onCheckIn}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Check In Sekarang
            </Button>
          )}

          {status === "ready" && !isWithinRadius && (
            <Button
              onClick={onGetLocation}
              variant="ghost"
              className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 rounded-lg transition-all duration-200"
              size="lg"
            >
              <Navigation className="w-5 h-5 mr-2" />
              Perbarui Lokasi
            </Button>
          )}

          {(status === "checking_location" || status === "processing") && (
            <Button
              disabled
              className="w-full bg-gray-400 text-white font-medium py-3 rounded-lg"
              size="lg"
            >
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              {status === "checking_location"
                ? "Mengambil lokasi..."
                : "Memproses..."}
            </Button>
          )}
        </div>

        {/* Working Hours Info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="text-center text-sm text-gray-500">
            <div className="flex items-center justify-center space-x-6">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>
                  Jam Kerja: {workingHours.start} - {workingHours.end}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                <span>Batas: {workingHours.lateThreshold}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
