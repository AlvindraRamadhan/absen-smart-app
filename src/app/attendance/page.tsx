"use client";

import React, { useState } from "react";
import {
  LayoutContainer,
  Section,
  Grid,
} from "@/components/layout/layout-container";
import { AttendanceForm } from "@/components/forms/attendance-form";
import { AttendanceCard } from "@/components/attendance/attendance-card";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, XCircle } from "lucide-react";

interface AttendanceFormData {
  employeeId: string;
  employeeName: string;
  notes: string;
  photo?: File | null;
}

export default function AttendancePage() {
  const [userLocation, setUserLocation] = useState<GeolocationCoordinates>();
  const [attendanceStatus, setAttendanceStatus] = useState<
    "not_checked_in" | "checked_in" | "checked_out"
  >("not_checked_in");
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Mock working hours
  const workingHours = {
    start: "09:00",
    end: "17:00",
    lateThreshold: "09:15",
  };

  const handleFormSubmit = async (
    data: AttendanceFormData & { location: GeolocationCoordinates }
  ) => {
    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      console.log("Form submitted:", data);

      // Update attendance status
      if (attendanceStatus === "not_checked_in") {
        setAttendanceStatus("checked_in");
      } else {
        setAttendanceStatus("checked_out");
      }

      setShowForm(false);
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGetLocation = async () => {
    try {
      const position = await new Promise<GeolocationPosition>(
        (resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000,
          });
        }
      );

      setUserLocation(position.coords);
    } catch (error) {
      console.error("Location error:", error);
    }
  };

  const handleStartAttendance = () => {
    if (!userLocation) {
      handleGetLocation();
    } else {
      setShowForm(true);
    }
  };

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
              status={showForm ? "ready" : "idle"}
              userLocation={
                userLocation
                  ? {
                      latitude: userLocation.latitude,
                      longitude: userLocation.longitude,
                      accuracy: userLocation.accuracy,
                    }
                  : undefined
              }
              onCheckIn={handleStartAttendance}
              onCheckOut={handleStartAttendance}
              onGetLocation={handleGetLocation}
              isWithinRadius={true} // Mock: assume within radius
              distance={50} // Mock distance
              workingHours={workingHours}
            />
          </div>

          {/* Form or Status */}
          <div>
            {showForm ? (
              <AttendanceForm
                onSubmit={handleFormSubmit}
                userLocation={userLocation}
                isLoading={isLoading}
                mode={
                  attendanceStatus === "not_checked_in" ? "checkin" : "checkout"
                }
                initialData={{
                  employeeId: "EMP001",
                  employeeName: "John Doe",
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
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Status Hari Ini:
                      </span>
                      <div className="flex items-center space-x-2">
                        {attendanceStatus === "checked_in" ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <span className="text-green-600 font-medium">
                              Sudah Check In
                            </span>
                          </>
                        ) : attendanceStatus === "checked_out" ? (
                          <>
                            <CheckCircle className="w-5 h-5 text-blue-500" />
                            <span className="text-blue-600 font-medium">
                              Sudah Check Out
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

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Jam Kerja:
                      </span>
                      <span className="text-gray-600">
                        {workingHours.start} - {workingHours.end}
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">
                        Batas Terlambat:
                      </span>
                      <span className="text-gray-600">
                        {workingHours.lateThreshold}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </Grid>
      </Section>

      {/* Additional Info Section */}
      <Section background="gray" padding="xl">
        <Grid cols={{ default: 1, md: 3 }} gap="lg">
          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Real-time Tracking
            </h3>
            <p className="text-gray-600 text-sm">
              Pantau waktu kehadiran secara real-time dengan akurasi tinggi
            </p>
          </Card>

          <Card className="text-center p-6">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Validasi Otomatis
            </h3>
            <p className="text-gray-600 text-sm">
              Sistem validasi otomatis dengan lokasi dan foto untuk akurasi
            </p>
          </Card>

          <Card className="text-center p-6">
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
              Laporan Detail
            </h3>
            <p className="text-gray-600 text-sm">
              Dapatkan laporan kehadiran yang lengkap dan mudah dianalisis
            </p>
          </Card>
        </Grid>
      </Section>
    </LayoutContainer>
  );
}
