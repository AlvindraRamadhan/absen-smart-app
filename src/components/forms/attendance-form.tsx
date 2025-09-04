"use client";

import React, { useState } from "react";
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleInputChange = (
    field: keyof AttendanceFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({ ...prev, photo: "Ukuran foto maksimal 5MB" }));
        return;
      }
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

      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userLocation) {
      setErrors((prev) => ({ ...prev, location: "Lokasi belum terdeteksi" }));
      return;
    }
    await onSubmit({
      ...formData,
      location: userLocation,
    });
  };

  const isFormValid =
    formData.employeeId && formData.employeeName && userLocation;

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
          <div className="relative">
            <Input
              label="ID Karyawan"
              value={formData.employeeId}
              readOnly
              className="pl-12 bg-gray-100"
            />
            <User className="absolute left-4 top-10 w-5 h-5 text-gray-400" />
          </div>
          <div className="relative">
            <Input
              label="Nama Karyawan"
              value={formData.employeeName}
              readOnly
              className="pl-12 bg-gray-100"
            />
            <User className="absolute left-4 top-10 w-5 h-5 text-gray-400" />
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="font-medium text-gray-800">Status Lokasi</div>
                  <div className="text-sm text-gray-500">
                    {userLocation
                      ? `Lat: ${userLocation.latitude.toFixed(
                          4
                        )}, Lng: ${userLocation.longitude.toFixed(4)}`
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

          <div className="relative">
            <Textarea
              label="Catatan (Opsional)"
              placeholder="Tambahkan catatan jika diperlukan..."
              value={formData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              rows={3}
              className="pl-12"
            />
            <MessageSquare className="absolute left-4 top-10 w-5 h-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-700">
              Foto Absen (Opsional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept="image/*"
                capture="user"
                onChange={handlePhotoChange}
                className="hidden"
                id="photo-upload"
              />
              {photoPreview ? (
                <div className="space-y-4">
                  <div className="relative w-32 h-32 mx-auto">
                    <Image
                      src={photoPreview}
                      alt="Preview Foto Absen"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPhotoPreview(null);
                        setFormData((prev) => ({ ...prev, photo: null }));
                        (
                          document.getElementById(
                            "photo-upload"
                          ) as HTMLInputElement
                        ).value = "";
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition"
                    >
                      ×
                    </button>
                  </div>
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
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
                      Ambil Foto / Upload
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                      PNG, JPG, JPEG hingga 5MB
                    </p>
                  </div>
                </div>
              )}
            </div>
            {errors.photo && (
              <div className="text-sm text-red-500 mt-2 flex items-center gap-2">
                <AlertTriangle size={16} />
                <span>{errors.photo}</span>
              </div>
            )}
          </div>

          <div className="pt-6">
            <Button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="w-full py-3 rounded-lg font-medium"
              size="lg"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-5 h-5 mr-2" />
              )}
              {isLoading
                ? "Memproses..."
                : mode === "checkin"
                ? "Check In Sekarang"
                : "Check Out Sekarang"}
            </Button>
          </div>
        </form>
      </div>
    </Card>
  );
}
