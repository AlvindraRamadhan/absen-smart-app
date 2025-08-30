"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Clock, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface HeroSectionProps {
  userName?: string;
  onCheckIn?: () => void;
  onCheckOut?: () => void;
  attendanceStatus?: "not_checked_in" | "checked_in" | "checked_out";
  lastCheckIn?: string;
  currentLocation?: string;
}

export function HeroSection({
  userName = "John Doe",
  onCheckIn,
  onCheckOut,
  attendanceStatus = "not_checked_in",
  lastCheckIn,
  currentLocation = "Jakarta Pusat",
}: HeroSectionProps) {
  const [currentTime, setCurrentTime] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [typewriterText, setTypewriterText] = useState("");
  const [mounted, setMounted] = useState(false);

  const typewriterEffect = useCallback(() => {
    // Move messages inside useCallback to avoid dependency issues
    const messages = [
      "Selamat datang di sistem absensi modern",
      "Pantau kehadiran dengan mudah dan akurat",
      "Kelola waktu kerja Anda dengan efisien",
    ];

    let messageIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const animate = () => {
      const currentMessage = messages[messageIndex];

      if (!isDeleting && charIndex <= currentMessage.length) {
        setTypewriterText(currentMessage.substring(0, charIndex));
        charIndex++;
      } else if (isDeleting && charIndex >= 0) {
        setTypewriterText(currentMessage.substring(0, charIndex));
        charIndex--;
      }

      if (charIndex === currentMessage.length + 1 && !isDeleting) {
        setTimeout(() => {
          isDeleting = true;
        }, 2000);
      } else if (charIndex === 0 && isDeleting) {
        isDeleting = false;
        messageIndex = (messageIndex + 1) % messages.length;
      }
    };

    return setInterval(animate, 100);
  }, []);

  useEffect(() => {
    setMounted(true);

    // Update time and date
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
    const timeInterval = setInterval(updateTime, 1000);

    // Start typewriter effect
    const typewriterInterval = typewriterEffect();

    return () => {
      clearInterval(timeInterval);
      clearInterval(typewriterInterval);
    };
  }, [typewriterEffect]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Selamat Pagi";
    if (hour < 17) return "Selamat Siang";
    return "Selamat Malam";
  };

  const getStatusInfo = () => {
    switch (attendanceStatus) {
      case "checked_in":
        return {
          icon: CheckCircle,
          text: "Sudah Check In",
          color: "text-green-600",
          bgColor: "bg-green-50",
          borderColor: "border-green-200",
        };
      case "checked_out":
        return {
          icon: CheckCircle,
          text: "Sudah Check Out",
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
        };
      default:
        return {
          icon: AlertCircle,
          text: "Belum Check In",
          color: "text-amber-600",
          bgColor: "bg-amber-50",
          borderColor: "border-amber-200",
        };
    }
  };

  if (!mounted) {
    return (
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-12 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-2xl font-light text-gray-600 mb-2">
              {getGreeting()},{" "}
              <span className="font-semibold text-gray-800">{userName}</span>
            </h2>

            <div className="h-16 flex items-center justify-center">
              <p className="text-lg text-gray-600 min-h-[2rem]">
                {typewriterText}
                <span className="animate-pulse">|</span>
              </p>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Time Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <Card className="bg-white shadow-sm border border-gray-200 text-center">
              <div className="p-8">
                <Clock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                <div className="text-4xl font-mono font-bold text-gray-800 mb-2">
                  {currentTime}
                </div>
                <div className="text-gray-500 text-sm">{currentDate}</div>
              </div>
            </Card>
          </motion.div>

          {/* Status Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <Card
              className={`bg-white shadow-sm border ${statusInfo.borderColor} text-center`}
            >
              <div className="p-8">
                <div
                  className={`w-16 h-16 ${statusInfo.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}
                >
                  <statusInfo.icon className={`w-8 h-8 ${statusInfo.color}`} />
                </div>
                <div
                  className={`text-xl font-semibold ${statusInfo.color} mb-2`}
                >
                  {statusInfo.text}
                </div>
                {lastCheckIn && (
                  <div className="text-gray-500 text-sm">
                    Terakhir: {lastCheckIn}
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Location Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="bg-white shadow-sm border border-gray-200 text-center">
              <div className="p-8">
                <MapPin className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <div className="text-xl font-semibold text-gray-800 mb-2">
                  Lokasi Kantor
                </div>
                <div className="text-gray-500 text-sm">{currentLocation}</div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Action Buttons */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center mt-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {attendanceStatus === "not_checked_in" && (
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              onClick={onCheckIn}
            >
              <Clock className="w-5 h-5 mr-2" />
              Check In Sekarang
            </Button>
          )}

          {attendanceStatus === "checked_in" && (
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              onClick={onCheckOut}
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Check Out Sekarang
            </Button>
          )}

          <Button
            size="lg"
            variant="ghost"
            className="border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium px-8 py-3 rounded-lg transition-all duration-200"
          >
            Lihat Riwayat Absensi
          </Button>
        </motion.div>

        {/* Working Hours Info */}
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="inline-flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Jam Kerja: 09:00 - 17:00</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Batas Terlambat: 09:15</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
