"use client";

import { useState } from "react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [activeTab, setActiveTab] = useState("login");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Halaman login berhasil! Autentikasi belum dihubungkan.");
  };

  return (
    <main className="login-page">
      <div className="login-card">

        <div className="brand-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none">
              <rect x="13" y="13" width="22" height="22" rx="5"
                stroke="currentColor" strokeWidth="2.5" />
              <circle cx="24" cy="24" r="5"
                stroke="currentColor" strokeWidth="2.5" />
              <path
                d="M24 7V14M24 34V41M7 24H14M34 24H41M12 12L17 17M31 31L36 36M36 12L31 17M17 31L12 36"
                stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <span className="logo-status"></span>
        </div>

        <div className="brand-info">
          <div className="version-badge">
            <span></span>
            NODE SIPL-IOT • V2.4.0
          </div>

          <h1>SIPL-IoT Portal</h1>
          <p>
            Sistem Informasi Peminjaman & Inventaris Lab IoT
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={activeTab === "login" ? "active" : ""}
            onClick={() => setActiveTab("login")}
          >
            ↪ Masuk
          </button>

          <button
            type="button"
            className={activeTab === "register" ? "active" : ""}
            onClick={() => setActiveTab("register")}
          >
            ♙ Daftar Baru
          </button>
        </div>

        <div className="notice">
          <span>♧</span>
          <p>
            Gunakan kredensial <strong>SSO Mahasiswa</strong> atau NIM aktif
            yang telah diverifikasi di portal akademik terpadu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="identity">
                NIM 
              </label>
              <span>Wajib</span>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">▣</span>
              <input
                type="text"
                id="identity"
                placeholder="210101... atau nama@student.ac.id"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <div className="label-row">
              <label htmlFor="password">Kata Sandi</label>
              <a href="/lupa-password">Lupa Password?</a>
            </div>

            <div className="input-wrapper">
              <span className="input-icon">♙</span>

              <input
                type={showPassword ? "text" : "password"}
                id="password"
                placeholder="••••••••"
                required
              />

              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "◉" : "◎"}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="remember-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Ingat sesi perangkat ini
            </label>

            <span className="lab-version">Lab Guard v2</span>
          </div>

          <button type="submit" className="submit-button">
            ↪ Masuk ke Sistem
          </button>

        </form>

        <div className="register-text">
          Belum memiliki akun praktikum?

          <button
            type="button"
            onClick={() => setActiveTab("register")}
          >
            Daftar sekarang
          </button>
        </div>

        <footer className="login-footer">
          <div className="footer-status">
            <span className="online-dot"></span>
            SSO Server Online
            <span>•</span>
            Enkripsi 256-bit
            <span>•</span>
            IoT-RACK #01 READY
          </div>

          <p>
            © 2025 Laboratorium Sistem Tertanam & IoT Terapan.
          </p>
        </footer>

      </div>
    </main>
  );
}
