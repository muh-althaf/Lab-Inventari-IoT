
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import {
  LayoutDashboard, Box, FileText, History, BookOpen,
  LogOut, Search, Package, MapPin, ArrowUpRight,
  AlertCircle, RefreshCw, Cpu
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, authenticated, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (loading) return;

    if (!authenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role === "kepala_lab") {
      router.replace("/admin/dashboard");
    }
  }, [loading, authenticated, user, router]);

  async function loadInventory() {
    try {
      setFetching(true);
      setError("");

      const result = await apiRequest("/inventaris?per_page=100");
      const paginator = result.data;

      setItems(Array.isArray(paginator?.data) ? paginator.data : []);
      setPagination(paginator);
    } catch (err) {
      setError(err.message || "Gagal mengambil data inventaris.");
    } finally {
      setFetching(false);
    }
  }

  useEffect(() => {
    if (authenticated && user?.role === "mahasiswa") {
      loadInventory();
    }
  }, [authenticated, user]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (loading || !authenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        Memverifikasi sesi pengguna...
      </div>
    );
  }

  const totalBarang = items.reduce(
    (total, item) => total + Number(item.jumlah_total || 0), 0
  );

  const totalTersedia = items.reduce(
    (total, item) => total + Number(item.jumlah_tersedia || 0), 0
  );

  const totalHabis = items.filter(
    (item) => Number(item.jumlah_tersedia || 0) <= 0
  ).length;

  const latestItems = [...items].slice(0, 6);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 grid place-items-center">
              <Cpu size={21} />
            </div>
            <div>
              <h1 className="font-bold text-white tracking-wide">SIPL-IoT</h1>
              <p className="text-[10px] text-slate-500">Laboratory System</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-slate-500">
            Menu Mahasiswa
          </p>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-600 text-white text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          <Link href="/inventaris" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 text-sm">
            <Box size={18} /> Katalog Inventaris
          </Link>

          <Link href="/peminjaman" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 text-sm">
            <FileText size={18} /> Pengajuan Peminjaman
          </Link>

          <Link href="/riwayat" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 text-sm">
            <History size={18} /> Riwayat Peminjaman
          </Link>
        </nav>

        <div className="p-3 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-rose-400 hover:bg-rose-950/40 text-sm">
            <LogOut size={18} /> Keluar Sistem
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 px-5 md:px-8 py-4 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-400">SIPL-IoT / Dashboard</p>
            <h2 className="font-bold text-slate-800">Dashboard Mahasiswa</h2>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">{user.nama}</p>
            <p className="text-xs text-slate-400">{user.nip_nim}</p>
          </div>
        </header>

        <div className="p-5 md:p-8 space-y-6 max-w-7xl mx-auto">
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
              <div>
                <p className="text-sm text-blue-600 font-semibold">Portal Mahasiswa</p>
                <h1 className="text-2xl font-bold mt-1">
                  Selamat datang, {user.nama}
                </h1>
                <p className="text-sm text-slate-500 mt-2">
                  Pantau ketersediaan perangkat Laboratorium IoT.
                </p>
              </div>

              <Link href="/inventaris" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-3 text-sm font-semibold">
                Lihat Inventaris <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-7">
              <StatCard
                title="Jenis Barang"
                value={fetching ? "..." : items.length}
                description="Jumlah jenis inventaris"
                icon={<Package size={20} />}
              />
              <StatCard
                title="Total Unit"
                value={fetching ? "..." : totalBarang}
                description="Akumulasi seluruh unit"
                icon={<Box size={20} />}
              />
              <StatCard
                title="Unit Tersedia"
                value={fetching ? "..." : totalTersedia}
                description={`${totalHabis} jenis barang stok kosong`}
                icon={<MapPin size={20} />}
              />
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center gap-3 mb-5">
              <div>
                <h2 className="font-bold text-lg">Inventaris Terbaru</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Data barang yang tersedia di laboratorium.
                </p>
              </div>

              <button onClick={loadInventory} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50" title="Muat ulang">
                <RefreshCw size={16} />
              </button>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm flex gap-2">
                <AlertCircle size={18} /> {error}
              </div>
            )}

            {fetching ? (
              <p className="text-sm text-slate-400 py-10 text-center">Memuat data inventaris...</p>
            ) : latestItems.length === 0 ? (
              <p className="text-sm text-slate-400 py-10 text-center">Belum ada data inventaris.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {latestItems.map((item) => (
                  <article key={item.id_barang} className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition">
                    <div className="flex justify-between items-start gap-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                        <Package size={20} />
                      </div>
                      <StockBadge available={item.jumlah_tersedia} />
                    </div>

                    <h3 className="font-semibold mt-3 line-clamp-2">{item.nama_barang}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {item.kode_barang || `ID: ${item.id_barang}`}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 space-y-1">
                      <p>Total: <strong className="text-slate-700">{item.jumlah_total}</strong></p>
                      <p>Tersedia: <strong className="text-slate-700">{item.jumlah_tersedia}</strong></p>
                      <p className="line-clamp-1">
                        Lokasi: {item.lokasi?.nama_lemari || "-"} / {item.lokasi?.nomor_box || "-"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-5 text-center">
              <Link href="/inventaris" className="text-sm font-semibold text-blue-600 hover:underline">
                Lihat seluruh inventaris →
              </Link>
            </div>
          </section>

          <section className="bg-blue-50 border border-blue-100 rounded-2xl p-5 flex gap-3">
            <BookOpen className="text-blue-600 shrink-0" size={20} />
            <div>
              <h3 className="font-semibold text-blue-900">Panduan penggunaan laboratorium</h3>
              <p className="text-sm text-blue-800/80 mt-1">
                Pastikan memeriksa ketersediaan dan kondisi barang sebelum mengajukan peminjaman.
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function StatCard({ title, value, description, icon }) {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
      <div className="flex justify-between items-center">
        <p className="text-xs font-semibold text-slate-500 uppercase">{title}</p>
        <span className="text-blue-600">{icon}</span>
      </div>
      <p className="text-3xl font-bold mt-3">{value}</p>
      <p className="text-xs text-slate-400 mt-1">{description}</p>
    </div>
  );
}

function StockBadge({ available }) {
  const empty = Number(available) <= 0;

  return (
    <span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${empty
<<<<<<< HEAD
      ? "bg-rose-50 text-rose-600"
      : "bg-emerald-50 text-emerald-700"
=======
        ? "bg-rose-50 text-rose-600"
        : "bg-emerald-50 text-emerald-700"
>>>>>>> 7245c0d5573cc88918a2fb911acc17aaab2926de
      }`}>
      {empty ? "Stok kosong" : "Tersedia"}
    </span>
  );
}
