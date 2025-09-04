/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useAppContext } from "@/context/AppContext";

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

export default function AttendancePage() {
  // ** SEMUA HOOKS HARUS DI ATAS SINI **
  const [mounted, setMounted] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cardStatus, setCardStatus] = useState<
    "idle" | "checking_location" | "ready" | "processing" | "success" | "error"
  >("idle");
  const [isTestMode, setIsTestMode] = useState(false);
  const [testLocation, setTestLocation] = useState<LocationData | null>(null);
  const [distanceFromOffice, setDistanceFromOffice] = useState<number | null>(
    null
  );
  const [isWithinOfficeRadius, setIsWithinOfficeRadius] = useState(false);

  const {
    user,
    todayAttendance,
    isLoading: attendanceLoading,
    error: attendanceError,
    canCheckIn,
    canCheckOut,
    checkIn,
    checkOut,
    refreshAttendance,
  } = useAppContext();

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

  const workingHours = useMemo(
    () => ({
      start: "07:00",
      end: "17:00",
      lateThreshold: "08:00",
    }),
    []
  );

  const {
    location: realLocation,
    error: locationError,
    isLoading: locationLoading,
    getCurrentLocation,
  } = useGeolocation({
    officeLocation: {
      latitude: campusLocations[0].latitude,
      longitude: campusLocations[0].longitude,
      radius: campusLocations[0].radius,
    },
  });

  const calculateDistance = useCallback(
    (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
    },
    []
  );

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

  const effectiveLocation = isTestMode ? testLocation : realLocation;

  useEffect(() => {
    if (effectiveLocation) {
      const proximityResult = checkCampusProximity(
        effectiveLocation.latitude,
        effectiveLocation.longitude
      );
      setDistanceFromOffice(proximityResult.distance);
      setIsWithinOfficeRadius(proximityResult.isWithinRadius);
    }
  }, [effectiveLocation, checkCampusProximity]);

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
  }, []);

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

  const handleStartAttendance = useCallback(async () => {
    if (!effectiveLocation) {
      await handleGetLocation();
    } else {
      setShowForm(true);
    }
  }, [effectiveLocation, handleGetLocation]);

  const handleFormSubmit = useCallback(
    async (data: AttendanceFormData & { location: GeolocationCoordinates }) => {
      if (!effectiveLocation || distanceFromOffice === null || !user) return;
      setCardStatus("processing");
      try {
        const result = await checkIn({
          employeeId: user.id,
          employeeName: user.name,
          notes: data.notes,
          location: {
            latitude: effectiveLocation.latitude,
            longitude: effectiveLocation.longitude,
            accuracy: effectiveLocation.accuracy,
          },
          photoUrl: data.photo
            ? `photo_${Date.now()}_${data.photo.name}`
            : undefined,
        });
        if (result.success) {
          setCardStatus("success");
          setShowForm(false);
          setTimeout(() => setCardStatus("idle"), 3000);
        } else {
          setCardStatus("error");
          setTimeout(() => setCardStatus("ready"), 3000);
        }
      } catch (error) {
        console.error("Form submission error:", error);
        setCardStatus("error");
        setTimeout(() => setCardStatus("ready"), 3000);
      }
    },
    [effectiveLocation, distanceFromOffice, checkIn, user]
  );

  const handleCheckInClick = useCallback(async () => {
    if (!effectiveLocation || distanceFromOffice === null || !user) return;
    setCardStatus("processing");
    try {
      const result = await checkIn({
        employeeId: user.id,
        employeeName: user.name,
        notes: `Quick check-in ${isTestMode ? "(Test Mode)" : ""}`,
        location: {
          latitude: effectiveLocation.latitude,
          longitude: effectiveLocation.longitude,
          accuracy: effectiveLocation.accuracy,
        },
      });
      if (result.success) {
        setCardStatus("success");
        setTimeout(() => setCardStatus("idle"), 3000);
      } else {
        setCardStatus("error");
        setTimeout(() => setCardStatus("ready"), 3000);
      }
    } catch (error) {
      console.error("Check in error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("ready"), 3000);
    }
  }, [effectiveLocation, distanceFromOffice, checkIn, isTestMode, user]);

  const handleCheckOutClick = useCallback(async () => {
    if (!effectiveLocation || !user) return;
    setCardStatus("processing");
    try {
      const result = await checkOut({
        employeeId: user.id,
        location: {
          latitude: effectiveLocation.latitude,
          longitude: effectiveLocation.longitude,
          accuracy: effectiveLocation.accuracy,
        },
      });
      if (result.success) {
        setCardStatus("success");
        setTimeout(() => setCardStatus("idle"), 3000);
      } else {
        setCardStatus("error");
        setTimeout(() => setCardStatus("ready"), 3000);
      }
    } catch (error) {
      console.error("Check out error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("ready"), 3000);
    }
  }, [effectiveLocation, checkOut, user]);

  const handleTestConnection = useCallback(async () => {
    setCardStatus("processing");
    try {
      await refreshAttendance();
      if (attendanceError) {
        setCardStatus("error");
      } else {
        setCardStatus("success");
      }
      setTimeout(() => setCardStatus("idle"), 3000);
    } catch (error) {
      console.error("Connection test error:", error);
      setCardStatus("error");
      setTimeout(() => setCardStatus("idle"), 3000);
    }
  }, [refreshAttendance, attendanceError]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isGeolocationSupported =
    typeof navigator !== "undefined" && "geolocation" in navigator;
  const hasLocation = Boolean(effectiveLocation);
  const currentLocationError = locationError && !isTestMode;

  const initialFormData = useMemo(
    () => ({
      employeeId: user?.id || "",
      employeeName: user?.name || "",
    }),
    [user]
  );

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
                isLoading={cardStatus === "processing" || attendanceLoading}
                mode="checkin"
                initialData={initialFormData}
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

                  <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <Database className="w-4 h-4 text-blue-600" />
                      <span className="text-blue-800 font-medium text-sm">
                        {attendanceLoading
                          ? "Connecting..."
                          : attendanceError
                          ? "Connection Error"
                          : "Google Sheets Connected"}
                      </span>
                    </div>
                    {attendanceError && (
                      <div className="text-red-600 text-xs mt-1">
                        {attendanceError}
                      </div>
                    )}
                  </div>

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
                        {todayAttendance?.checkIn ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 font-medium">
                              {todayAttendance.checkOut
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

                    {todayAttendance?.checkIn && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Check In:
                        </span>
                        <span className="text-gray-600">
                          {todayAttendance.checkIn}
                        </span>
                      </div>
                    )}
                    {todayAttendance?.checkOut && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Check Out:
                        </span>
                        <span className="text-gray-600">
                          {todayAttendance.checkOut}
                        </span>
                      </div>
                    )}
                    {todayAttendance?.status && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">
                          Status:
                        </span>
                        <span
                          className={`font-medium ${
                            todayAttendance.status === "present"
                              ? "text-green-600"
                              : todayAttendance.status === "late"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {todayAttendance.status === "present"
                            ? "Hadir"
                            : todayAttendance.status === "late"
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
                          disabled={attendanceLoading}
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
                      todayAttendance &&
                      canCheckOut && (
                        <Button
                          onClick={handleCheckOutClick}
                          disabled={attendanceLoading}
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
                    {todayAttendance && !canCheckIn && !canCheckOut && (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-green-700 text-sm text-center">
                          Absensi hari ini sudah selesai. Terima kasih!
                        </div>
                      </div>
                    )}
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
                    <Button
                      onClick={handleTestConnection}
                      disabled={
                        attendanceLoading || cardStatus === "processing"
                      }
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 rounded-lg transition-all duration-200"
                    >
                      <Database className="w-4 h-4 mr-2" />
                      Test Google Sheets
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Grid>
      </Section>

      <Section background="gray" padding="xl">
        <Grid cols={{ default: 1, md: 3 }} gap="lg">
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Real Google Sheets Integration
            </h3>
            <p className="text-gray-600 text-sm">
              Data attendance tersimpan real-time di Google Sheets dengan backup
              otomatis
            </p>
          </Card>
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Persistent Data Storage
            </h3>
            <p className="text-gray-600 text-sm">
              Status kehadiran tersimpan permanen dan dapat diakses kapan saja
            </p>
          </Card>
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Smart Time Detection
            </h3>
            <p className="text-gray-600 text-sm">
              Deteksi otomatis status terlambat berdasarkan jam check-in dan
              aturan kantor
            </p>
          </Card>
        </Grid>
      </Section>
    </LayoutContainer>
  );
}
