import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "./app/context/AuthContext";

export const metadata = {
  title: "SIPL-IoT",
  description: "Sistem Informasi Peminjaman dan Inventaris Laboratorium IoT",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"> <AuthProvider>
          {children}
        </AuthProvider></body>
    </html>
  );
}
