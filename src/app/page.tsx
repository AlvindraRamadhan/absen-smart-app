"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function HomePage() {
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
      setCurrentDate(
        now.toLocaleDateString("id-ID", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  if (!mounted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <motion.h1
              className="text-2xl font-bold text-gray-800"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              Absen Smart
            </motion.h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>{getGreeting()}</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl font-light text-gray-800 mb-4">
            Smart Attendance System
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Sistem absensi modern untuk efisiensi dan akurasi yang lebih baik
          </p>
        </motion.div>

        {/* Time Display */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <Card className="max-w-lg mx-auto text-center bg-white shadow-sm border border-gray-200">
            <div className="p-8">
              <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
                {currentTime}
              </div>
              <div className="text-gray-500 text-sm">{currentDate}</div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            {
              icon: Calendar,
              label: "Status Hari Ini",
              value: "Belum Absen",
              color: "text-amber-600",
              bgColor: "bg-amber-50",
            },
            {
              icon: Users,
              label: "Tim Online",
              value: "24 Orang",
              color: "text-emerald-600",
              bgColor: "bg-emerald-50",
            },
            {
              icon: MapPin,
              label: "Lokasi Kantor",
              value: "Jakarta Pusat",
              color: "text-blue-600",
              bgColor: "bg-blue-50",
            },
            {
              icon: Clock,
              label: "Streak",
              value: "7 Hari",
              color: "text-purple-600",
              bgColor: "bg-purple-50",
            },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            >
              <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}
                    >
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mb-1">{stat.label}</div>
                  <div className="text-xl font-semibold text-gray-800">
                    {stat.value}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Button
            size="lg"
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
          >
            <Clock className="w-5 h-5 mr-2" />
            Absen Masuk
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-8 py-3 rounded-lg transition-all duration-200"
          >
            Lihat Dashboard
          </Button>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: "Deteksi Lokasi",
              description:
                "Validasi kehadiran berdasarkan lokasi GPS yang akurat dan real-time",
              icon: MapPin,
            },
            {
              title: "Sinkronisasi Real-time",
              description:
                "Data tersimpan otomatis dan tersinkronisasi dengan sistem pusat",
              icon: Clock,
            },
            {
              title: "Laporan Analytics",
              description:
                "Dashboard komprehensif dengan insights dan statistik kehadiran",
              icon: Users,
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.6 }}
            >
              <Card className="bg-white border border-gray-200 h-full hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-gray-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-16">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-gray-500">
            Built with Next.js 14 & TypeScript
          </div>
        </div>
      </footer>
    </main>
  );
}
