"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  LayoutContainer,
  Section,
  Grid,
} from "@/components/layout/layout-container";
import { StatCard } from "@/components/ui/StatCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { Card } from "@/components/ui/card";
import {
  Clock,
  UserCheck,
  UserX,
  TrendingUp,
  CalendarDays,
} from "lucide-react";
import { format, eachDayOfInterval, startOfWeek, endOfWeek } from "date-fns";
import { id } from "date-fns/locale";

interface AttendanceRecord {
  date: string;
  status: "present" | "late" | "absent";
  employeeName: string;
  checkIn: string;
}

export default function DashboardPage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/attendance");
        const result = await response.json();

        if (response.ok && result.success) {
          setRecords(result.data);
        } else {
          throw new Error(result.error || "Gagal memuat data.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const todayRecords = records.filter((r) => r.date === todayStr);

    const totalHadir = todayRecords.filter(
      (r) => r.status === "present" || r.status === "late"
    ).length;
    const totalTerlambat = todayRecords.filter(
      (r) => r.status === "late"
    ).length;
    const totalKaryawan = new Set(records.map((r) => r.employeeName)).size;

    return { totalHadir, totalTerlambat, totalKaryawan };
  }, [records]);

  const chartData = useMemo(() => {
    const today = new Date();
    const startOfThisWeek = startOfWeek(today, { weekStartsOn: 1 });
    const endOfThisWeek = endOfWeek(today, { weekStartsOn: 1 });

    const weekDays = eachDayOfInterval({
      start: startOfThisWeek,
      end: endOfThisWeek,
    });

    return weekDays.map((day) => {
      const dayStr = format(day, "yyyy-MM-dd");
      const recordsForDay = records.filter((r) => r.date === dayStr);
      return {
        name: format(day, "EEE", { locale: id }),
        hadir: recordsForDay.filter((r) => r.status === "present").length,
        terlambat: recordsForDay.filter((r) => r.status === "late").length,
      };
    });
  }, [records]);

  if (isLoading) {
    return (
      <LayoutContainer>
        <div className="text-center p-12">Memuat data dashboard...</div>
      </LayoutContainer>
    );
  }

  if (error) {
    return (
      <LayoutContainer>
        <div className="text-center p-12 text-red-500">Error: {error}</div>
      </LayoutContainer>
    );
  }

  return (
    <LayoutContainer currentPath="/dashboard">
      <Section
        title="Dashboard Absensi"
        description={`Menampilkan ringkasan data absensi hingga hari ini, ${format(
          new Date(),
          "dd MMMM yyyy",
          { locale: id }
        )}.`}
      >
        <Grid cols={{ default: 1, md: 2, lg: 4 }} gap="md" className="mb-8">
          <StatCard
            title="Hadir Hari Ini"
            value={`${stats.totalHadir} / ${stats.totalKaryawan}`}
            icon={<UserCheck size={24} className="text-green-600" />}
            color="bg-green-100"
          />
          <StatCard
            title="Terlambat Hari Ini"
            value={stats.totalTerlambat}
            icon={<Clock size={24} className="text-amber-600" />}
            color="bg-amber-100"
          />
          <StatCard
            title="Tingkat Kehadiran"
            value={`${
              stats.totalKaryawan > 0
                ? Math.round((stats.totalHadir / stats.totalKaryawan) * 100)
                : 0
            }%`}
            icon={<TrendingUp size={24} className="text-blue-600" />}
            color="bg-blue-100"
          />
          <StatCard
            title="Total Karyawan"
            value={stats.totalKaryawan}
            icon={<UserX size={24} className="text-gray-600" />}
            color="bg-gray-100"
          />
        </Grid>

        <Grid cols={{ default: 1, lg: 3 }} gap="lg">
          <div className="lg:col-span-2">
            <AttendanceChart data={chartData} />
          </div>
          <div className="lg:col-span-1">
            <Card className="p-6 h-full">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <CalendarDays size={20} className="mr-2" />
                Aktivitas Terbaru
              </h3>
              <div className="space-y-4">
                {records
                  .slice(-5)
                  .reverse()
                  .map((rec, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-full ${
                          rec.status === "present"
                            ? "bg-green-100 text-green-600"
                            : "bg-amber-100 text-amber-600"
                        }`}
                      >
                        <UserCheck size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">
                          {rec.employeeName}
                        </p>
                        <p className="text-xs text-gray-500">
                          Check-in pada {rec.checkIn} -
                          <span
                            className={
                              rec.status === "late"
                                ? "text-amber-600"
                                : "text-green-600"
                            }
                          >
                            {rec.status === "late"
                              ? " Terlambat"
                              : " Tepat Waktu"}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                {records.length === 0 && (
                  <p className="text-sm text-gray-500">
                    Belum ada aktivitas hari ini.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </Grid>
      </Section>
    </LayoutContainer>
  );
}
