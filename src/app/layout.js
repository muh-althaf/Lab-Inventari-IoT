import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { AuthProvider } from "../app/context/AuthContext";

export const metadata = {
  title: "SIPL-IoT",
<<<<<<< HEAD
  description:
    "Sistem Informasi Peminjaman dan Inventaris Laboratorium IoT",
=======
  description: "Sistem Informasi Peminjaman dan Inventaris Laboratorium IoT",
>>>>>>> 7245c0d5573cc88918a2fb911acc17aaab2926de
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
<<<<<<< HEAD
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
=======
      <body className="min-h-full flex flex-col"> <AuthProvider>
          {children}
        </AuthProvider></body>
>>>>>>> 7245c0d5573cc88918a2fb911acc17aaab2926de
    </html>
  );
}