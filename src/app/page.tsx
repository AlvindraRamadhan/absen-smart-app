"use client";

import React, { useState } from "react";
import { Header } from "@/components/layout/header";
import { HeroSection } from "@/components/sections/hero-section";
import { AttendanceCard } from "@/components/attendance/attendance-card";

export default function HomePage() {
  const [attendanceStatus, setAttendanceStatus] = useState<
    "not_checked_in" | "checked_in" | "checked_out"
  >("not_checked_in");
  const [cardStatus, setCardStatus] = useState<
    "idle" | "checking_location" | "ready" | "processing" | "success" | "error"
  >("idle");
  const [userLocation, setUserLocation] = useState<
    { latitude: number; longitude: number; accuracy: number } | undefined
  >();
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [distance, setDistance] = useState<number>();

  // Mock office location (Jakarta area)
  const officeLocation = {
    latitude: -6.2088,
    longitude: 106.8456,
    radius: 100, // 100 meters
  };

  // Mock working hours
  const workingHours = {
    start: "09:00",
    end: "17:00",
    lateThreshold: "09:15",
  };

  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const handleGetLocation = async () => {
    setCardStatus("checking_location");

    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by this browser.");
      }

      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
      };

      setUserLocation(location);

      // Calculate distance from office
      const dist = calculateDistance(
        location.latitude,
        location.longitude,
        officeLocation.latitude,
        officeLocation.longitude
      );
      setDistance(dist);

      // Check if within radius
      const withinRadius = dist <= officeLocation.radius;
      setIsWithinRadius(withinRadius);

      setCardStatus("ready");
    } catch (err) {
      console.error("Error getting location:", err);
      setCardStatus("error");

      // Reset after 3 seconds
      setTimeout(() => {
        setCardStatus("idle");
      }, 3000);
    }
  };

  const handleCheckIn = async () => {
    setCardStatus("processing");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAttendanceStatus("checked_in");
      setCardStatus("success");

      // Reset card status after showing success
      setTimeout(() => {
        setCardStatus("idle");
      }, 3000);
    } catch (err) {
      console.error("Error checking in:", err);
      setCardStatus("error");

      setTimeout(() => {
        setCardStatus("ready");
      }, 3000);
    }
  };

  const handleCheckOut = async () => {
    setCardStatus("processing");

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setAttendanceStatus("checked_out");
      setCardStatus("success");

      setTimeout(() => {
        setCardStatus("idle");
      }, 3000);
    } catch (err) {
      console.error("Error checking out:", err);
      setCardStatus("error");

      setTimeout(() => {
        setCardStatus("ready");
      }, 3000);
    }
  };

  const handleHeroCheckIn = () => {
    if (cardStatus === "idle") {
      handleGetLocation();
    } else if (cardStatus === "ready" && isWithinRadius) {
      handleCheckIn();
    }
  };

  const handleHeroCheckOut = () => {
    if (cardStatus === "idle") {
      handleGetLocation();
    } else if (cardStatus === "ready" && isWithinRadius) {
      handleCheckOut();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPath="/" />

      <HeroSection
        userName="John Doe"
        attendanceStatus={attendanceStatus}
        lastCheckIn={attendanceStatus === "checked_in" ? "09:15" : undefined}
        currentLocation="Jakarta Pusat"
        onCheckIn={handleHeroCheckIn}
        onCheckOut={handleHeroCheckOut}
      />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-light text-gray-800 mb-4">
            Proses Absensi
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Lakukan absensi dengan mudah melalui sistem yang terintegrasi dengan
            lokasi dan waktu real-time
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <AttendanceCard
            status={cardStatus}
            userLocation={userLocation}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onGetLocation={handleGetLocation}
            isWithinRadius={isWithinRadius}
            distance={distance}
            workingHours={workingHours}
          />
        </div>

        {/* Additional Info Section */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Berbasis Lokasi
            </h3>
            <p className="text-gray-600 text-sm">
              Absensi otomatis terverifikasi berdasarkan lokasi GPS yang akurat
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Real-time
            </h3>
            <p className="text-gray-600 text-sm">
              Data tersinkronisasi secara real-time dengan sistem pusat
            </p>
          </div>

          <div className="text-center p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Analytics
            </h3>
            <p className="text-gray-600 text-sm">
              Laporan dan statistik kehadiran yang komprehensif
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>&copy; 2025 Absen Smart. Built with Next.js 14 & TypeScript</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
