
"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Box,
  FileText,
  History,
  Search,
  CalendarDays,
  Clock3,
  Package,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  ClipboardList,
  UserRound,
  MapPin,
  LoaderCircle,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

// ============================================
// HELPER
// ============================================

function formatDate(value) {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(value) {
  if (!value) return "-";

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function getStatusInfo(status) {
  const statuses = {
    menunggu: {
      label: "Menunggu",
      className: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock3,
      description: "Permintaan sedang diproses oleh sistem.",
    },
    disetujui: {
      label: "Disetujui",
      className: "bg-blue-50 text-blue-700 border-blue-200",
      icon: CheckCircle2,
      description: "Peminjaman disetujui. Silakan menunggu penyerahan alat oleh kepala lab.",
    },
    ditolak: {
      label: "Ditolak",
      className: "bg-rose-50 text-rose-700 border-rose-200",
      icon: XCircle,
      description: "Permintaan peminjaman tidak dapat dipenuhi.",
    },
    sedang_dipinjam: {
      label: "Sedang Dipinjam",
      className: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: Package,
      description: "Alat telah diserahkan dan sedang dalam masa peminjaman.",
    },
    selesai: {
      label: "Selesai",
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: CheckCircle2,
      description: "Alat telah dikembalikan dan transaksi selesai.",
    },
  };

  return statuses[status] || {
    label: status || "Tidak diketahui",
    className: "bg-slate-100 text-slate-600 border-slate-200",
    icon: AlertCircle,
    description: "Status transaksi tidak dikenali.",
  };
}

function getTransactionItems(transaction) {
  return (
    transaction?.details ||
    transaction?.detail_peminjaman ||
    []
  );
}

function getTransactionCode(transaction) {
  return (
    transaction?.kode_transaksi ||
    `PJM-${transaction?.id_peminjaman || "-"}`
  );
}

// ============================================
// PAGE
// ============================================

export default function RiwayatPage() {
  const router = useRouter();
  const { user, loading, authenticated } = useAuth();

  const [transactions, setTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailTransaction, setDetailTransaction] = useState(null);

  const [activeTab, setActiveTab] = useState("semua");
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");

  // ============================================
  // AUTHENTICATION & ROLE PROTECTION
  // ============================================

  useEffect(() => {
    if (loading) return;

    if (!authenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "mahasiswa") {
      router.replace(
        user.role === "kepala_lab"
          ? "/admin/dashboard"
          : "/login"
      );
    }
  }, [loading, authenticated, user, router]);

  // ============================================
  // FETCH HISTORY
  // ============================================

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHistory(true);
      setError("");

      const result = await apiRequest("/peminjaman?per_page=100");

      // Laravel pagination:
      // result.data.data = daftar transaksi
      const rows = Array.isArray(result?.data?.data)
        ? result.data.data
        : Array.isArray(result?.data)
          ? result.data
          : [];

      setTransactions(rows);

      if (rows.length > 0) {
        const firstTransaction = rows[0];

        setSelectedTransaction(firstTransaction);
        await fetchTransactionDetail(firstTransaction.id_peminjaman);
      } else {
        setSelectedTransaction(null);
        setDetailTransaction(null);
      }
    } catch (err) {
      console.error("Gagal mengambil riwayat peminjaman:", err);
      setError(err.message || "Gagal mengambil data riwayat peminjaman.");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ============================================
  // FETCH TRANSACTION DETAIL
  // ============================================

  const fetchTransactionDetail = async (id) => {
    if (!id) return;

    try {
      setLoadingDetail(true);

      const result = await apiRequest(`/peminjaman/${id}`);

      const detail =
        result?.data?.data ||
        result?.data ||
        null;

      setDetailTransaction(detail);
    } catch (err) {
      console.error("Gagal mengambil detail peminjaman:", err);

      // Tetap gunakan data dari daftar jika detail gagal dimuat.
      setDetailTransaction(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    if (
      loading ||
      !authenticated ||
      !user ||
      user.role !== "mahasiswa"
    ) {
      return;
    }

    fetchHistory();
  }, [loading, authenticated, user, fetchHistory]);

  // ============================================
  // SELECT TRANSACTION
  // ============================================

  const handleSelectTransaction = async (transaction) => {
    setSelectedTransaction(transaction);
    setDetailTransaction(null);

    await fetchTransactionDetail(transaction.id_peminjaman);
  };

  // ============================================
  // FILTER & SEARCH
  // ============================================

  const filterTabs = [
    { value: "semua", label: "Semua" },
    { value: "menunggu", label: "Menunggu" },
    { value: "disetujui", label: "Disetujui" },
    { value: "sedang_dipinjam", label: "Dipinjam" },
    { value: "selesai", label: "Selesai" },
    { value: "ditolak", label: "Ditolak" },
  ];

  const filteredTransactions = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase();

    return transactions.filter((transaction) => {
      const matchesTab =
        activeTab === "semua" ||
        transaction.status_peminjaman === activeTab;

      const items = getTransactionItems(transaction);

      const itemNames = items
        .map((item) => item?.inventaris?.nama_barang || "")
        .join(" ");

      const matchesSearch =
        !keyword ||
        getTransactionCode(transaction).toLowerCase().includes(keyword) ||
        (transaction.tujuan_praktikum || "").toLowerCase().includes(keyword) ||
        itemNames.toLowerCase().includes(keyword);

      return matchesTab && matchesSearch;
    });
  }, [transactions, activeTab, searchQuery]);

  // ============================================
  // SELECTED DATA
  // ============================================

  const currentTransaction = detailTransaction || selectedTransaction;
  const currentStatus = getStatusInfo(
    currentTransaction?.status_peminjaman
  );

  const currentItems = getTransactionItems(currentTransaction);

  // ============================================
  // RENDER
  // ============================================

  if (loading || (authenticated && user?.role !== "mahasiswa")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex items-center gap-3 text-slate-500 text-sm">
          <LoaderCircle className="animate-spin" size={20} />
          Memeriksa akses...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-sm text-slate-800">

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
        <div className="p-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold text-white tracking-wider text-base">
              SIPL-IoT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            IOT LABORATORY
          </p>
        </div>

        <div className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Mode Akses: Mahasiswa
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/inventaris"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <Box size={18} />
            <span>Katalog & Cari Alat</span>
          </Link>

          <Link
            href="/peminjaman"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <FileText size={18} />
            <span>Pengajuan Peminjaman</span>
          </Link>

          <Link
            href="/riwayat"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white font-medium"
          >
            <History size={18} />
            <span>Riwayat Peminjaman</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center">
              <UserRound size={18} className="text-slate-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user?.nama || "Mahasiswa"}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                {user?.nip_nim || "-"}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ========================================
          MAIN CONTENT
      ======================================== */}

      <main className="flex-1 min-w-0 flex flex-col">

        {/* HEADER */}

        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 sticky top-0 z-10">
          <div className="text-slate-500 text-xs font-medium">
            SIPL-IoT / Mahasiswa /
            <span className="text-slate-800 font-semibold">
              {" "}Riwayat Peminjaman
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <h4 className="font-semibold text-slate-800 text-xs">
                {user?.nama || "Mahasiswa"}
              </h4>
              <p className="text-[11px] text-slate-400">
                NIM: {user?.nip_nim || "-"}
              </p>
            </div>

            <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
              <UserRound size={18} className="text-blue-600" />
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 space-y-6">

          {/* PAGE TITLE */}

          <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900">
                Riwayat Peminjaman
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Pantau status pengajuan, alat yang dipinjam, dan tenggat pengembalian.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchHistory}
                disabled={loadingHistory}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
              >
                <RefreshCw
                  size={14}
                  className={loadingHistory ? "animate-spin" : ""}
                />
                Perbarui Data
              </button>

              <Link
                href="/peminjaman"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
              >
                <FileText size={14} />
                Pinjam Alat
              </Link>
            </div>
          </section>

          {/* ERROR */}

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-xs">
                  Gagal memuat riwayat peminjaman
                </p>
                <p className="text-xs mt-1">{error}</p>
                <button
                  onClick={fetchHistory}
                  className="text-xs font-semibold underline mt-2"
                >
                  Coba lagi
                </button>
              </div>
            </div>
          )}

          {/* CONTENT GRID */}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* ====================================
                LEFT: TRANSACTION LIST
            ==================================== */}

            <section className="lg:col-span-5 space-y-4">

              {/* SEARCH */}

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari kode transaksi, tujuan, atau nama alat..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* FILTER TABS */}

              <div className="flex flex-wrap gap-1.5">
                {filterTabs.map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${activeTab === tab.value
<<<<<<< HEAD
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
=======
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
>>>>>>> 7245c0d5573cc88918a2fb911acc17aaab2926de
                      }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TRANSACTION COUNT */}

              <div className="flex justify-between items-center px-1">
                <p className="text-xs font-semibold text-slate-700">
                  Daftar Transaksi
                </p>
                <span className="text-[11px] text-slate-400">
                  {filteredTransactions.length} transaksi
                </span>
              </div>

              {/* LOADING */}

              {loadingHistory && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center text-slate-400">
                  <LoaderCircle size={24} className="animate-spin mb-2" />
                  <p className="text-xs">Memuat riwayat peminjaman...</p>
                </div>
              )}

              {/* EMPTY */}

              {!loadingHistory && !error && filteredTransactions.length === 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center">
                  <ClipboardList
                    size={32}
                    className="mx-auto text-slate-300 mb-3"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    Tidak ada transaksi
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {transactions.length === 0
                      ? "Kamu belum memiliki riwayat peminjaman."
                      : "Tidak ada transaksi yang sesuai dengan pencarian atau filter."}
                  </p>

                  {transactions.length === 0 && (
                    <Link
                      href="/peminjaman"
                      className="inline-flex mt-4 items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
                    >
                      Ajukan peminjaman
                      <ChevronRight size={14} />
                    </Link>
                  )}
                </div>
              )}

              {/* TRANSACTION CARDS */}

              {!loadingHistory && filteredTransactions.length > 0 && (
                <div className="space-y-3">
                  {filteredTransactions.map((transaction) => {
                    const status = getStatusInfo(
                      transaction.status_peminjaman
                    );

                    const isSelected =
                      selectedTransaction?.id_peminjaman ===
                      transaction.id_peminjaman;

                    const items = getTransactionItems(transaction);

                    const itemSummary = items
                      .map((item) => {
                        const name =
                          item?.inventaris?.nama_barang || "Alat";

                        return `${name} (${item.jumlah_pinjam}x)`;
                      })
                      .join(", ");

                    return (
                      <button
                        key={transaction.id_peminjaman}
                        onClick={() => handleSelectTransaction(transaction)}
                        className={`w-full text-left bg-white p-4 rounded-xl border transition ${isSelected
<<<<<<< HEAD
                          ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
                          : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
=======
                            ? "border-blue-500 ring-2 ring-blue-500/10 shadow-sm"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
>>>>>>> 7245c0d5573cc88918a2fb911acc17aaab2926de
                          }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-mono font-bold text-xs text-slate-800 break-all">
                            {getTransactionCode(transaction)}
                          </span>

                          <span
                            className={`shrink-0 px-2 py-1 text-[10px] rounded-full border font-semibold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                          <CalendarDays size={12} />
                          {formatDateTime(transaction.tgl_pengajuan)}
                        </div>

                        <p className="text-xs text-slate-700 mt-3 line-clamp-2">
                          {itemSummary || transaction.tujuan_praktikum || "Detail alat belum tersedia"}
                        </p>

                        <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-100">
                          <span className="text-[10px] text-slate-400">
                            {items.length} jenis alat
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 flex items-center gap-1">
                            Lihat detail
                            <ChevronRight size={12} />
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ====================================
                RIGHT: TRANSACTION DETAIL
            ==================================== */}

            <section className="lg:col-span-7 space-y-4">

              {!currentTransaction && !loadingHistory && (
                <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
                  <ClipboardList
                    size={36}
                    className="mx-auto text-slate-300 mb-3"
                  />
                  <p className="text-sm font-semibold text-slate-700">
                    Belum ada transaksi dipilih
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Pilih transaksi dari daftar untuk melihat detailnya.
                  </p>
                </div>
              )}

              {currentTransaction && (
                <>
                  {/* TRANSACTION HEADER */}

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 border-b border-slate-100 pb-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                          Detail Transaksi Peminjaman
                        </span>
                        <h3 className="font-bold text-slate-900 text-base font-mono mt-1 break-all">
                          {getTransactionCode(currentTransaction)}
                        </h3>
                      </div>

                      <span
                        className={`self-start px-3 py-1.5 rounded-full text-xs font-semibold border ${currentStatus.className}`}
                      >
                        {currentStatus.label}
                      </span>
                    </div>

                    <div className="flex items-start gap-3 bg-slate-50 border border-slate-100 rounded-xl p-3">
                      <currentStatus.icon
                        size={18}
                        className="text-slate-500 shrink-0 mt-0.5"
                      />
                      <p className="text-xs text-slate-600">
                        {currentStatus.description}
                      </p>
                    </div>

                    {/* REJECTION REASON */}

                    {currentTransaction.status_peminjaman === "ditolak" &&
                      currentTransaction.alasan_penolakan && (
                        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                          <div className="flex items-center gap-2 text-rose-700 font-semibold text-xs">
                            <AlertCircle size={15} />
                            Alasan Penolakan
                          </div>
                          <p className="text-xs text-rose-700 mt-2 leading-relaxed">
                            {currentTransaction.alasan_penolakan}
                          </p>
                        </div>
                      )}

                    {/* STUDENT & PURPOSE */}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Nama Peminjam
                        </p>
                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {user?.nama || "-"}
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          NIM: {user?.nip_nim || "-"}
                        </p>
                      </div>

                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">
                          Tanggal Pengajuan
                        </p>
                        <p className="text-xs font-semibold text-slate-800 mt-1">
                          {formatDateTime(currentTransaction.tgl_pengajuan)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">
                        Tujuan Praktikum
                      </p>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap">
                        {currentTransaction.tujuan_praktikum || "-"}
                      </p>
                    </div>
                  </div>

                  {/* SCHEDULE */}

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="font-bold text-slate-900 text-sm mb-4">
                      Jadwal Peminjaman
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-blue-700">
                          <CalendarDays size={16} />
                          <span className="text-xs font-semibold">
                            Tanggal Pinjam
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-3">
                          {formatDateTime(currentTransaction.tgl_pinjam)}
                        </p>
                      </div>

                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 text-rose-700">
                          <Clock3 size={16} />
                          <span className="text-xs font-semibold">
                            Tenggat Pengembalian
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-3">
                          {formatDateTime(currentTransaction.due_date)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* ITEM LIST */}

                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">
                          Daftar Alat Dipinjam
                        </h3>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Rincian barang dalam transaksi ini.
                        </p>
                      </div>

                      <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg font-medium">
                        {currentItems.length} jenis alat
                      </span>
                    </div>

                    {loadingDetail ? (
                      <div className="py-8 flex items-center justify-center gap-2 text-slate-400">
                        <LoaderCircle size={18} className="animate-spin" />
                        <span className="text-xs">Memuat detail transaksi...</span>
                      </div>
                    ) : currentItems.length === 0 ? (
                      <div className="py-8 text-center text-xs text-slate-400">
                        Detail alat tidak tersedia.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {currentItems.map((item, index) => {
                          const inventory = item.inventaris || {};

                          return (
                            <div
                              key={item.id_detail || index}
                              className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition"
                            >
                              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                <Package
                                  size={19}
                                  className="text-blue-600"
                                />
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800">
                                  {inventory.nama_barang || "Nama alat tidak tersedia"}
                                </p>

                                <p className="text-[11px] text-slate-400 mt-1">
                                  Kode: {inventory.kode_barang || "-"}
                                </p>

                                {inventory.lokasi && (
                                  <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                    <MapPin size={11} />
                                    {inventory.lokasi.nama_lemari || "Lokasi"}
                                    {inventory.lokasi.nomor_box
                                      ? ` • Box ${inventory.lokasi.nomor_box}`
                                      : ""}
                                  </p>
                                )}
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-xs font-bold text-slate-800">
                                  {item.jumlah_pinjam} unit
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1">
                                  Jumlah
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* TRANSACTION FOOTER */}

                  <div className="bg-slate-900 rounded-xl p-5 text-white">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                        <ClipboardList size={18} />
                      </div>

                      <div>
                        <h3 className="text-xs font-bold">
                          Informasi Transaksi
                        </h3>
                        <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                          Simpan kode transaksi ini sebagai referensi saat
                          berkomunikasi dengan kepala laboratorium terkait
                          penyerahan maupun pengembalian alat.
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 flex justify-between items-center gap-3">
                      <span className="text-[10px] text-slate-400">
                        Kode Transaksi
                      </span>
                      <span className="font-mono text-xs font-semibold text-blue-300 break-all text-right">
                        {getTransactionCode(currentTransaction)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
