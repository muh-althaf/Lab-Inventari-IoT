
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import {
  Cpu,
  Eye,
  EyeOff,
  User,
  Mail,
  Lock,
  Hash,
  ArrowRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");

const inputClass =
  "w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-10 py-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition";

export default function AuthPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [fieldErrors, setFieldErrors] = useState({});

  const [loginData, setLoginData] = useState({
    identity: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    nama: "",
    nip_nim: "",
    email: "",
    password: "",
    password_confirmation: "",
  });

  const showFeedback = (text, type = "error") => {
    setMessage(text);
    setMessageType(type);
  };

  const getErrorMessage = (data) => {
    if (data.errors) {
      return Object.values(data.errors).flat()[0] ||
        data.message ||
        "Validasi gagal.";
    }

    return data.message || "Terjadi kesalahan pada server.";
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setMessage("");
    setFieldErrors({});
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  // =========================================
  // LOGIN
  // =========================================

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");
    setFieldErrors({});

    try {
      if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL belum dikonfigurasi.");
      }

      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          identity: loginData.identity.trim(),
          password: loginData.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showFeedback(getErrorMessage(result));
        setFieldErrors(result.errors || {});
        return;
      }

      const { token, user } = result.data || {};

      if (!token || !user) {
        throw new Error("Respons login tidak lengkap.");
      }

      // Bersihkan token lama.
      localStorage.removeItem("sipl_token");
      localStorage.removeItem("sipl_user");
      sessionStorage.removeItem("sipl_token");
      sessionStorage.removeItem("sipl_user");

      // Simpan token sesuai pilihan pengguna.
      const storage = remember ? localStorage : sessionStorage;

      storage.setItem("sipl_token", token);
      storage.setItem("sipl_user", JSON.stringify(user));

      // Verifikasi ulang melalui endpoint /auth/me.
      const currentUser = await refreshUser();

      if (!currentUser) {
        throw new Error(
          "Token berhasil diterima, tetapi verifikasi sesi gagal."
        );
      }

      showFeedback("Login berhasil. Mengalihkan halaman...", "success");

      // Redirect berdasarkan role database.
      if (currentUser.role === "mahasiswa") {
        router.replace("/dashboard");
      } else if (currentUser.role === "kepala_lab") {
        router.replace("/admin/dashboard");
      } else {
        localStorage.removeItem("sipl_token");
        localStorage.removeItem("sipl_user");
        sessionStorage.removeItem("sipl_token");
        sessionStorage.removeItem("sipl_user");

        throw new Error("Role pengguna tidak dikenali.");
      }
    } catch (error) {
      showFeedback(
        error.message || "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // REGISTER
  // =========================================

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    setMessage("");
    setFieldErrors({});

    if (!agreeTerms) {
      showFeedback("Silakan setujui SOP dan aturan laboratorium.");
      return;
    }

    if (
      registerData.password !==
      registerData.password_confirmation
    ) {
      showFeedback("Konfirmasi password tidak cocok.");
      return;
    }

    if (registerData.password.length < 8) {
      showFeedback("Password minimal 8 karakter.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nama: registerData.nama.trim(),
          nip_nim: registerData.nip_nim.trim(),
          email: registerData.email.trim(),
          password: registerData.password,
          password_confirmation:
            registerData.password_confirmation,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showFeedback(getErrorMessage(result));
        setFieldErrors(result.errors || {});
        return;
      }

      showFeedback(
        result.message || "Registrasi berhasil. Silakan login.",
        "success"
      );

      setRegisterData({
        nama: "",
        nip_nim: "",
        email: "",
        password: "",
        password_confirmation: "",
      });

      setAgreeTerms(false);

      setTimeout(() => {
        setActiveTab("login");
        setLoginData({
          identity: "",
          password: "",
        });
        setMessage("Akun berhasil dibuat. Silakan login.");
        setMessageType("success");
      }, 1200);
    } catch (error) {
      showFeedback(
        error.message || "Tidak dapat terhubung ke server."
      );
    } finally {
      setLoading(false);
    }
  };

  // Komponen input error.
  const ErrorText = ({ field }) => {
    if (!fieldErrors[field]) return null;

    return (
      <p className="text-[11px] text-red-400 mt-1">
        {fieldErrors[field][0]}
      </p>
    );
  };

  const Field = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    icon: Icon,
    autoComplete,
    passwordToggle,
  }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-slate-300">
        {label}
      </label>

      <div className="relative">
        <Icon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        />

        <input
          type={passwordToggle ? (showPassword ? "text" : "password") : type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className={inputClass}
        />

        {passwordToggle && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      <ErrorText field={name} />
    </div>
  );

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">

        {/* BRAND */}
        <div className="flex justify-between items-center">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Cpu size={27} />
          </div>

          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse ring-4 ring-emerald-500/20" />
        </div>

        {/* HEADER */}
        <div className="space-y-2">
          <span className="inline-flex px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] font-semibold tracking-wider text-slate-400">
            NODE SIPL-IOT • V2.4.0
          </span>

          <h1 className="text-2xl font-bold text-white">
            {activeTab === "login"
              ? "SIPL-IoT Portal"
              : "Pendaftaran Akun"}
          </h1>

          <p className="text-xs text-slate-400">
            Sistem Informasi Peminjaman & Inventaris Laboratorium IoT
          </p>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 p-1 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleTabChange("login")}
            className={`py-2.5 rounded-lg transition ${activeTab === "login"
                ? "bg-blue-600 text-white"
                : "text-slate-400"
              }`}
          >
            Masuk
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("register")}
            className={`py-2.5 rounded-lg transition ${activeTab === "register"
                ? "bg-blue-600 text-white"
                : "text-slate-400"
              }`}
          >
            Daftar Baru
          </button>
        </div>

        {/* NOTICE */}
        <div className="bg-blue-950/40 border border-blue-900/60 rounded-xl p-3 text-xs text-blue-300">
          {activeTab === "login"
            ? "Gunakan NIM atau email yang telah terdaftar pada sistem SIPL-IoT."
            : "Pastikan NIM dan Email Kampus sesuai dengan data akademik."}
        </div>

        {/* FEEDBACK */}
        {message && (
          <div
            role="alert"
            className={`rounded-xl border p-3 text-xs flex gap-2 ${messageType === "success"
                ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                : "bg-red-950/40 border-red-900 text-red-300"
              }`}
          >
            {messageType === "success"
              ? <CheckCircle2 size={16} />
              : <AlertCircle size={16} />}

            <span>{message}</span>
          </div>
        )}

        {/* LOGIN */}
        {activeTab === "login" ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <Field
              label="NIM atau Email"
              name="identity"
              value={loginData.identity}
              onChange={(e) =>
                setLoginData({
                  ...loginData,
                  identity: e.target.value,
                })
              }
              placeholder="NIM atau nama@student.ac.id"
              icon={User}
              autoComplete="username"
            />

            <div className="space-y-1.5">
              <div className="flex justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Kata Sandi
                </label>

                <a
                  href="/lupa-password"
                  className="text-[11px] text-blue-400 hover:underline"
                >
                  Lupa Password?
                </a>
              </div>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={loginData.password}
                  onChange={(e) =>
                    setLoginData({
                      ...loginData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Masukkan kata sandi"
                  autoComplete="current-password"
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <ErrorText field="password" />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="accent-blue-600"
              />
              Ingat sesi perangkat ini
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Memproses login...
                </>
              ) : (
                <>
                  Masuk ke Sistem
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* REGISTER */
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
            <Field
              label="Nama Lengkap"
              name="nama"
              value={registerData.nama}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  nama: e.target.value,
                })
              }
              placeholder="Nama lengkap"
              icon={User}
              autoComplete="name"
            />

            <Field
              label="NIM"
              name="nip_nim"
              value={registerData.nip_nim}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  nip_nim: e.target.value,
                })
              }
              placeholder="Masukkan NIM"
              icon={Hash}
              autoComplete="username"
            />

            <Field
              label="Email Student"
              name="email"
              type="email"
              value={registerData.email}
              onChange={(e) =>
                setRegisterData({
                  ...registerData,
                  email: e.target.value,
                })
              }
              placeholder="nama@student.ac.id"
              icon={Mail}
              autoComplete="email"
            />

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Kata Sandi
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type={showPassword ? "text" : "password"}
                  value={registerData.password}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password: e.target.value,
                    })
                  }
                  placeholder="Minimal 8 karakter"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <ErrorText field="password" />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-300">
                Konfirmasi Kata Sandi
              </label>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />

                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={registerData.password_confirmation}
                  onChange={(e) =>
                    setRegisterData({
                      ...registerData,
                      password_confirmation: e.target.value,
                    })
                  }
                  placeholder="Ulangi kata sandi"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  className={inputClass}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <ErrorText field="password_confirmation" />
            </div>

            <label className="flex items-start gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="accent-blue-600 mt-0.5"
              />
              Saya menyetujui SOP dan aturan penggunaan Laboratorium IoT.
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white font-semibold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Membuat akun...
                </>
              ) : (
                <>
                  Buat Akun Praktikum
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        )}

        {/* FOOTER */}
        <div className="text-center text-xs text-slate-400 border-t border-slate-800 pt-4">
          {activeTab === "login" ? (
            <>
              Belum memiliki akun?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("register")}
                className="text-blue-400 font-semibold"
              >
                Daftar sekarang
              </button>
            </>
          ) : (
            <>
              Sudah memiliki akun?{" "}
              <button
                type="button"
                onClick={() => handleTabChange("login")}
                className="text-blue-400 font-semibold"
              >
                Masuk sekarang
              </button>
            </>
          )}
        </div>

        <footer className="text-center text-[10px] text-slate-500 space-y-2">
          <p>Sanctum Authentication • SIPL-IoT</p>
          <p>© 2026 Laboratorium Sistem Tertanam & IoT Terapan.</p>
        </footer>
      </div>
    </main>
  );
}