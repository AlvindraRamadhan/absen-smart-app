"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  MessageSquare,
  Camera,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface AttendanceFormData {
  employeeId: string;
  employeeName: string;
  notes: string;
  photo?: File | null;
}

interface AttendanceFormProps {
  onSubmit: (
    data: AttendanceFormData & { location: GeolocationCoordinates }
  ) => Promise<void>;
  userLocation?: GeolocationCoordinates;
  isLoading?: boolean;
  initialData?: Partial<AttendanceFormData>;
  mode: "checkin" | "checkout";
}

interface FormErrors {
  employeeId?: string;
  employeeName?: string;
  notes?: string;
  photo?: string;
  location?: string;
}

export function AttendanceForm({
  onSubmit,
  userLocation,
  isLoading = false,
  initialData = {},
  mode,
}: AttendanceFormProps) {
  const [formData, setFormData] = useState<AttendanceFormData>({
    employeeId: initialData.employeeId || "",
    employeeName: initialData.employeeName || "",
    notes: initialData.notes || "",
    photo: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Memoized validation function
  const validateField = useCallback(
    async (field: string, value: string): Promise<string | undefined> => {
      setIsValidating(true);

      // Simulate API validation delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      let error: string | undefined;

      switch (field) {
        case "employeeId":
          if (!value) {
            error = "ID Karyawan wajib diisi";
          } else if (value.length < 3) {
            error = "ID Karyawan minimal 3 karakter";
          } else if (!/^[A-Z0-9]+$/.test(value)) {
            error = "ID Karyawan hanya boleh huruf besar dan angka";
          }
          break;

        case "employeeName":
          if (!value) {
            error = "Nama karyawan wajib diisi";
          } else if (value.length < 2) {
            error = "Nama minimal 2 karakter";
          } else if (!/^[a-zA-Z\s]+$/.test(value)) {
            error = "Nama hanya boleh huruf dan spasi";
          }
          break;

        case "notes":
          if (value && value.length > 200) {
            error = "Catatan maksimal 200 karakter";
          }
          break;
      }

      setIsValidating(false);
      return error;
    },
    []
  );

  // Real-time validation with proper dependencies
  useEffect(() => {
    const validateTouchedFields = async () => {
      if (Object.keys(touched).length === 0) return;

      const newErrors: FormErrors = {};

      for (const field of Object.keys(touched)) {
        if (touched[field]) {
          const error = await validateField(
            field,
            formData[field as keyof AttendanceFormData] as string
          );
          if (error) {
            newErrors[field as keyof FormErrors] = error;
          }
        }
      }

      setErrors(newErrors);
    };

    validateTouchedFields();
  }, [formData, touched, validateField]); // Removed 'errors' dependency to fix warning

  // Location validation
  useEffect(() => {
    if (!userLocation) {
      setErrors((prev) => ({ ...prev, location: "Lokasi belum terdeteksi" }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.location;
        return newErrors;
      });
    }
  }, [userLocation]);

  const handleInputChange = (
    field: keyof AttendanceFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: "Ukuran foto maksimal 5MB" }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({ ...prev, photo: "File harus berupa gambar" }));
        return;
      }

      setFormData((prev) => ({ ...prev, photo: file }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.photo;
        return newErrors;
      });

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      employeeId: true,
      employeeName: true,
      notes: true,
      photo: true,
    });

    // Check for validation errors
    if (Object.keys(errors).length > 0 || !userLocation) {
      return;
    }

    try {
      await onSubmit({
        ...formData,
        location: userLocation,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const isFormValid =
    Object.keys(errors).length === 0 &&
    formData.employeeId &&
    formData.employeeName &&
    userLocation;

  return (
    <Card className="bg-white shadow-lg border border-gray-200">
      <div className="p-8">
        <div className="mb-8">
          <h3 className="text-2xl font-semibold text-gray-800 mb-2">
            Form {mode === "checkin" ? "Check In" : "Check Out"}
          </h3>
          <p className="text-gray-600">
            Isi data berikut untuk melakukan{" "}
            {mode === "checkin" ? "check in" : "check out"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee ID */}
          <div className="relative">
            <Input
              label="ID Karyawan"
              placeholder="Masukkan ID karyawan (contoh: EMP001)"
              value={formData.employeeId}
              onChange={(e) =>
                handleInputChange("employeeId", e.target.value.toUpperCase())
              }
              error={touched.employeeId ? errors.employeeId : undefined}
              required
              className={cn(
                "pl-12",
                errors.employeeId && touched.employeeId && "border-red-500"
              )}
            />
            <User className="absolute left-4 top-10 w-5 h-5 text-gray-400" />

            {/* Validation indicator */}
            <AnimatePresence>
              {touched.employeeId && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-4 top-10"
                >
                  {isValidating ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : errors.employeeId ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Employee Name */}
          <div className="relative">
            <Input
              label="Nama Karyawan"
              placeholder="Masukkan nama lengkap"
              value={formData.employeeName}
              onChange={(e) =>
                handleInputChange("employeeName", e.target.value)
              }
              error={touched.employeeName ? errors.employeeName : undefined}
              required
              className={cn(
                "pl-12",
                errors.employeeName && touched.employeeName && "border-red-500"
              )}
            />
            <User className="absolute left-4 top-10 w-5 h-5 text-gray-400" />

            <AnimatePresence>
              {touched.employeeName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute right-4 top-10"
                >
                  {isValidating ? (
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                  ) : errors.employeeName ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Location Status */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-800">Status Lokasi</div>
                  <div className="text-sm text-gray-500">
                    {userLocation
                      ? `Lat: ${userLocation.latitude.toFixed(
                          6
                        )}, Lng: ${userLocation.longitude.toFixed(6)}`
                      : "Lokasi belum terdeteksi"}
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  userLocation ? "bg-green-500" : "bg-red-500"
                )}
              />
            </div>
            {errors.location && (
              <div className="mt-2 text-sm text-red-500">{errors.location}</div>
            )}
          </div>

          {/* Notes */}
          <div className="relative">
            <Textarea
              label="Catatan (Opsional)"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              error={touched.notes ? errors.notes : undefined}
              rows={3}
              className={cn(
                "pl-12",
                errors.notes && touched.notes && "border-red-500"
              )}
            />
            <MessageSquare className="absolute left-4 top-10 w-5 h-5 text-gray-400" />

            <div className="mt-1 text-right">
              <span
                className={cn(
                  "text-xs",
                  formData.notes.length > 180 ? "text-red-500" : "text-gray-400"
                )}
              >
                {formData.notes.length}/200
              </span>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Foto (Opsional)
            </label>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />

              {photoPreview ? (
                <div className="space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={photoPreview}
                      alt="Preview"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-lg"
                      priority
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData((prev) => ({ ...prev, photo: null }));
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Ganti Foto
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <label
                      htmlFor="photo-upload"
                      className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Foto
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG hingga 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            {errors.photo && (
              <div className="text-sm text-red-500">{errors.photo}</div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-6">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className={cn(
                "w-full py-3 rounded-lg font-medium transition-all duration-200",
                isFormValid && !isLoading
                  ? "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              )}
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 mr-2" />
                  {mode === "checkin"
                    ? "Check In Sekarang"
                    : "Check Out Sekarang"}
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Form Status */}
        <AnimatePresence>
          {Object.keys(errors).length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">
                    Terdapat kesalahan pada form
                  </div>
                  <div className="text-sm text-red-600 mt-1">
                    Silakan perbaiki field yang ditandai sebelum melanjutkan
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Card>
  );
}
