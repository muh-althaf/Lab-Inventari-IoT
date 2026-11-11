"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("login"); // 'login' atau 'register'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    // Langsung arahkan ke halaman dashboard
    router.push("/dashboard");
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      alert("Harap setujui SOP & aturan Lab terlebih dahulu!");
      return;
    }
    alert("Pendaftaran berhasil! Akun menunggu verifikasi asisten lab.");
  };

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100 font-sans">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

        {/* BRAND LOGO */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
              <rect
                x="13"
                y="13"
                width="22"
                height="22"
                rx="5"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <circle
                cx="24"
                cy="24"
                r="5"
                stroke="currentColor"
                strokeWidth="2.5"
              />
              <path
                d="M24 7V14M24 34V41M7 24H14M34 24H41M12 12L17 17M31 31L36 36M36 12L31 17M17 31L12 36"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20"></span>
        </div>

        {/* BRAND INFO */}
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            NODE SIPL-IOT • V2.4.0
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
            {activeTab === "login" ? "SIPL-IoT Portal" : "Pendaftaran Akun"}
          </h1>
          <p className="text-xs text-slate-400">
            {activeTab === "login"
              ? "Sistem Informasi Peminjaman & Inventaris Lab IoT"
              : "Registrasi Mahasiswa & Anggota Lab SIPL-IoT"}
          </p>
        </div>

        {/* AUTH TABS */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "login"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("login")}
          >
            ↪ Masuk
          </button>
          <button
            type="button"
            className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeTab === "register"
                ? "bg-blue-600 text-white shadow-md"
                : "text-slate-400 hover:text-slate-200"
            }`}
            onClick={() => setActiveTab("register")}
          >
            ♙ Daftar Baru
          </button>
        </div>

        {/* NOTICE BOX */}
        <div className="bg-blue-950/40 border border-blue-900/60 rounded-xl p-3 flex gap-3 text-xs text-blue-300">
          <span className="text-blue-400 font-bold text-sm">♧</span>
          <p className="leading-relaxed">
            {activeTab === "login" ? (
              <>
                Gunakan kredensial <strong>SSO Mahasiswa</strong> atau NIM aktif
                yang telah diverifikasi di portal akademik terpadu.
              </>
            ) : (
              <>
                Pastikan data <strong>NIM dan Email Kampus</strong> sesuai dengan
                data aktif di SIAKAD/Portal Akademik.
              </>
            )}
          </p>
        </div>

        {/* KONDISIONAL FORM (LOGIN / REGISTER) */}
        {activeTab === "login" ? (
          /* FORM LOGIN */
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="identity" className="font-medium text-slate-300">
                  NIM
                </label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wajib</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">▣</span>
                <input
                  type="text"
                  id="identity"
                  placeholder="210101... atau nama@student.ac.id"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="password" className="font-medium text-slate-300">
                  Kata Sandi
                </label>
                <a href="/lupa-password" className="text-blue-400 hover:underline text-[11px]">
                  Lupa Password?
                </a>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">♙</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-slate-500 hover:text-slate-300 text-xs"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "◉" : "◎"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                />
                Ingat sesi perangkat ini
              </label>
              <span className="text-[10px] text-slate-600 font-mono">Lab Guard v2</span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 active:scale-[0.99]"
            >
              ↪ Masuk ke Sistem
            </button>
          </form>
        ) : (
          /* FORM REGISTER */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="fullname" className="font-medium text-slate-300">
                  Nama Lengkap
                </label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wajib</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">👤</span>
                <input
                  type="text"
                  id="fullname"
                  placeholder="Masukkan nama lengkap"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="nim" className="font-medium text-slate-300">
                  NIM
                </label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wajib</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">▣</span>
                <input
                  type="text"
                  id="nim"
                  placeholder="Contoh: 210856..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="email" className="font-medium text-slate-300">
                  Email Student
                </label>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Wajib</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">✉</span>
                <input
                  type="email"
                  id="email"
                  placeholder="nama@student.ac.id"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center text-xs">
                <label htmlFor="reg-password" className="font-medium text-slate-300">
                  Kata Sandi
                </label>
                <span className="text-[10px] text-slate-500">Min. 8 karakter</span>
              </div>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">♙</span>
                <input
                  type={showPassword ? "text" : "password"}
                  id="reg-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-slate-500 hover:text-slate-300 text-xs"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "◉" : "◎"}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="confirm-password" className="text-xs font-medium text-slate-300">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-slate-500 text-xs">♙</span>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirm-password"
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 text-slate-500 hover:text-slate-300 text-xs"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "◉" : "◎"}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0"
                  required
                />
                Saya menyetujui SOP & aturan Lab
              </label>
              <span className="text-[10px] text-slate-600 font-mono">Lab Guard v2</span>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 active:scale-[0.99]"
            >
              ♙ Buat Akun Praktikum
            </button>
          </form>
        )}

        {/* FOOTER TEXT TOGGLE */}
        <div className="text-center text-xs text-slate-400 border-t border-slate-800/80 pt-4">
          {activeTab === "login" ? (
            <>
              Belum memiliki akun praktikum?{" "}
              <button
                type="button"
                className="text-blue-400 font-semibold hover:underline"
                onClick={() => setActiveTab("register")}
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah memiliki akun?{" "}
              <button
                type="button"
                className="text-blue-400 font-semibold hover:underline"
                onClick={() => setActiveTab("login")}
              >
                Masuk sekarang
              </button>
            </>
          )}
        </div>

        {/* FOOTER STATUS */}
        <footer className="text-center text-[11px] text-slate-500 space-y-2 pt-1">
          <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              SSO Server Online
            </span>
            <span>•</span>
            <span>Enkripsi 256-bit</span>
            <span>•</span>
            <span>IoT-RACK #01 READY</span>
          </div>
          <p>© 2025 Laboratorium Sistem Tertanam & IoT Terapan.</p>
        </footer>

      </div>
    </main>
  );
}