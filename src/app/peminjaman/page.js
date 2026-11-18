
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Box,
  FileText,
  History,
  Search,
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
  RefreshCw,
  LogOut,
  Package,
  MapPin,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";

// Menghasilkan format YYYY-MM-DDTHH:mm berdasarkan waktu lokal browser.
function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;

  return new Date(now.getTime() - offset)
    .toISOString()
    .slice(0, 16);
}

// Format tanggal agar mudah dibaca.
function formatDate(date) {
  if (!date) return "-";

  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

export default function PeminjamanPage() {
  const router = useRouter();
  const { user, loading, authenticated, logout } = useAuth();

  const [catalog, setCatalog] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [tujuanPraktikum, setTujuanPraktikum] = useState("");

  const [tglPinjam, setTglPinjam] = useState("");
  const [minDateTime, setMinDateTime] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const [showResultModal, setShowResultModal] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);

  useEffect(() => {
    const now = getLocalDateTime();

    setMinDateTime(now);
    setTglPinjam(now);
  }, []);

  // Proteksi halaman berdasarkan autentikasi dan role.
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

  // Mengambil data inventaris dari Laravel.
  const fetchCatalog = async () => {
    try {
      setLoadingCatalog(true);
      setError("");

      const result = await apiRequest(
        "/inventaris?per_page=100"
      );

      const inventory = result?.data?.data || [];

      // Hanya tampilkan barang yang memiliki stok dan tersedia.
      const available = inventory.filter((item) => {
        return (
          Number(item.jumlah_tersedia) > 0 &&
          item.status_barang === "tersedia"
        );
      });

      setCatalog(available);
    } catch (err) {
      console.error("Gagal mengambil inventaris:", err);
      setError(
        err.message || "Gagal mengambil data inventaris."
      );
    } finally {
      setLoadingCatalog(false);
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

    fetchCatalog();
  }, [loading, authenticated, user]);

  // Filter pencarian katalog.
  const filteredCatalog = useMemo(() => {
    const keyword = searchQuery.toLowerCase().trim();

    if (!keyword) return catalog;

    return catalog.filter((item) => {
      return (
        item.nama_barang?.toLowerCase().includes(keyword) ||
        item.kode_barang?.toLowerCase().includes(keyword) ||
        item.spesifikasi?.toLowerCase().includes(keyword)
      );
    });
  }, [catalog, searchQuery]);

  // Notifikasi sederhana.
  const showToast = (message) => {
    setToastMessage(message);

    setTimeout(() => {
      setToastMessage("");
    }, 3000);
  };

  // Tambahkan barang ke daftar pengajuan.
  const addToolToForm = (tool) => {
    const alreadySelected = selectedTools.some(
      (item) => item.id_barang === tool.id_barang
    );

    if (alreadySelected) {
      showToast("Barang sudah ada dalam daftar pengajuan.");
      return;
    }

    if (selectedTools.length >= 5) {
      showToast("Maksimal 5 jenis barang dalam satu pengajuan.");
      return;
    }

    setSelectedTools((previous) => [
      ...previous,
      {
        id_barang: tool.id_barang,
        kode_barang: tool.kode_barang,
        nama_barang: tool.nama_barang,
        spesifikasi: tool.spesifikasi,
        jumlah_tersedia: Number(tool.jumlah_tersedia),
        lokasi: tool.lokasi,
        jumlah_pinjam: 1,
      },
    ]);

    showToast(`${tool.nama_barang} ditambahkan.`);
  };

  // Hapus barang dari daftar.
  const removeTool = (idBarang) => {
    setSelectedTools((previous) =>
      previous.filter((item) => item.id_barang !== idBarang)
    );
  };

  // Mengubah jumlah barang.
  const updateQty = (idBarang, value) => {
    const quantity = Number(value);

    setSelectedTools((previous) =>
      previous.map((item) => {
        if (item.id_barang !== idBarang) return item;

        return {
          ...item,
          jumlah_pinjam: Math.max(
            1,
            Math.min(
              item.jumlah_tersedia,
              Number.isFinite(quantity) ? quantity : 1
            )
          ),
        };
      })
    );
  };

  // Lokasi penyimpanan barang.
  const getLocation = (item) => {
    if (!item.lokasi) return "Lokasi tidak diketahui";

    return [
      item.lokasi.nama_lemari,
      item.lokasi.nomor_box
        ? `Box ${item.lokasi.nomor_box}`
        : null,
    ]
      .filter(Boolean)
      .join(" • ");
  };

  // Validasi dan kirim pengajuan.
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setFieldErrors({});

    if (selectedTools.length === 0) {
      showToast("Pilih minimal satu barang.");
      return;
    }

    if (!tujuanPraktikum.trim()) {
      setFieldErrors({
        tujuan_praktikum: "Alasan peminjaman wajib diisi.",
      });
      return;
    }

    if (!tglPinjam || !dueDate) {
      showToast("Tanggal pinjam dan batas pengembalian wajib diisi.");
      return;
    }

    if (new Date(dueDate) <= new Date(tglPinjam)) {
      setFieldErrors({
        due_date: "Batas pengembalian harus setelah tanggal pinjam.",
      });
      return;
    }

    const payload = {
      tujuan_praktikum: tujuanPraktikum.trim(),

      // Format datetime-local dikirim sebagai tanggal dan waktu.
      tgl_pinjam: tglPinjam.replace("T", " ") + ":00",
      due_date: dueDate.replace("T", " ") + ":00",

      items: selectedTools.map((item) => ({
        id_barang: item.id_barang,
        jumlah_pinjam: item.jumlah_pinjam,
      })),
    };

    try {
      setSubmitting(true);

      const result = await apiRequest("/peminjaman", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const transaction = result?.data;

      setSubmissionResult({
        message: result?.message,
        data: transaction,
      });

      setShowResultModal(true);

      // Muat ulang katalog agar stok terbaru ditampilkan.
      await fetchCatalog();
    } catch (err) {
      console.error("Pengajuan gagal:", err);

      if (err.errors) {
        setFieldErrors(err.errors);
      }

      setError(
        err.message || "Pengajuan peminjaman gagal dikirim."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const closeResultModal = () => {
    setShowResultModal(false);

    if (
      submissionResult?.data?.status_peminjaman === "disetujui" ||
      submissionResult?.data?.status_peminjaman === "ditolak"
    ) {
      router.push("/riwayat");
    }
  };

  if (loading || !authenticated || user?.role !== "mahasiswa") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <RefreshCw className="animate-spin text-blue-600" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 text-sm relative">

      {/* TOAST */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs">
          <CheckCircle2 size={16} className="text-emerald-400" />
          {toastMessage}
        </div>
      )}

      {/* RESULT MODAL */}
      {showResultModal && submissionResult && (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">

            <div className="text-center space-y-3">
              <div
                className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${submissionResult.data?.status_peminjaman === "disetujui"
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-rose-100 text-rose-600"
                  }`}
              >
                {submissionResult.data?.status_peminjaman === "disetujui" ? (
                  <CheckCircle2 size={32} />
                ) : (
                  <AlertCircle size={32} />
                )}
              </div>

              <h3 className="font-bold text-slate-900 text-lg">
                {submissionResult.data?.status_peminjaman === "disetujui"
                  ? "Pengajuan Disetujui"
                  : "Pengajuan Ditolak"}
              </h3>

              <p className="text-xs text-slate-500 leading-relaxed">
                {submissionResult.message}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Kode transaksi</span>
                <strong className="font-mono text-slate-800 text-right">
                  {submissionResult.data?.kode_transaksi || "-"}
                </strong>
              </div>

              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Status</span>
                <strong
                  className={
                    submissionResult.data?.status_peminjaman === "disetujui"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }
                >
                  {submissionResult.data?.status_peminjaman}
                </strong>
              </div>

              {submissionResult.data?.alasan_penolakan && (
                <div className="pt-2 border-t border-slate-200">
                  <p className="text-slate-500 mb-1">Alasan penolakan</p>
                  <p className="text-rose-600">
                    {submissionResult.data.alasan_penolakan}
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={closeResultModal}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition text-xs"
            >
              Lihat Riwayat Peminjaman
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
            <span className="font-bold text-white tracking-wider text-base">
              SIPL-IoT
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            IOT LABORATORY LAB
          </p>
        </div>

        <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase">
          Mode Akses: Mahasiswa
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-3 pb-1">
            Mahasiswa
          </div>

          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <LayoutDashboard size={18} />
            Dashboard
          </Link>

          <Link
            href="/inventaris"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <Box size={18} />
            Katalog & Cari Alat
          </Link>

          <Link
            href="/peminjaman"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium"
          >
            <FileText size={18} />
            Pengajuan Peminjaman
          </Link>

          <Link
            href="/riwayat"
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <History size={18} />
            Riwayat Peminjaman
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-3">
          <div className="text-xs">
            <p className="font-semibold text-white truncate">
              {user?.nama}
            </p>
            <p className="text-slate-400 text-[11px]">
              {user?.nip_nim}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 text-xs text-slate-400 hover:text-white transition"
          >
            <LogOut size={15} />
            Keluar
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-slate-500 text-xs font-medium">
            SIPL IoT Lab / Mahasiswa /
            <span className="text-slate-800 font-semibold">
              {" "}Formulir Pengajuan Peminjaman
            </span>
          </div>

          <div className="text-right">
            <h4 className="font-semibold text-slate-800 text-xs">
              {user?.nama}
            </h4>
            <p className="text-[11px] text-slate-400">
              NIM. {user?.nip_nim}
            </p>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-6xl mx-auto w-full">

          {/* PAGE TITLE */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <h1 className="text-xl font-bold text-slate-900">
              Formulir Pengajuan Peminjaman Alat IoT
            </h1>
            <p className="text-xs text-slate-500">
              Pilih perangkat yang diperlukan, isi alasan peminjaman,
              dan tentukan jadwal pengembalian.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-3 text-xs">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div className="flex-1">{error}</div>
              <button onClick={() => setError("")}>
                <X size={15} />
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* LEFT COLUMN */}
              <div className="lg:col-span-7 space-y-4">

                {/* STUDENT IDENTITY */}
                <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                    Identitas Peminjam
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Nama Mahasiswa
                      </label>
                      <input
                        value={user?.nama || ""}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        NIM
                      </label>
                      <input
                        value={user?.nip_nim || ""}
                        readOnly
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-600 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400">
                    Identitas diambil otomatis dari akun yang sedang login.
                  </p>
                </section>

                {/* SELECTED ITEMS */}
                <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Perangkat yang Diajukan ({selectedTools.length})
                    </h3>
                    <span className="text-[11px] text-slate-400">
                      Maks. 5 jenis alat
                    </span>
                  </div>

                  {selectedTools.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      <Package size={28} className="mx-auto mb-2 opacity-40" />
                      Belum ada perangkat yang dipilih.
                      <br />
                      Silakan pilih dari katalog di sebelah kanan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTools.map((tool) => (
                        <div
                          key={tool.id_barang}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-3"
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800">
                              {tool.nama_barang}
                            </h4>

                            <span className="text-[10px] text-slate-400 font-mono">
                              {tool.kode_barang}
                            </span>

                            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                              <MapPin size={11} />
                              {getLocation(tool)}
                            </p>

                            <p className="text-[10px] text-emerald-600 mt-1">
                              Stok tersedia: {tool.jumlah_tersedia}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <div className="text-right">
                              <label className="text-[10px] text-slate-400 block mb-1">
                                Jumlah
                              </label>

                              <input
                                type="number"
                                min="1"
                                max={tool.jumlah_tersedia}
                                value={tool.jumlah_pinjam}
                                onChange={(event) =>
                                  updateQty(
                                    tool.id_barang,
                                    event.target.value
                                  )
                                }
                                className="w-16 text-center border border-slate-200 rounded-lg py-1.5 text-xs focus:outline-none focus:border-blue-500 bg-white font-semibold"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() => removeTool(tool.id_barang)}
                              className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition"
                              title="Hapus barang"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                {/* BORROWING DETAILS */}
                <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">
                    Detail Keperluan dan Jadwal
                  </h3>

                  <div className="space-y-2">
                    <label className="block font-medium text-slate-700 text-xs">
                      Alasan / Tujuan Peminjaman
                      <span className="text-rose-500"> *</span>
                    </label>

                    <textarea
                      rows={4}
                      value={tujuanPraktikum}
                      onChange={(event) =>
                        setTujuanPraktikum(event.target.value)
                      }
                      placeholder="Jelaskan keperluan praktikum, penelitian, tugas akhir, atau kegiatan lainnya..."
                      maxLength={5000}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:border-blue-500 resize-y"
                    />

                    <div className="flex justify-between text-[10px]">
                      {fieldErrors.tujuan_praktikum ? (
                        <span className="text-rose-600">
                          {fieldErrors.tujuan_praktikum[0] ||
                            fieldErrors.tujuan_praktikum}
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          Alasan wajib diisi sebelum pengajuan.
                        </span>
                      )}

                      <span className="text-slate-400">
                        {tujuanPraktikum.length}/5000
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 text-xs mb-1.5">
                        <Calendar size={13} className="inline mr-1" />
                        Tanggal dan Waktu Pinjam *
                      </label>

                      <input
                        type="datetime-local"
                        value={tglPinjam}
                        min={minDateTime}
                        onChange={(event) => setTglPinjam(event.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 text-xs mb-1.5">
                        <Calendar size={13} className="inline mr-1" />
                        Batas Pengembalian *
                      </label>

                      <input
                        type="datetime-local"
                        value={dueDate}
                        min={tglPinjam || minDateTime}
                        onChange={(event) => setDueDate(event.target.value)}
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                      />

                      {fieldErrors.due_date && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          {fieldErrors.due_date[0] || fieldErrors.due_date}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-[11px] text-blue-800">
                    Tanggal pinjam dan batas pengembalian merupakan jadwal
                    yang diajukan mahasiswa. Pengajuan akan diproses otomatis
                    berdasarkan ketersediaan stok.
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN */}
              <div className="lg:col-span-5 space-y-4">

                {/* CATALOG */}
                <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Tambah Perangkat dari Katalog
                  </h3>

                  <div className="relative">
                    <Search
                      className="absolute left-3 top-2.5 text-slate-400"
                      size={14}
                    />

                    <input
                      type="text"
                      placeholder="Cari nama atau kode barang..."
                      value={searchQuery}
                      onChange={(event) =>
                        setSearchQuery(event.target.value)
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {loadingCatalog ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      <RefreshCw
                        size={22}
                        className="animate-spin mx-auto mb-2"
                      />
                      Memuat katalog inventaris...
                    </div>
                  ) : filteredCatalog.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Tidak ada barang tersedia yang cocok.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                      {filteredCatalog.map((tool) => {
                        const isSelected = selectedTools.some(
                          (item) => item.id_barang === tool.id_barang
                        );

                        return (
                          <div
                            key={tool.id_barang}
                            className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-3"
                          >
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-800">
                                {tool.nama_barang}
                              </h4>

                              <span className="text-[10px] text-slate-400 font-mono">
                                {tool.kode_barang}
                              </span>

                              <p className="text-[10px] text-slate-500 mt-1">
                                Stok: {tool.jumlah_tersedia} unit
                              </p>

                              <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={10} />
                                {getLocation(tool)}
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={
                                isSelected || selectedTools.length >= 5
                              }
                              onClick={() => addToolToForm(tool)}
                              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
                              title={
                                isSelected
                                  ? "Sudah dipilih"
                                  : "Tambah ke pengajuan"
                              }
                            >
                              {isSelected ? (
                                <CheckCircle2 size={16} />
                              ) : (
                                <Plus size={16} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={fetchCatalog}
                    disabled={loadingCatalog}
                    className="w-full flex items-center justify-center gap-2 text-xs text-blue-600 hover:text-blue-800 py-2 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={13}
                      className={loadingCatalog ? "animate-spin" : ""}
                    />
                    Perbarui katalog
                  </button>
                </section>

                {/* SUBMIT */}
                <section className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <AlertCircle
                      size={16}
                      className="shrink-0 mt-0.5 text-amber-600"
                    />

                    <p>
                      Periksa kembali daftar barang, jumlah, alasan,
                      serta jadwal peminjaman sebelum mengirim pengajuan.
                    </p>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Jenis barang dipilih</span>
                    <strong className="text-slate-800">
                      {selectedTools.length}
                    </strong>
                  </div>

                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Total unit diajukan</span>
                    <strong className="text-slate-800">
                      {selectedTools.reduce(
                        (total, item) =>
                          total + Number(item.jumlah_pinjam),
                        0
                      )}
                    </strong>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting || loadingCatalog}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        Mengirim Pengajuan...
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        Kirim Pengajuan Peminjaman
                      </>
                    )}
                  </button>
                </section>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
