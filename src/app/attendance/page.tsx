/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutContainer,
  Section,
  Grid,
} from "@/components/layout/layout-container";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { AttendanceCard } from "@/components/attendance/attendance-card";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Clock,
  CheckCircle,
  XCircle,
  Navigation,
  MapPin,
  AlertTriangle,
  TestTube,
  Database,
} from "lucide-react";
import { useGeolocation, type LocationData } from "@/hooks/use-geolocation";

interface AttendanceFormData {
  employeeId: string;
  employeeName: string;
  notes: string;
  photo?: File | null;
}

interface CampusLocation {
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
}

interface ProximityResult {
  closestCampus: CampusLocation | null;
  distance: number;
  isWithinRadius: boolean;
}

interface MockAttendanceRecord {
  checkIn?: string;
  checkOut?: string;
  status?: "present" | "late" | "absent";
  date: string;
}

export default function AttendancePage() {
  // All hooks must be called before any conditional returns
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cardStatus, setCardStatus] = useState<
    "idle" | "checking_location" | "ready" | "processing" | "success" | "error"
  >("idle");
  const [isTestMode, setIsTestMode] = useState(false);
  const [testLocation, setTestLocation] = useState<LocationData | null>(null);
  const [mockAttendance, setMockAttendance] =
    useState<MockAttendanceRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(
    null
  );
  const [isWithinOfficeRadius, setIsWithinOfficeRadius] = useState(false);

  // Employee data - memoized
  const employeeData = useMemo(
    () => ({
      id: "EMP001",
      name: "John Doe",
    }),
    []
  );

  // Campus locations - memoized
  const campusLocations: CampusLocation[] = useMemo(
    () => [
      {
        name: "UAD Campus 4 (Main Campus)",
        latitude: -7.8003,
        longitude: 110.3752,
        radius: 800,
      },
      {
        name: "UAD Campus 1",
        latitude: -7.7956,
        longitude: 110.3691,
        radius: 500,
      },
      {
        name: "UAD Campus 2",
        latitude: -7.8022,
        longitude: 110.3829,
        radius: 500,
      },
      {
        name: "UAD Campus 3",
        latitude: -7.8047,
        longitude: 110.3638,
        radius: 500,
      },
    ],
    []
  );

  // Working hours - memoized
  const workingHours = useMemo(
    () => ({
      start: "07:00",
      end: "17:00",
      lateThreshold: "08:00",
    }),
    []
  );

  // Use geolocation hook
  const {
    location: realLocation,
    error: locationError,
    isLoading: locationLoading,
    getCurrentLocation,
  } = useGeolocation({
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 0,
    officeLocation: {
      latitude: campusLocations[0].latitude,
      longitude: campusLocations[0].longitude,
      radius: campusLocations[0].radius,
      address: "Universitas Ahmad Dahlan",
    },
  });

  // Calculate distance using Haversine formula
  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    },
    []
  );

  // Check campus proximity
  const checkCampusProximity = useCallback(
    (userLat: number, userLon: number): ProximityResult => {
      let closestCampus: CampusLocation | null = null;
      let minDistance = Infinity;
      let isWithinAnyRadius = false;

      campusLocations.forEach((campus) => {
        const distance = calculateDistance(
          userLat,
          userLon,
          campus.latitude,
          campus.longitude
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCampus = campus;
        }

        if (distance <= campus.radius) {
          isWithinAnyRadius = true;
        }
      });

      return {
        closestCampus,
        distance: minDistance,
        isWithinRadius: isWithinAnyRadius,
      };
    },
    [calculateDistance, campusLocations]
  );

  // Mock check in function
  const mockCheckIn = useCallback(async (data: any) => {
    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Determine status based on time
    const workStart = new Date();
    workStart.setHours(8, 0, 0, 0); // 08:00 AM
    const status = now > workStart ? "late" : "present";

    const newRecord: MockAttendanceRecord = {
      checkIn: currentTime,
      status,
      date: now.toISOString().split("T")[0],
    };

    setMockAttendance(newRecord);
    setIsLoading(false);

    console.log("Mock check-in successful:", newRecord);
    return { success: true, data: newRecord };
  }, []);

  // Mock check out function
  const mockCheckOut = useCallback(async () => {
    if (!mockAttendance) return { success: false, error: "No check-in record" };

    setIsLoading(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const now = new Date();
    const currentTime = now.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const updatedRecord = {
      ...mockAttendance,
      checkOut: currentTime,
    };

    setMockAttendance(updatedRecord);
    setIsLoading(false);

    console.log("Mock check-out successful:", updatedRecord);
    return { success: true, data: updatedRecord };
  }, [mockAttendance]);

  // Handle test mode
  const handleTestMode = useCallback(() => {
    const mockLocation: LocationData = {
      latitude: -7.8003,
      longitude: 110.3752,
      accuracy: 10,
      timestamp: Date.now(),
    };

    setTestLocation(mockLocation);
    setIsTestMode(true);
    setCardStatus("ready");

    console.log("🧪 Test mode activated - simulated location near UAD campus");
  }, []);

  // Handle get location
  const handleGetLocation = useCallback(async () => {
    setCardStatus("checking_location");
    setIsTestMode(false);
    setTestLocation(null);

    try {
      await getCurrentLocation();
      setCardStatus("ready");
    } catch (error) {
      console.error("Location error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("idle"), 3000);
    }
  }, [getCurrentLocation]);

  // Handle start attendance flow
  const handleStartAttendance = useCallback(async () => {
    const effectiveLocation = isTestMode ? testLocation : realLocation;
    if (!effectiveLocation) {
      await handleGetLocation();
    } else {
      setShowForm(true);
    }
  }, [isTestMode, testLocation, realLocation, handleGetLocation]);

  // Handle form submission
  const handleFormSubmit = useCallback(
    async (data: AttendanceFormData & { location: GeolocationCoordinates }) => {
      const effectiveLocation = isTestMode ? testLocation : realLocation;
      if (!effectiveLocation || distanceFromOffice === null) return;

      setCardStatus("processing");

      try {
        const result = await mockCheckIn({
          employeeId: data.employeeId,
          employeeName: data.employeeName,
          notes: data.notes,
          location: effectiveLocation,
        });

        if (result.success) {
          console.log("✅ Check-in successful (Mock Mode)");
          setCardStatus("success");
          setShowForm(false);

          setTimeout(() => {
            setCardStatus("idle");
          }, 3000);
        } else {
          console.error("❌ Check-in failed");
          setCardStatus("error");

          setTimeout(() => {
            setCardStatus("ready");
          }, 3000);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        setCardStatus("error");

        setTimeout(() => {
          setCardStatus("ready");
        }, 3000);
      }
    },
    [isTestMode, testLocation, realLocation, distanceFromOffice, mockCheckIn]
  );

  // Handle quick check in
  const handleCheckInClick = useCallback(async () => {
    const effectiveLocation = isTestMode ? testLocation : realLocation;
    if (!effectiveLocation || distanceFromOffice === null) return;

    setCardStatus("processing");

    try {
      const result = await mockCheckIn({
        employeeId: employeeData.id,
        employeeName: employeeData.name,
        notes: `Quick check-in ${isTestMode ? "(Test Mode)" : ""}`,
        location: effectiveLocation,
      });

      if (result.success) {
        console.log("✅ Quick check-in successful (Mock Mode)");
        setCardStatus("success");
        setTimeout(() => setCardStatus("idle"), 3000);
      } else {
        console.error("❌ Quick check-in failed");
        setCardStatus("error");
        setTimeout(() => setCardStatus("ready"), 3000);
      }
    } catch (error) {
      console.error("Check in error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("ready"), 3000);
    }
  }, [
    isTestMode,
    testLocation,
    realLocation,
    distanceFromOffice,
    mockCheckIn,
    employeeData,
  ]);

  // Handle check out
  const handleCheckOutClick = useCallback(async () => {
    setCardStatus("processing");

    try {
      const result = await mockCheckOut();

      if (result.success) {
        console.log("✅ Check-out successful (Mock Mode)");
        setCardStatus("success");
        setTimeout(() => setCardStatus("idle"), 3000);
      } else {
        console.error("❌ Check-out failed");
        setCardStatus("error");
        setTimeout(() => setCardStatus("ready"), 3000);
      }
    } catch (error) {
      console.error("Check out error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("ready"), 3000);
    }
  }, [mockCheckOut]);

  // Mock test connection
  const handleTestConnection = useCallback(async () => {
    setCardStatus("processing");

    try {
      // Simulate connection test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setCardStatus("success");
      console.log("✅ Mock connection test successful");
      setTimeout(() => setCardStatus("idle"), 3000);
    } catch (error) {
      console.error("❌ Mock connection test failed:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("idle"), 3000);
    }
  }, []);

  // Get effective location (real or test)
  const effectiveLocation = isTestMode ? testLocation : realLocation;

  // Update proximity when location changes
  useEffect(() => {
    if (effectiveLocation) {
      const proximityResult = checkCampusProximity(
        effectiveLocation.latitude,
        effectiveLocation.longitude
      );

      setDistanceFromOffice(proximityResult.distance);
      setIsWithinOfficeRadius(proximityResult.isWithinRadius);

      console.log("=== LOCATION UPDATE ===");
      console.log("User Location:", {
        lat: effectiveLocation.latitude,
        lng: effectiveLocation.longitude,
        accuracy: effectiveLocation.accuracy,
      });
      console.log(
        "Distance to closest campus:",
        `${Math.round(proximityResult.distance)}m`
      );
      console.log("Within radius:", proximityResult.isWithinRadius);
      console.log("Test mode:", isTestMode);
    }
  }, [effectiveLocation, isTestMode, checkCampusProximity]);

  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if can check in/out (mock logic)
  const canCheckIn = !mockAttendance?.checkIn;
  const canCheckOut = mockAttendance?.checkIn && !mockAttendance?.checkOut;

  // Check browser geolocation support
  const isGeolocationSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;

  // Determine if we have location
  const hasLocation = Boolean(effectiveLocation);
  const currentLocationError = locationError && !isTestMode;

  // Early return after all hooks
  if (!mounted) {
    return null;
  }

  return (
    <LayoutContainer currentPath="/attendance" maxWidth="7xl">
      <Section
        title="Sistem Absensi"
        description="Kelola kehadiran dengan sistem yang terintegrasi dan real-time"
        background="white"
        padding="xl"
      >
        <Grid cols={{ default: 1, lg: 2 }} gap="xl">
          {/* Attendance Card */}
          <div>
            <AttendanceCard
              status={cardStatus}
              userLocation={
                hasLocation
                  ? {
                      latitude: effectiveLocation!.latitude,
                      longitude: effectiveLocation!.longitude,
                      accuracy: effectiveLocation!.accuracy,
                    }
                  : undefined
              }
              onCheckIn={handleCheckInClick}
              onCheckOut={handleCheckOutClick}
              onGetLocation={handleGetLocation}
              isWithinRadius={isWithinOfficeRadius}
              distance={distanceFromOffice || undefined}
              workingHours={workingHours}
            />
          </div>

          {/* Form or Status */}
          <div>
            {showForm ? (
              <AttendanceForm
                onSubmit={handleFormSubmit}
                userLocation={
                  hasLocation
                    ? ({
                        latitude: effectiveLocation!.latitude,
                        longitude: effectiveLocation!.longitude,
                        accuracy: effectiveLocation!.accuracy,
                        altitude: null,
                        altitudeAccuracy: null,
                        heading: null,
                        speed: null,
                        toJSON: () => ({}),
                      } as GeolocationCoordinates)
                    : undefined
                }
                isLoading={cardStatus === "processing" || isLoading}
                mode="checkin"
                initialData={{
                  employeeId: employeeData.id,
                  employeeName: employeeData.name,
                }}
              />
            ) : (
              <Card className="bg-white shadow-lg border border-gray-200">
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Clock className="w-10 h-10 text-gray-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-800 mb-4">
                    Status Kehadiran
                  </h3>

                  {/* Mock Service Status */}
                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">
                        Mock Mode - UI Testing
                      </span>
                    </div>
                    <div className="text-blue-600 text-xs mt-1">
                      Data tidak tersimpan permanen
                    </div>
                  </div>

                  {/* Test Mode Indicator */}
                  {isTestMode && (
                    <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2">
                        <TestTube className="w-4 h-4 text-yellow-600" />
                        <span className="text-yellow-800 font-medium text-sm">
                          Mode Testing Aktif
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {currentLocationError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="text-red-800 font-medium">
                          Error Lokasi
                        </span>
                      </div>
                      <div className="text-red-700 text-sm">
                        {(currentLocationError as any)?.message ||
                          "Gagal mendapatkan lokasi GPS"}
                      </div>
                    </div>
                  )}

                  {/* Location Status */}
                  {hasLocation && !currentLocationError && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <span className="text-blue-800 font-medium">
                          {isWithinOfficeRadius
                            ? "Dalam jangkauan kampus"
                            : "Di luar jangkauan kampus"}
                        </span>
                      </div>
                      {distanceFromOffice && (
                        <div className="text-blue-600 text-sm">
                          Jarak: {distanceFromOffice.toFixed(0)} meter dari
                          kampus terdekat
                        </div>
                      )}
                      <div className="text-blue-500 text-xs mt-2">
                        {isTestMode
                          ? "Mode Testing (GPS Simulation)"
                          : `Akurasi GPS: ±${effectiveLocation?.accuracy?.toFixed(
                              0
                            )}m`}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Status Hari Ini:
                      </span>
                      <div className="flex items-center space-x-2">
                        {mockAttendance?.checkIn ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 font-medium">
                              {mockAttendance.checkOut
                                ? "Selesai"
                                : "Sudah Check In"}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-600 font-medium">
                              Belum Check In
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {mockAttendance?.checkIn && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Check In:
                        </span>
                        <span className="text-gray-600">
                          {mockAttendance.checkIn}
                        </span>
                      </div>
                    )}

                    {mockAttendance?.checkOut && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Check Out:
                        </span>
                        <span className="text-gray-600">
                          {mockAttendance.checkOut}
                        </span>
                      </div>
                    )}

                    {mockAttendance?.status && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`font-medium ${
                            mockAttendance.status === "present"
                              ? "text-green-600"
                              : mockAttendance.status === "late"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {mockAttendance.status === "present"
                            ? "Hadir"
                            : mockAttendance.status === "late"
                            ? "Terlambat"
                            : "Tidak Hadir"}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Lokasi:</span>
                      <span className="text-gray-600">Kampus UAD</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Jam Kerja:
                      </span>
                      <span className="text-gray-600">
                        {workingHours.start} - {workingHours.end}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-3">
                    {!isGeolocationSupported && (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="text-yellow-700 text-sm text-center">
                          Browser tidak mendukung deteksi lokasi. Gunakan Test
                          Mode.
                        </div>
                      </div>
                    )}

                    {isGeolocationSupported && !hasLocation && (
                      <Button
                        onClick={handleGetLocation}
                        disabled={
                          locationLoading || cardStatus === "checking_location"
                        }
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                      >
                        {locationLoading ||
                        cardStatus === "checking_location" ? (
                          <>
                            <Navigation className="w-5 h-5 mr-2 animate-spin" />
                            Mengambil Lokasi GPS...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-5 h-5 mr-2" />
                            Ambil Lokasi
                          </>
                        )}
                      </Button>
                    )}

                    {hasLocation &&
                      !currentLocationError &&
                      isWithinOfficeRadius &&
                      canCheckIn && (
                        <Button
                          onClick={handleStartAttendance}
                          disabled={isLoading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Mulai Absensi
                        </Button>
                      )}

                    {hasLocation &&
                      !currentLocationError &&
                      isWithinOfficeRadius &&
                      !canCheckIn &&
                      mockAttendance &&
                      canCheckOut && (
                        <Button
                          onClick={handleCheckOutClick}
                          disabled={isLoading}
                          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                        >
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Check Out
                        </Button>
                      )}

                    {hasLocation &&
                      !currentLocationError &&
                      !isWithinOfficeRadius && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="text-red-700 text-sm text-center">
                            Anda berada di luar jangkauan kampus. Silakan
                            mendekati area Universitas Ahmad Dahlan untuk
                            melakukan absensi.
                          </div>
                        </div>
                      )}

                    {mockAttendance && !canCheckIn && !canCheckOut && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-700 text-sm text-center">
                          Absensi hari ini sudah selesai. Terima kasih!
                        </div>
                      </div>
                    )}

                    {/* Test Mode and Retry Buttons */}
                    {currentLocationError && (
                      <div className="space-y-2">
                        <Button
                          onClick={handleGetLocation}
                          disabled={locationLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-all duration-200"
                        >
                          <Navigation className="w-5 h-5 mr-2" />
                          Coba Lagi
                        </Button>

                        <Button
                          onClick={handleTestMode}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Mode Testing
                        </Button>
                      </div>
                    )}

                    {/* Always show test mode button for development */}
                    {!hasLocation &&
                      !currentLocationError &&
                      isGeolocationSupported && (
                        <Button
                          onClick={handleTestMode}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                        >
                          <TestTube className="w-4 h-4 mr-2" />
                          Mode Testing
                        </Button>
                      )}

                    {/* Mock Test Button */}
                    <Button
                      onClick={handleTestConnection}
                      disabled={isLoading || cardStatus === "processing"}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Test Connection (Mock)
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Grid>
      </Section>

      {/* Feature Info Section */}
      <Section background="gray" padding="xl">
        <Grid cols={{ default: 1, md: 3 }} gap="lg">
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              UI Testing Mode
            </h3>
            <p className="text-gray-600 text-sm">
              Interface testing tanpa backend - data tidak permanen tersimpan
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Mock Functionality
            </h3>
            <p className="text-gray-600 text-sm">
              Semua fitur UI berfungsi dengan simulasi untuk testing experience
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-808 mb-2">
              Real-time Simulation
            </h3>
            <p className="text-gray-600 text-sm">
              Status dan timing detection bekerja seperti aplikasi production
            </p>
          </Card>
        </Grid>
      </Section>
    </LayoutContainer>
  );
}
