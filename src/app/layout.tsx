import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Absen Smart - Attendance System",
  description: "Smart attendance system untuk produktivitas yang lebih baik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AppProvider>{children}</AppProvider>{" "}
        {/* Bungkus children dengan AppProvider */}
      </body>
    </html>
  );
}
