// Attendance related types
export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  location: LocationData;
  status: AttendanceStatus;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocationData {
  latitude: number;
  longitude: number;
  address: string;
  accuracy?: number;
}

export type AttendanceStatus = "present" | "late" | "absent" | "pending";

export interface AttendanceStats {
  totalPresent: number;
  totalLate: number;
  totalAbsent: number;
  totalDays: number;
  streak: number;
  averageCheckInTime: string;
}

export interface AttendanceFormData {
  userId: string;
  userName: string;
  notes?: string;
  location: LocationData;
}

// User related types
export interface User {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  joinDate: string;
  avatar?: string;
}

// Geolocation types
export interface GeolocationPosition {
  coords: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
    altitudeAccuracy?: number;
    heading?: number;
    speed?: number;
  };
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

// API Response types - Fixed generic constraints
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AttendanceResponse {
  success: boolean;
  data?: AttendanceRecord;
  error?: string;
  message?: string;
}

export interface AttendanceListResponse {
  success: boolean;
  data?: AttendanceRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  error?: string;
  message?: string;
}

export interface AttendanceStatsResponse {
  success: boolean;
  data?: AttendanceStats;
  error?: string;
  message?: string;
}

// Form validation types
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface FormState {
  isLoading: boolean;
  errors: FormErrors;
  isValid: boolean;
}

// App configuration types
export interface AppConfig {
  workingHours: {
    start: string; // HH:MM format
    end: string; // HH:MM format
  };
  lateThreshold: string; // HH:MM format
  officeLocation: {
    latitude: number;
    longitude: number;
    radius: number; // in meters
    address: string;
  };
  allowedDomains?: string[];
}

// Dashboard types
export interface DashboardData {
  todayAttendance?: AttendanceRecord;
  stats: AttendanceStats;
  recentActivity: AttendanceRecord[];
  weeklyData: WeeklyAttendanceData[];
}

export interface WeeklyAttendanceData {
  date: string;
  day: string;
  status: AttendanceStatus;
  checkIn?: string;
  checkOut?: string;
}

// Chart data types
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface TimeSeriesData {
  date: string;
  present: number;
  late: number;
  absent: number;
}

// Notification types
export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: string;
  read: boolean;
}

// Local storage types
export interface StoredAttendanceData {
  records: AttendanceRecord[];
  lastSync: string;
  pendingSync: AttendanceRecord[];
}

// Google Sheets types
export interface SheetData {
  range: string;
  majorDimension: "ROWS" | "COLUMNS";
  values: string[][];
}

export interface SheetResponse {
  spreadsheetId: string;
  updatedRange: string;
  updatedRows: number;
  updatedColumns: number;
  updatedCells: number;
}

// Hook return types
export interface UseAttendanceReturn {
  attendance: AttendanceRecord | null;
  isLoading: boolean;
  error: string | null;
  checkIn: (data: AttendanceFormData) => Promise<void>;
  checkOut: () => Promise<void>;
  refreshAttendance: () => Promise<void>;
}

export interface UseGeolocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: GeolocationError | null;
  getCurrentLocation: () => Promise<LocationData>;
  isWithinOfficeRadius: (location: LocationData) => boolean;
}

// Component props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "ghost" | "glass";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  description?: string;
  variant?: "default" | "glass" | "gradient";
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

// Animation types
export interface AnimationVariants {
  initial: Record<string, string | number>;
  animate: Record<string, string | number>;
  exit?: Record<string, string | number>;
  transition?: Record<string, string | number>;
}

// Theme types
export interface ThemeConfig {
  mode: "dark" | "light";
  primaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}
