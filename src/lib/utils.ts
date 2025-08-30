import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to readable string
 */
export function formatDate(
  date: Date | string,
  format: "short" | "long" | "time" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  switch (format) {
    case "short":
      return dateObj.toLocaleDateString("id-ID");
    case "long":
      return dateObj.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    case "time":
      return dateObj.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      });
    default:
      return dateObj.toLocaleDateString("id-ID");
  }
}

/**
 * Format time from date
 */
export function formatTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Get current date in YYYY-MM-DD format
 */
export function getCurrentDate(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Get current time in HH:MM:SS format
 */
export function getCurrentTime(): string {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/**
 * Check if time is within working hours
 */
export function isWithinWorkingHours(time?: Date): boolean {
  const now = time || new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Working hours: 07:00 - 18:00
  const startTime = 7 * 60; // 07:00 in minutes
  const endTime = 18 * 60; // 18:00 in minutes

  return totalMinutes >= startTime && totalMinutes <= endTime;
}

/**
 * Check if user is late
 */
export function isLateCheckIn(
  checkInTime: Date | string,
  lateThreshold = 9
): boolean {
  const time =
    typeof checkInTime === "string" ? new Date(checkInTime) : checkInTime;
  const hours = time.getHours();
  const minutes = time.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const thresholdMinutes = lateThreshold * 60;

  return totalMinutes > thresholdMinutes;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Format number with thousands separator
 */
export function formatNumber(num: number): string {
  return num.toLocaleString("id-ID");
}

/**
 * Get greeting based on current time
 */
export function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Selamat Pagi";
  } else if (hour < 17) {
    return "Selamat Siang";
  } else {
    return "Selamat Malam";
  }
}

/**
 * Get status color based on attendance status
 */
export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "present":
      return "text-green-400";
    case "late":
      return "text-yellow-400";
    case "absent":
      return "text-red-400";
    default:
      return "text-gray-400";
  }
}

/**
 * Get status background color
 */
export function getStatusBgColor(status: string): string {
  switch (status.toLowerCase()) {
    case "present":
      return "bg-green-500/10 border-green-500/20";
    case "late":
      return "bg-yellow-500/10 border-yellow-500/20";
    case "absent":
      return "bg-red-500/10 border-red-500/20";
    default:
      return "bg-gray-500/10 border-gray-500/20";
  }
}

/**
 * Truncate text
 */
export function truncateText(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
}
