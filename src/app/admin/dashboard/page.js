"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";

const EMPTY_INVENTORY_FORM = {
  kode_barang: "",
  nama_barang: "",
  spesifikasi: "",
  jumlah_total: "1",
  jumlah_tersedia: "1",
  id_lokasi: "",
  status_barang: "tersedia",
};


function inventoryStatusLabel(status) {
  if (status === "tersedia") return "Tersedia";
  if (status === "habis") return "Stok Habis";
  if (status === "perawatan") return "Dalam Perawatan";
  return status || "—";
}

function inventoryStatusClass(status) {
  if (status === "tersedia") return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (status === "habis") return "bg-rose-50 text-rose-700 border-rose-200";
  return "bg-amber-50 text-amber-700 border-amber-200";
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, authenticated, logout } = useAuth();

  useEffect(() => {
    if (authLoading) return;

    if (!authenticated || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "kepala_lab") {
      router.replace("/dashboard");
    }
  }, [authLoading, authenticated, user, router]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Semua Lemari");
  const [selectedCondition, setSelectedCondition] = useState("Semua Status");
  const [sortOption, setSortOption] = useState("stok");

  // Semua menu Admin berada di dalam halaman ini dan berganti melalui activeTab.
  const [activeTab, setActiveTab] = useState("dashboard");

  // State modal dan formulir CRUD inventaris.
  const [isCenterModalOpen, setIsCenterModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedItemDetail, setSelectedItemDetail] = useState(null);
  const [registeredItem, setRegisteredItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_INVENTORY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Inventaris dan lokasi diambil dari API Laravel; tidak ada data inventaris contoh.
  const [inventoryData, setInventoryData] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [inventoryLoaded, setInventoryLoaded] = useState(false);
  const [toast, setToast] = useState("");

  const loadLocations = useCallback(async () => {
    setLocationsLoading(true);
    try {
      const result = await apiRequest("/admin/lokasi-penyimpanan");
      setLokasiList(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      if (error.status === 401) {
        setPageError("Sesi belum aktif. Silakan masuk menggunakan akun Kepala Lab untuk mengakses pengelolaan inventaris.");
      } else if (error.status === 403) {
        setPageError("Akun yang digunakan tidak memiliki hak akses Kepala Lab.");
      } else {
        setPageError(error.message || "Gagal mengambil lokasi penyimpanan.");
      }
    } finally {
      setLocationsLoading(false);
    }
  }, []);

  const loadInventaris = useCallback(async () => {
    setInventoryLoading(true);
    setPageError("");
    try {
      // Ambil semua halaman. Ini tetap bekerja bila backend membatasi 15 baris per halaman.
      const firstPage = await apiRequest("/admin/inventaris?page=1&per_page=100");
      let allRows = Array.isArray(firstPage?.data) ? firstPage.data : [];
      const lastPage = Math.max(1, Number(firstPage?.last_page || 1));

      for (let currentPage = 2; currentPage <= lastPage; currentPage += 1) {
        const nextPage = await apiRequest(`/admin/inventaris?page=${currentPage}&per_page=100`);
        if (Array.isArray(nextPage?.data)) allRows = allRows.concat(nextPage.data);
      }

      setInventoryData(allRows);
      setInventoryLoaded(true);
    } catch (error) {
      setInventoryData([]);
      setInventoryLoaded(false);
      if (error.status === 401) {
        setPageError("Sesi belum aktif. Silakan masuk menggunakan akun Kepala Lab untuk mengakses pengelolaan inventaris.");
      } else if (error.status === 403) {
        setPageError("Akun yang digunakan tidak memiliki hak akses Kepala Lab.");
      } else {
        setPageError(error.message || "Gagal mengambil data inventaris dari server.");
      }
    } finally {
      setInventoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading || !authenticated || user?.role !== "kepala_lab") return;

    loadLocations();
    loadInventaris();
  }, [authLoading, authenticated, user?.role, loadLocations, loadInventaris]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  // Arsip belum memiliki endpoint API; jangan menampilkan contoh barang seolah-olah data asli.
  const archivedInventory = [];

  // Data pengembalian menunggu endpoint admin; jangan gunakan transaksi contoh.
  const [returnQueue, setReturnQueue] = useState([]);

  // Jadwal pemeliharaan dimulai kosong. API/tabel pemeliharaan belum tersedia.
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    id_barang: "",
    jenis: "Kalibrasi berkala",
    tanggal: "",
    waktu: "08:00",
    teknisi: "",
    catatan: "",
  });
  const [maintenanceFormError, setMaintenanceFormError] = useState("");

  // Data mahasiswa tidak diisi dengan nama/NIM contoh.
  const studentsList = [];

  // Catatan sanksi dimulai kosong; penambahan dari formulir masih bersifat sesi halaman
  // sampai endpoint dan tabel sanksi disediakan di backend.
  const [sanctionsList, setSanctionsList] = useState([]);
  const [isSanctionModalOpen, setIsSanctionModalOpen] = useState(false);
  const [sanctionForm, setSanctionForm] = useState({
    nim: "",
    nama: "",
    id_barang: "",
    nama_barang_manual: "",
    tanggal: "",
    masalah: "",
    kompensasi: "",
    status: "Belum Lunas",
  });
  const [sanctionFormError, setSanctionFormError] = useState("");

  // State Pengaturan Lab (Baru)
  const [labSettings, setLabSettings] = useState({
    namaLab: "Laboratorium Internet of Things & Sistem Tertanam (PNUP)",
    kepalaLab: "Kepala Laboratorium",
    jamBuka: "08:00 - 17:00 WITA",
    maksPinjamHari: 7,
  });

  // Fungsi Verifikasi Pengembalian (akan aktif setelah endpoint pengembalian tersedia).
  const handleVerifyReturn = (id) => {
    setReturnQueue((current) => current.map((item) =>
      item.id === id ? { ...item, status: "Terverifikasi & Masuk Rak" } : item
    ));
  };

  function openMaintenanceModal() {
    setMaintenanceForm({
      id_barang: inventoryData[0]?.id_barang ? String(inventoryData[0].id_barang) : "",
      jenis: "Kalibrasi berkala",
      tanggal: "",
      waktu: "08:00",
      teknisi: "",
      catatan: "",
    });
    setMaintenanceFormError("");
    setIsMaintenanceModalOpen(true);
  }

  function handleMaintenanceSubmit(event) {
    event.preventDefault();
    setMaintenanceFormError("");

    const selectedItem = inventoryData.find((item) => String(item.id_barang) === String(maintenanceForm.id_barang));
    if (!selectedItem) {
      setMaintenanceFormError("Pilih komponen dari data inventaris yang sudah dimuat.");
      return;
    }
    if (!maintenanceForm.tanggal || !maintenanceForm.waktu || !maintenanceForm.teknisi.trim()) {
      setMaintenanceFormError("Tanggal, waktu, dan nama teknisi wajib diisi.");
      return;
    }

    const newSchedule = {
      id: `MNT-${Date.now()}`,
      alat: selectedItem.nama_barang,
      sku: selectedItem.kode_barang,
      jenis: maintenanceForm.jenis,
      jadwal: `${maintenanceForm.tanggal} • ${maintenanceForm.waktu} WITA`,
      teknisi: maintenanceForm.teknisi.trim(),
      status: "Terjadwal",
      catatan: maintenanceForm.catatan.trim(),
    };

    setMaintenanceList((current) => [newSchedule, ...current]);
    setIsMaintenanceModalOpen(false);
    setToast("Jadwal ditambahkan pada halaman ini. Penyimpanan permanen menunggu API pemeliharaan.");
  }

  function handleSanctionSubmit(event) {
    event.preventDefault();
    setSanctionFormError("");

    const selectedItem = inventoryData.find((item) => String(item.id_barang) === String(sanctionForm.id_barang));
    const relatedItemLabel = selectedItem
      ? `${selectedItem.nama_barang} (${selectedItem.kode_barang})`
      : sanctionForm.nama_barang_manual.trim();
    if (!sanctionForm.nim.trim() || !sanctionForm.nama.trim()) {
      setSanctionFormError("NIM dan nama mahasiswa wajib diisi.");
      return;
    }
    if (!relatedItemLabel) {
      setSanctionFormError("Pilih barang dari inventaris atau masukkan nama barang secara manual.");
      return;
    }
    if (!sanctionForm.masalah.trim() || !sanctionForm.kompensasi.trim() || !sanctionForm.tanggal) {
      setSanctionFormError("Tanggal kejadian, uraian pelanggaran/kerusakan, dan bentuk kompensasi wajib diisi.");
      return;
    }

    const newSanction = {
      id: `SNK-${Date.now()}`,
      mahasiswa: `${sanctionForm.nama.trim()} (${sanctionForm.nim.trim()})`,
      alat: relatedItemLabel,
      masalah: `${sanctionForm.tanggal} — ${sanctionForm.masalah.trim()}`,
      kompensasi: sanctionForm.kompensasi.trim(),
      status: sanctionForm.status,
    };

    setSanctionsList((current) => [newSanction, ...current]);
    setIsSanctionModalOpen(false);
    setToast("Catatan pelanggaran ditambahkan pada halaman ini. Penyimpanan permanen menunggu API sanksi.");
  }

  const showApiError = (error) => {
    if (error.status === 401) return "Sesi belum aktif. Masuk menggunakan akun Kepala Lab terlebih dahulu.";
    if (error.status === 403) return "Akun ini tidak memiliki hak akses Kepala Lab.";
    const validationMessages = error.errors ? Object.values(error.errors).flat().join(" ") : "";
    return validationMessages || error.message || "Permintaan ke server gagal.";
  };

  function openCreateModal() {
    setFormData({
      ...EMPTY_INVENTORY_FORM,
      id_lokasi: lokasiList[0]?.id_lokasi ? String(lokasiList[0].id_lokasi) : "",
    });
    setFormError(lokasiList.length === 0
      ? "Daftar lokasi penyimpanan belum berhasil dimuat. Formulir tetap terbuka, tetapi penyimpanan baru bisa dilakukan setelah lokasi dari database tersedia."
      : "");
    setIsCenterModalOpen(true);
  }

  function openEditModal(item) {
    setSelectedItemDetail({
      ...item,
      jumlah_total: String(item.jumlah_total ?? 0),
      jumlah_tersedia: String(item.jumlah_tersedia ?? 0),
      id_lokasi: String(item.id_lokasi ?? item.lokasi?.id_lokasi ?? ""),
    });
    setFormError("");
    setIsDetailModalOpen(true);
  }

  async function handleCenterFormSubmit(event) {
    event.preventDefault();
    setFormError("");

    const total = Number(formData.jumlah_total);
    const tersedia = Number(formData.jumlah_tersedia);
    if (!formData.kode_barang.trim() || !formData.nama_barang.trim() || !formData.spesifikasi.trim()) {
      setFormError("Kode, nama, dan spesifikasi barang wajib diisi.");
      return;
    }
    if (!Number.isInteger(total) || total < 1) {
      setFormError("Jumlah total minimal 1 dan harus berupa bilangan bulat.");
      return;
    }
    if (!Number.isInteger(tersedia) || tersedia < 0 || tersedia > total) {
      setFormError("Jumlah tersedia harus berupa bilangan bulat antara 0 dan jumlah total.");
      return;
    }
    if (!formData.id_lokasi) {
      setFormError("Pilih lokasi penyimpanan terlebih dahulu.");
      return;
    }

    const body = {
      kode_barang: formData.kode_barang.trim(),
      nama_barang: formData.nama_barang.trim(),
      spesifikasi: formData.spesifikasi.trim(),
      jumlah_total: total,
      jumlah_tersedia: tersedia,
      id_lokasi: Number(formData.id_lokasi),
      status_barang: formData.status_barang,
    };

    setSaving(true);
    try {
      await apiRequest("/admin/inventaris", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setRegisteredItem(body);
      setIsCenterModalOpen(false);
      setIsSuccessModalOpen(true);
      await loadInventaris();
    } catch (error) {
      setFormError(showApiError(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem(item) {
    const confirmed = window.confirm(
      `Hapus inventaris ${item.nama_barang} (${item.kode_barang})? Data yang sudah memiliki riwayat peminjaman mungkin tidak dapat dihapus.`
    );
    if (!confirmed) return;

    setDeletingId(item.id_barang);
    try {
      await apiRequest(`/admin/inventaris/${item.id_barang}`, { method: "DELETE" });
      setIsDetailModalOpen(false);
      setSelectedItemDetail(null);
      setToast("Data inventaris berhasil dihapus.");
      await loadInventaris();
    } catch (error) {
      setToast(error.status === 409
        ? "Inventaris tidak dapat dihapus karena sudah memiliki riwayat peminjaman."
        : showApiError(error));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdateItem(event) {
    event.preventDefault();
    if (!selectedItemDetail) return;
    setFormError("");

    const total = Number(selectedItemDetail.jumlah_total);
    const tersedia = Number(selectedItemDetail.jumlah_tersedia);
    if (!Number.isInteger(total) || total < 1) {
      setFormError("Jumlah total minimal 1 dan harus berupa bilangan bulat.");
      return;
    }
    if (!Number.isInteger(tersedia) || tersedia < 0 || tersedia > total) {
      setFormError("Jumlah tersedia harus berupa bilangan bulat antara 0 dan jumlah total.");
      return;
    }
    if (!selectedItemDetail.id_lokasi) {
      setFormError("Pilih lokasi penyimpanan terlebih dahulu.");
      return;
    }

    const body = {
      kode_barang: selectedItemDetail.kode_barang.trim(),
      nama_barang: selectedItemDetail.nama_barang.trim(),
      spesifikasi: (selectedItemDetail.spesifikasi || "").trim(),
      jumlah_total: total,
      jumlah_tersedia: tersedia,
      id_lokasi: Number(selectedItemDetail.id_lokasi),
      status_barang: selectedItemDetail.status_barang,
    };

    setSaving(true);
    try {
      await apiRequest(`/admin/inventaris/${selectedItemDetail.id_barang}`, {
        method: "PUT",
        body: JSON.stringify(body),
      });
      setIsDetailModalOpen(false);
      setSelectedItemDetail(null);
      setToast("Data inventaris berhasil diperbarui.");
      await loadInventaris();
    } catch (error) {
      setFormError(showApiError(error));
    } finally {
      setSaving(false);
    }
  }

  const filteredInventory = inventoryData
    .filter((item) => {
      const needle = searchTerm.trim().toLowerCase();
      const matchesSearch = !needle ||
        (item.nama_barang || "").toLowerCase().includes(needle) ||
        (item.kode_barang || "").toLowerCase().includes(needle) ||
        (item.spesifikasi || "").toLowerCase().includes(needle);
      const cabinet = item.lokasi?.nama_lemari || "";
      const matchesLocation = selectedLocation === "Semua Lemari" || cabinet === selectedLocation;
      const matchesStatus = selectedCondition === "Semua Status" || item.status_barang === selectedCondition;
      return matchesSearch && matchesLocation && matchesStatus;
    })
    .sort((a, b) => {
      if (sortOption === "nama") return (a.nama_barang || "").localeCompare(b.nama_barang || "");
      if (sortOption === "kode") return (b.kode_barang || "").localeCompare(a.kode_barang || "");
      return Number(a.jumlah_tersedia || 0) - Number(b.jumlah_tersedia || 0);
    });

  const totalJenisInventaris = inventoryData.length;
  const totalUnitInventaris = inventoryData.reduce((total, item) => total + Number(item.jumlah_total || 0), 0);
  const totalStokTersedia = inventoryData.reduce((total, item) => {
    return total + (item.status_barang === "tersedia" ? Number(item.jumlah_tersedia || 0) : 0);
  }, 0);
  const stockAttentionItems = inventoryData.filter((item) =>
    item.status_barang === "habis" || item.status_barang === "perawatan" || Number(item.jumlah_tersedia || 0) === 0
  );
  const pendingReturnsCount = null; // Belum ada endpoint pengembalian Admin yang terhubung.

  // Judul Breadcrumb Dinamis
  const getBreadcrumbLabel = () => {
    switch (activeTab) {
      case "dashboard": return "Dashboard & Overview";
      case "inventaris": return "Inventaris Alat & SKU";
      case "arsip": return "Arsip & Alat Nonaktif";
      case "peminjaman": return "Peminjaman Aktif";
      case "pengembalian": return "Verifikasi Pengembalian";
      case "pemeliharaan": return "Pemeliharaan & Kalibrasi";
      case "mahasiswa": return "Data Mahasiswa & Praktikan";
      case "sanksi": return "Sanksi & Kompensasi Rusak";
      case "pengaturan": return "Pengaturan Lab & Profil";
      case "server": return "Status Server & Node IoT";
      default: return "Dashboard & Overview";
    }
  };

  if (authLoading || !authenticated || user?.role !== "kepala_lab") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600 text-sm">
        Memverifikasi sesi Kepala Lab...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f4f6f9] text-slate-800 font-sans relative">
      {/* 1. SIDEBAR NAVIGASI KIRI LENGKAP (SEMUA MENU BISA DIKLIK) */}
      <aside className="w-64 h-full overflow-y-auto overscroll-y-contain bg-white border-r border-slate-200 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-5">
          {/* Header Branding */}
          <div className="px-2">
            <h1 className="font-extrabold text-blue-900 text-lg tracking-tight flex items-center gap-1.5">
              <span>📡</span> SIPL-IoT
            </h1>
            <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">
              IoT Lab System
            </p>
          </div>

          {/* Group 1: OPERASIONAL LAB */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              OPERASIONAL LAB
            </p>
            <nav className="space-y-0.5 text-xs font-medium">
              <button 
                onClick={() => setActiveTab("dashboard")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                📊 Dashboard & Overview
              </button>
              <button 
                onClick={() => setActiveTab("peminjaman")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'peminjaman' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className="flex items-center gap-2">📥 Peminjaman Aktif</span>
              </button>
              <button 
                onClick={() => setActiveTab("pengembalian")}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'pengembalian' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <span className="flex items-center gap-2">🔄 Sirkulasi & Pengembalian</span>
                {pendingReturnsCount !== null && pendingReturnsCount > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">{pendingReturnsCount}</span>
                )}
              </button>
            </nav>
          </div>

          {/* Group 2: MANAJEMEN INVENTARIS */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              MANAJEMEN INVENTARIS
            </p>
            <nav className="space-y-0.5 text-xs font-medium">
              <button 
                onClick={() => setActiveTab("inventaris")}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'inventaris' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                📦 Inventaris Alat & SKU
              </button>
              <button 
                onClick={() => setActiveTab("pemeliharaan")} 
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'pemeliharaan' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                🔧 Pemeliharaan & Kalibrasi
              </button>
            </nav>
          </div>

          {/* Group 3: AKADEMIK & PENGGUNA */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              AKADEMIK & PENGGUNA
            </p>
            <nav className="space-y-0.5 text-xs font-medium">
              <button 
                onClick={() => setActiveTab("mahasiswa")} 
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'mahasiswa' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                👥 Data Mahasiswa & Praktikan
              </button>
              <button 
                onClick={() => setActiveTab("sanksi")} 
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'sanksi' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                ⚠️ Sanksi & Kompensasi Rusak
              </button>
            </nav>
          </div>

          {/* Group 4: SISTEM */}
          <div>
            <p className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              SISTEM
            </p>
            <nav className="space-y-0.5 text-xs font-medium">
              <button 
                onClick={() => setActiveTab("pengaturan")} 
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'pengaturan' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                ⚙️ Pengaturan Lab & Profil
              </button>
              <button 
                onClick={() => setActiveTab("server")} 
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${activeTab === 'server' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                📊 Status Server & Node IoT
              </button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-3 border-t text-[11px] text-slate-500 space-y-1">
          <p className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Lab Buka: 08:00 - 17:00
          </p>
          <p className="text-slate-400 text-[10px]">Area: Kepala Laboratorium</p>
        </div>
      </aside>

      {/* 2. AREA KONTEN UTAMA */}
      <main className="min-w-0 flex-1 h-full overflow-y-auto overscroll-y-contain overflow-x-hidden p-5 space-y-5" style={{ scrollbarGutter: "stable" }}>
        {/* Top Header Bar */}
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-96">
            <input
              type="text"
              placeholder="Cari alat, kode rak, SKU..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="absolute left-3 top-2 text-slate-400 text-xs">🔍</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button className="relative p-1 text-slate-500 hover:text-slate-800">
              🔔
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full border bg-blue-900 text-white grid place-items-center text-[10px] font-bold">KL</div>
              <div>
                <p className="font-bold text-slate-800 leading-none">{user?.nama || "Kepala Laboratorium"}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Kepala Lab</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600"
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Status Breadcrumb & Shift */}
        <div className="flex justify-between items-center text-xs">
          <div className="text-slate-500 font-medium">
            SIPL-IoT / <span className="text-slate-800 font-semibold">Admin Inventaris & CRUD</span> /{" "}
            <span className="text-blue-900 font-bold">{getBreadcrumbLabel()}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-[11px] font-semibold rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> Shift Pagi: 08:00 - 13:00 WIB
            </span>
            <span className="text-slate-600 font-semibold">
              👤 Akun: <span className="text-blue-900 font-bold">{user?.nama || "Kepala Laboratorium"} (Kepala Lab)</span>
            </span>
          </div>
        </div>

        {activeTab === "dashboard" && (
          <section className="space-y-4 animate-in fade-in duration-200">
            <div className="bg-blue-900 text-white rounded-xl p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 shadow-md">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-800 rounded-lg text-lg">⚡</div>
                <div>
                  <h3 className="font-bold text-sm">Persetujuan Peminjaman Otomatis</h3>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Sistem menyetujui peminjaman secara otomatis apabila stok mencukupi. Admin memantau peminjaman aktif dan pengembalian, bukan melakukan persetujuan manual.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("peminjaman")}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg shadow transition-colors shrink-0"
              >
                Lihat Peminjaman Aktif &rarr;
              </button>
            </div>

            {pageError && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2" role="alert">
                <span>{pageError}</span>
                <button type="button" onClick={() => { loadLocations(); loadInventaris(); }} className="font-bold underline">Coba lagi</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">JENIS INVENTARIS</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900">{inventoryLoading ? "—" : inventoryLoaded ? totalJenisInventaris : "—"}</h2>
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-lg text-lg">📦</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Jumlah kode barang dalam database</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL UNIT TERDATA</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900">{inventoryLoading ? "—" : inventoryLoaded ? totalUnitInventaris : "—"}</h2>
                  <span className="p-2 bg-indigo-50 text-indigo-700 rounded-lg text-lg">🧮</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Akumulasi jumlah total setiap barang</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">STOK TERSEDIA</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900">{inventoryLoading ? "—" : inventoryLoaded ? totalStokTersedia : "—"}</h2>
                  <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-lg">✅</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Unit dengan status inventaris tersedia</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PEMINJAMAN AKTIF</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900">—</h2>
                  <span className="p-2 bg-sky-50 text-sky-700 rounded-lg text-lg">🔄</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Menunggu endpoint data peminjaman Admin</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PENGEMBALIAN PERLU DIPERIKSA</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-slate-900">—</h2>
                  <span className="p-2 bg-amber-50 text-amber-700 rounded-lg text-lg">📋</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Menunggu endpoint data pengembalian Admin</p>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">STOK PERLU DIPERHATIKAN</p>
                <div className="flex items-center justify-between mt-1">
                  <h2 className="text-3xl font-extrabold text-rose-600">{inventoryLoading ? "—" : inventoryLoaded ? stockAttentionItems.length : "—"}</h2>
                  <span className="p-2 bg-rose-50 text-rose-600 rounded-lg text-lg">⚠️</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2">Barang berstatus habis atau perawatan</p>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* KONTEN 4 TAB UTAMA (INVENTARIS, ARSIP, PEMINJAMAN AKTIF, PENGEMBALIAN) */}
        {/* ======================================================== */}
        {(activeTab === "inventaris" || activeTab === "arsip" || activeTab === "peminjaman" || activeTab === "pengembalian") && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-4">
            <div className="flex flex-wrap justify-between items-center border-b border-slate-200 pb-3 gap-3">
              <div>
                <h2 className="font-bold text-base text-slate-900">
                  {activeTab === "inventaris" ? "📦 Inventaris Alat & SKU" : activeTab === "arsip" ? "📁 Arsip / Alat Nonaktif" : activeTab === "peminjaman" ? "📥 Peminjaman Aktif" : "🔄 Verifikasi Pengembalian"}
                </h2>
                <p className="text-[11px] text-slate-400 mt-1">
                  {activeTab === "inventaris" ? "Katalog inventaris dan lokasi penyimpanan yang tercatat di database." : "Informasi operasional laboratorium."}
                </p>
              </div>
              {activeTab === "inventaris" && (
                <button
                  type="button"
                  onClick={openCreateModal}
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-lg hover:bg-blue-950 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 shadow-sm"
                >
                  + Tambah Alat Baru
                </button>
              )}
            </div>

            {/* KONTEN TAB 1: KATALOG INVENTARIS DARI DATABASE */}
            {activeTab === "inventaris" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {pageError && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2" role="alert">
                    <span>{pageError}</span>
                    <button type="button" onClick={() => { loadLocations(); loadInventaris(); }} className="font-bold underline">Coba lagi</button>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div className="relative md:col-span-2">
                    <input
                      type="search"
                      placeholder="Cari nama barang, kode inventaris, spesifikasi..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute left-2.5 top-2.5 text-slate-400">🔍</span>
                  </div>
                  <select
                    value={selectedLocation}
                    onChange={(event) => setSelectedLocation(event.target.value)}
                    className="p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter lemari"
                  >
                    <option>Semua Lemari</option>
                    {[...new Set(lokasiList.map((item) => item.nama_lemari).filter(Boolean))].sort().map((cabinet) => (
                      <option key={cabinet} value={cabinet}>{cabinet}</option>
                    ))}
                  </select>
                  <select
                    value={selectedCondition}
                    onChange={(event) => setSelectedCondition(event.target.value)}
                    className="p-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label="Filter status barang"
                  >
                    <option>Semua Status</option>
                    <option value="tersedia">Tersedia</option>
                    <option value="habis">Stok Habis</option>
                    <option value="perawatan">Dalam Perawatan</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                  <span>
                    {inventoryLoading ? "Memuat inventaris dari database..." : inventoryLoaded
                      ? `Menampilkan ${filteredInventory.length} dari ${inventoryData.length} jenis inventaris`
                      : "Data inventaris belum tersedia"}
                  </span>
                  <div className="flex items-center gap-2">
                    <label htmlFor="inventory-sort">Urutkan:</label>
                    <select id="inventory-sort" value={sortOption} onChange={(event) => setSortOption(event.target.value)} className="p-1.5 border border-slate-200 rounded-lg bg-white">
                      <option value="stok">Stok terendah</option>
                      <option value="nama">Nama A–Z</option>
                      <option value="kode">Kode terbaru</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="p-3">KODE INVENTARIS</th>
                        <th className="p-3">NAMA BARANG & SPESIFIKASI</th>
                        <th className="p-3">LOKASI PENYIMPANAN</th>
                        <th className="p-3">STOK TERSEDIA</th>
                        <th className="p-3">STATUS</th>
                        <th className="p-3 text-right">AKSI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inventoryLoading ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Memuat data inventaris dari Supabase...</td></tr>
                      ) : pageError ? (
                        <tr><td colSpan="6" className="p-8 text-center text-amber-700">Data belum dapat dimuat. Periksa sesi login Kepala Lab.</td></tr>
                      ) : filteredInventory.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Tidak ada data yang sesuai dengan pencarian atau filter.</td></tr>
                      ) : filteredInventory.map((item) => (
                        <tr key={item.id_barang} className="hover:bg-blue-50/50 transition-colors">
                          <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">{item.kode_barang}</td>
                          <td className="p-3 min-w-64">
                            <p className="font-bold text-slate-900">{item.nama_barang}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{item.spesifikasi || "Spesifikasi belum diisi"}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-semibold text-slate-700">{item.lokasi?.nama_lemari || "—"}</p>
                            <p className="text-[11px] text-slate-400">{item.lokasi?.nomor_box || "Lokasi belum tersedia"}</p>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <p className={`font-bold ${Number(item.jumlah_tersedia) === 0 ? "text-rose-600" : "text-slate-800"}`}>
                              {item.jumlah_tersedia} / {item.jumlah_total} unit
                            </p>
                            <div className="w-28 bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                              <div
                                className={`h-full ${Number(item.jumlah_tersedia) === 0 ? "bg-rose-500" : "bg-emerald-500"}`}
                                style={{ width: `${Math.min(100, Number(item.jumlah_total) > 0 ? (Number(item.jumlah_tersedia) / Number(item.jumlah_total)) * 100 : 0)}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-semibold ${inventoryStatusClass(item.status_barang)}`}>
                              {inventoryStatusLabel(item.status_barang)}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex justify-end gap-1.5">
                              <button type="button" onClick={() => openEditModal(item)} className="px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100">Edit</button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item)}
                                disabled={deletingId === item.id_barang}
                                className="px-2.5 py-1.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-semibold hover:bg-rose-100 disabled:opacity-50"
                              >
                                {deletingId === item.id_barang ? "Menghapus..." : "Hapus"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* RAK & TATA LETAK DIGABUNG DENGAN INVENTARIS; SEMUA RINGKASAN DIHITUNG DARI DATA LOKASI DAN BARANG API */}
            {activeTab === "inventaris" && (
              <section className="pt-4 border-t border-slate-200 space-y-3">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">🏬 Rak & Tata Letak Penyimpanan</h3>
                  <p className="text-[11px] text-slate-500">Isi setiap lemari ditampilkan berdasarkan lokasi barang yang tercatat di database, bukan daftar komponen contoh.</p>
                </div>
                {locationsLoading || inventoryLoading ? (
                  <p className="text-xs text-slate-500 py-3">Memuat data lokasi dan inventaris...</p>
                ) : pageError ? (
                  <p className="text-xs text-amber-700 py-3">Data rak belum dapat ditampilkan sebelum sesi Kepala Lab aktif.</p>
                ) : lokasiList.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">Belum ada lokasi penyimpanan yang terdaftar.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {lokasiList.map((lokasi) => {
                      const itemsInLocation = inventoryData.filter((item) =>
                        String(item.id_lokasi ?? item.lokasi?.id_lokasi ?? "") === String(lokasi.id_lokasi)
                      );
                      const totalUnit = itemsInLocation.reduce((sum, item) => sum + Number(item.jumlah_total || 0), 0);
                      const availableUnit = itemsInLocation.reduce((sum, item) => sum + Number(item.jumlah_tersedia || 0), 0);
                      return (
                        <article key={lokasi.id_lokasi} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="font-bold text-xs text-slate-800">{lokasi.nama_lemari || "Lokasi tanpa nama"}</h4>
                              <p className="text-[10px] text-slate-500">{lokasi.nomor_box || "Nomor box belum diisi"}</p>
                            </div>
                            <span className="rounded-full bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 text-[10px] font-semibold">{itemsInLocation.length} jenis</span>
                          </div>
                          {lokasi.keterangan && <p className="text-[10px] text-slate-500">{lokasi.keterangan}</p>}
                          <div className="flex gap-4 text-[10px] text-slate-600">
                            <span>Total unit: <strong>{totalUnit}</strong></span>
                            <span>Stok tersedia: <strong>{availableUnit}</strong></span>
                          </div>
                          {itemsInLocation.length ? (
                            <ul className="border-t border-slate-200 pt-2 space-y-1.5">
                              {itemsInLocation.map((item) => (
                                <li key={item.id_barang} className="flex justify-between gap-2 text-[10px]">
                                  <span className="text-slate-700 min-w-0">{item.nama_barang} <span className="text-slate-400">({item.kode_barang})</span></span>
                                  <strong className="text-slate-700 whitespace-nowrap">{item.jumlah_tersedia}/{item.jumlah_total}</strong>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="border-t border-slate-200 pt-2 text-[10px] text-slate-400">Belum ada komponen yang terhubung ke lokasi ini.</p>
                          )}
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* KONTEN TAB 2: ARSIP / ALAT NONAKTIF */}
            {activeTab === "arsip" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center gap-3 text-xs text-blue-900">
                  <span className="text-lg">ℹ️</span>
                  <div>
                    <p className="font-bold">Arsip Inventaris</p>
                    <p className="text-[11px] text-blue-700">Data arsip belum dihubungkan ke API. Tidak ada data contoh yang ditampilkan.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Cari alat nonaktif, SKU, alasan arsip..."
                      className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="absolute left-2.5 top-2 text-slate-400">🔍</span>
                  </div>
                  <select className="p-1.5 border border-slate-200 rounded-lg bg-white">
                    <option>Semua Kategori (Microcontroller, SBC, Sensor, Test)</option>
                  </select>
                  <select className="p-1.5 border border-slate-200 rounded-lg bg-white">
                    <option>Semua Alasan (Rusak/Afkir, Revisi, dsb)</option>
                  </select>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                  <span className="text-slate-600 font-medium">📦 <strong>0 SKU Terpilih</strong> (Pilih checkbox untuk aktivasi aksi massal)</span>
                  <div className="flex gap-2">
                    <button className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100">Pulihkan Terpilih</button>
                    <button className="px-3 py-1 bg-white border border-slate-300 rounded text-slate-700 font-semibold hover:bg-slate-100">Cetak Berita Acara Afkir</button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="p-3 w-8"><input type="checkbox" className="rounded" /></th>
                        <th className="p-3">KODE & SKU</th>
                        <th className="p-3">NAMA PERANGKAT & SPESIFIKASI</th>
                        <th className="p-3">KATEGORI</th>
                        <th className="p-3">TOTAL UNIT & STATUS FISIK</th>
                        <th className="p-3">TANGGAL & ALASAN PENONAKTIFAN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {archivedInventory.length === 0 ? (
                        <tr><td colSpan="6" className="p-8 text-center text-slate-500">Data arsip belum tersedia dari API.</td></tr>
                      ) : archivedInventory.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3"><input type="checkbox" className="rounded" /></td>
                          <td className="p-3 font-mono font-bold text-slate-700">
                            {item.sku}
                            <p className="text-[9px] font-sans text-slate-400 font-normal">LOC: RAK-B3-KOTA</p>
                          </td>
                          <td className="p-3 flex items-center gap-3">
                            <img src={item.img} alt={item.nama} className="w-9 h-9 object-cover rounded-lg border border-slate-200 shrink-0" />
                            <div>
                              <p className="font-bold text-slate-900">{item.nama}</p>
                              <p className="text-[11px] text-slate-400">{item.spek}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-semibold border border-slate-200">
                              {item.kategori}
                            </span>
                          </td>
                          <td className="p-3 font-medium text-slate-800">
                            <p className="font-bold">{item.unitStatus}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{item.keteranganStatus}</p>
                          </td>
                          <td className="p-3 text-[11px] text-slate-600 whitespace-pre-line">
                            {item.tanggalAlasan}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* KONTEN TAB 3: PEMINJAMAN AKTIF */}
            {activeTab === "peminjaman" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5 text-blue-900">
                    <span className="text-lg">📥</span>
                    <div>
                      <p className="font-bold">Pemantauan Peminjaman Aktif</p>
                      <p className="text-[11px] text-blue-700">
                        Pengajuan dengan stok mencukupi diproses dan disetujui otomatis oleh sistem. Admin tidak melakukan persetujuan manual.
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-blue-800 bg-white px-3 py-1 rounded-lg border border-blue-200 whitespace-nowrap">
                    Otomatis oleh sistem
                  </span>
                </div>

                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center">
                  <div className="text-3xl mb-3">📋</div>
                  <h3 className="font-bold text-sm text-slate-800">Data Peminjaman Aktif</h3>
                  <p className="text-xs text-slate-500 mt-2 max-w-xl mx-auto">
                    Daftar transaksi peminjaman yang sedang berlangsung akan ditampilkan di sini setelah API peminjaman Laravel dihubungkan.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2">
                    Tidak ada data contoh yang ditampilkan.
                  </p>
                </div>
              </div>
            )}

            {/* KONTEN TAB 4: VERIFIKASI PENGEMBALIAN ALAT */}
            {activeTab === "pengembalian" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="flex justify-between items-center bg-amber-50/80 border border-amber-200 p-3 rounded-xl text-xs">
                  <div className="flex items-center gap-2.5 text-amber-900">
                    <span className="text-lg">🔄</span>
                    <div>
                      <p className="font-bold">Konfirmasi Pengembalian & Pengecekan Fisik Alat</p>
                      <p className="text-[11px] text-amber-800">Periksa kelengkapan kabel, probe, dan fungsi pin sebelum mengembalikan status alat ke rak siap pakai.</p>
                    </div>
                  </div>
                  <span className="font-bold text-amber-800 bg-white px-3 py-1 rounded-lg border border-amber-200">
                    {pendingReturnsCount ?? "—"} Perlu Dicek
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200 text-[10px]">
                      <tr>
                        <th className="p-3">ID LOG</th>
                        <th className="p-3">MAHASISWA PENGEMBALI</th>
                        <th className="p-3">ALAT & SKU</th>
                        <th className="p-3">LAPORAN KONDISI & WAKTU</th>
                        <th className="p-3 text-right">VERIFIKASI FISIK</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnQueue.length === 0 ? (
                        <tr><td colSpan="5" className="p-8 text-center text-slate-500">Data pengembalian belum dapat ditampilkan karena endpoint API Admin belum tersedia.</td></tr>
                      ) : returnQueue.map((ret) => (
                        <tr key={ret.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold text-slate-700">{ret.id}</td>
                          <td className="p-3">
                            <p className="font-bold text-slate-900">{ret.mahasiswa}</p>
                            <p className="text-[11px] text-slate-500">NIM: {ret.nim}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{ret.alat}</p>
                            <p className="text-[10px] font-mono text-slate-500">SKU: {ret.sku}</p>
                          </td>
                          <td className="p-3">
                            <p className="font-medium text-emerald-700">✓ {ret.kondisiLapor}</p>
                            <p className="text-[10px] text-slate-400">{ret.waktuKembali}</p>
                          </td>
                          <td className="p-3 text-right">
                            {ret.status === "Perlu Dicek" ? (
                              <button 
                                onClick={() => handleVerifyReturn(ret.id)}
                                className="px-3.5 py-1.5 bg-blue-900 hover:bg-blue-950 text-white font-semibold rounded-lg text-xs shadow-sm"
                              >
                                ✓ Verifikasi & Masuk Rak
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[11px] font-bold">
                                ✓ {ret.status}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* HALAMAN MENU SIDEBAR 5: PEMELIHARAAN & KALIBRASI          */}
        {/* ======================================================== */}
        {activeTab === "pemeliharaan" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">🔧 Pemeliharaan & Kalibrasi Alat Lab</h3>
                <p className="text-xs text-slate-400">Jadwalkan pemeriksaan dan kalibrasi untuk perangkat dari katalog inventaris.</p>
              </div>
              <button 
                onClick={openMaintenanceModal}
                className="px-3.5 py-1.5 bg-blue-900 text-white text-xs font-semibold rounded-lg shadow"
              >
                + Jadwalkan Kalibrasi
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b text-[10px]">
                  <tr>
                    <th className="p-3">ID LOG</th>
                    <th className="p-3">PERANGKAT & SKU</th>
                    <th className="p-3">JENIS TINDAKAN</th>
                    <th className="p-3">JADWAL & TEKNISI</th>
                    <th className="p-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {maintenanceList.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">Belum ada jadwal pemeliharaan atau kalibrasi yang ditambahkan.</td></tr>
                  ) : maintenanceList.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{m.id}</td>
                      <td className="p-3">
                        <p className="font-bold text-slate-900">{m.alat}</p>
                        <p className="text-[10px] font-mono text-slate-400">{m.sku}</p>
                      </td>
                      <td className="p-3 text-slate-700">{m.jenis}</td>
                      <td className="p-3">
                        <p className="font-semibold">{m.jadwal}</p>
                        <p className="text-[10px] text-slate-400">{m.teknisi}</p>
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          m.status === "Selesai" ? "bg-emerald-100 text-emerald-700" :
                          m.status === "Dalam Proses" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* HALAMAN MENU SIDEBAR 7: DATA MAHASISWA & PRAKTIKAN       */}
        {/* ======================================================== */}
        {activeTab === "mahasiswa" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">👥 Data Mahasiswa & Praktikan Lab IoT</h3>
                <p className="text-xs text-slate-400">Daftar mahasiswa Jurusan Teknik Informatika & Komputer (PNUP) yang terdaftar dalam sistem peminjaman.</p>
              </div>
              <span className="px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-100">
                {studentsList.length ? `Total: ${studentsList.length} Praktikan Aktif` : "Data mahasiswa belum tersedia"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b text-[10px]">
                  <tr>
                    <th className="p-3">NIM</th>
                    <th className="p-3">NAMA MAHASISWA</th>
                    <th className="p-3">PROGRAM STUDI / KELAS</th>
                    <th className="p-3">PINJAMAN AKTIF</th>
                    <th className="p-3">TOTAL RIWAYAT</th>
                    <th className="p-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {studentsList.length === 0 ? (
                    <tr><td colSpan="6" className="p-10 text-center text-slate-500">Data mahasiswa belum dihubungkan ke API. Tidak ada data contoh yang ditampilkan.</td></tr>
                  ) : studentsList.map((mhs) => (
                    <tr key={mhs.nim} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{mhs.nim}</td>
                      <td className="p-3 font-bold text-slate-900">{mhs.nama}</td>
                      <td className="p-3 text-slate-600">{mhs.kelas}</td>
                      <td className="p-3 font-semibold text-blue-700">{mhs.pinjamAktif} Alat</td>
                      <td className="p-3 text-slate-600">{mhs.totalTransaksi}x Peminjaman</td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mhs.status === "Aktif" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {mhs.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* HALAMAN MENU SIDEBAR 8: SANKSI & KOMPENSASI RUSAK        */}
        {/* ======================================================== */}
        {activeTab === "sanksi" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">⚠️ Sanksi & Kompensasi Kerusakan Alat</h3>
                <p className="text-xs text-slate-400">Catat pelanggaran SOP, keterlambatan pengembalian, atau kerusakan komponen.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSanctionForm({ nim: "", nama: "", id_barang: "", nama_barang_manual: "", tanggal: "", masalah: "", kompensasi: "", status: "Belum Lunas" });
                  setSanctionFormError("");
                  setIsSanctionModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-900 text-white text-xs font-semibold rounded-lg shadow hover:bg-blue-950"
              >
                + Tambah Catatan Pelanggaran
              </button>
            </div>
            <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Catatan yang ditambahkan melalui formulir saat ini hanya tersimpan selama halaman terbuka. Penyimpanan permanen memerlukan endpoint dan tabel sanksi di backend.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b text-[10px]">
                  <tr>
                    <th className="p-3">KODE KASUS</th>
                    <th className="p-3">MAHASISWA</th>
                    <th className="p-3">PERANGKAT & KETERANGAN</th>
                    <th className="p-3">BENTUK KOMPENSASI</th>
                    <th className="p-3 text-right">STATUS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sanctionsList.length === 0 ? (
                    <tr><td colSpan="5" className="p-10 text-center text-slate-500">Belum ada catatan pelanggaran atau kerusakan yang dimasukkan.</td></tr>
                  ) : sanctionsList.map((snk) => (
                    <tr key={snk.id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-700">{snk.id}</td>
                      <td className="p-3 font-bold text-slate-900">{snk.mahasiswa}</td>
                      <td className="p-3">
                        <p className="font-semibold text-slate-800">{snk.alat}</p>
                        <p className="text-[11px] text-slate-500">{snk.masalah}</p>
                      </td>
                      <td className="p-3 font-medium text-rose-700">{snk.kompensasi}</td>
                      <td className="p-3 text-right">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          snk.status === "Selesai" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                        }`}>
                          {snk.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* HALAMAN MENU SIDEBAR 9: PENGATURAN LAB & PROFIL          */}
        {/* ======================================================== */}
        {activeTab === "pengaturan" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
            <div className="border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">⚙️ Pengaturan Operasional Lab & Profil Kepala Laboratorium</h3>
              <p className="text-xs text-slate-400">Konfigurasi parameter jam layanan, batas waktu peminjaman mahasiswa, dan informasi penanggung jawab.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-600 uppercase text-[10px]">NAMA LABORATORIUM</label>
                <input 
                  type="text" 
                  value={labSettings.namaLab}
                  onChange={(e) => setLabSettings({...labSettings, namaLab: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg mt-1 font-semibold" 
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 uppercase text-[10px]">KEPALA LABORATORIUM</label>
                <input 
                  type="text" 
                  value={labSettings.kepalaLab}
                  onChange={(e) => setLabSettings({...labSettings, kepalaLab: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg mt-1 font-semibold" 
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 uppercase text-[10px]">JAM LAYANAN SIRKULASI</label>
                <input 
                  type="text" 
                  value={labSettings.jamBuka}
                  onChange={(e) => setLabSettings({...labSettings, jamBuka: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg mt-1" 
                />
              </div>
              <div>
                <label className="font-bold text-slate-600 uppercase text-[10px]">MAKSIMAL DURASI PINJAM (HARI)</label>
                <input 
                  type="number" 
                  value={labSettings.maksPinjamHari}
                  onChange={(e) => setLabSettings({...labSettings, maksPinjamHari: e.target.value})}
                  className="w-full p-2 border border-slate-200 rounded-lg mt-1" 
                />
              </div>
            </div>

            <div className="pt-3 border-t flex justify-end">
              <button 
                onClick={() => alert("Pengaturan laboratorium berhasil disimpan!")}
                className="px-4 py-2 bg-blue-900 text-white font-semibold rounded-lg text-xs shadow hover:bg-blue-950"
              >
                💾 Simpan Konfigurasi
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* HALAMAN MENU SIDEBAR 10: STATUS SERVER & NODE IOT         */}
        {/* ======================================================== */}
        {activeTab === "server" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">📊 Status Server Lokal & Node IoT Lab</h3>
                <p className="text-xs text-slate-400">Monitoring kesehatan layanan server Ubuntu, database inventaris, dan gateway sensor ruangan.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
                ● Semua Sistem Normal
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Server Web SIPL-IoT</span>
                  <span className="text-emerald-600 font-bold">ONLINE</span>
                </div>
                <p className="text-slate-500">Host: Ubuntu Server Local • Latency: 11ms</p>
                <p className="text-[10px] text-slate-400">Uptime: 18 Hari 4 Jam</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">MQTT Broker & Smart Locker</span>
                  <span className="text-emerald-600 font-bold">CONNECTED</span>
                </div>
                <p className="text-slate-500">Node ESP32 RFID Rak A-C Aktif (3/3)</p>
                <p className="text-[10px] text-slate-400">Port: 1883 • TLS Enabled</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-900">Sensor Suhu & Kelembaban Lab</span>
                  <span className="text-blue-700 font-bold">24.5°C / 55%</span>
                </div>
                <p className="text-slate-500">Kondisi Ruang Penyimpanan Komponen Optimal</p>
                <p className="text-[10px] text-slate-400">Update terakhir: 5 detik lalu</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">⚠️ Stok yang Perlu Diperhatikan</h3>
                  <p className="text-[11px] text-slate-400">Berdasarkan status inventaris di database</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                  {inventoryLoading ? "Memuat..." : inventoryLoaded ? `${stockAttentionItems.length} jenis` : "—"}
                </span>
              </div>
              {inventoryLoading ? (
                <p className="text-xs text-slate-500 py-4">Memuat status stok...</p>
              ) : !inventoryLoaded ? (
                <p className="text-xs text-slate-500 py-4">Informasi stok belum tersedia karena data inventaris belum berhasil diambil.</p>
              ) : stockAttentionItems.length === 0 ? (
                <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg p-3">Tidak ada barang berstatus habis atau perawatan.</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {stockAttentionItems.slice(0, 6).map((item) => (
                    <div key={item.id_barang} className="py-2 flex items-center justify-between gap-3 text-xs">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-800 truncate">{item.nama_barang}</p>
                        <p className="text-[10px] text-slate-400">{item.kode_barang} · {item.lokasi?.nama_lemari || "Lokasi —"}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-semibold ${inventoryStatusClass(item.status_barang)}`}>
                        {inventoryStatusLabel(item.status_barang)} · {item.jumlah_tersedia}/{item.jumlah_total}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button onClick={() => setActiveTab("inventaris")} className="text-blue-700 text-xs font-semibold hover:underline">Kelola Inventaris &rarr;</button>
              </div>
            </section>

            <section className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
              <div>
                <h3 className="font-bold text-sm text-slate-900">📊 Ringkasan Pengelolaan Lab</h3>
                <p className="text-[11px] text-slate-400">Status keterhubungan data operasional</p>
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Data inventaris</span>
                  <span className={`font-semibold ${inventoryLoaded ? "text-emerald-700" : "text-amber-700"}`}>{inventoryLoading ? "Memuat" : inventoryLoaded ? "Terhubung" : "Belum tersedia"}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <span className="text-slate-600">Peminjaman aktif</span>
                  <span className="text-slate-500">Menunggu API Admin</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-slate-600">Pengembalian</span>
                  <span className="text-slate-500">Menunggu API Admin</span>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 border-t border-slate-100 pt-3">
                Data peminjaman dan pengembalian tidak ditampilkan sebagai angka sampai endpoint database tersedia.
              </p>
            </section>
          </div>
        )}
      </main>

      {/* MODAL JADWAL PEMELIHARAAN / KALIBRASI */}
      {isMaintenanceModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsMaintenanceModalOpen(false); }}>
          <form onSubmit={handleMaintenanceSubmit} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Formulir pemeliharaan</p>
                <h3 className="text-lg font-bold text-slate-900">Jadwalkan Kalibrasi / Pemeliharaan</h3>
                <p className="mt-1 text-xs text-slate-500">Pilih perangkat dari katalog inventaris, lalu tentukan tindakan dan jadwalnya.</p>
              </div>
              <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="text-xl text-slate-400 hover:text-slate-700" aria-label="Tutup">×</button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Pilih komponen / perangkat *</span>
                <select required value={maintenanceForm.id_barang} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, id_barang: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5" disabled={!inventoryLoaded || inventoryData.length === 0}>
                  <option value="">{inventoryLoading ? "Memuat inventaris..." : inventoryData.length ? "Pilih barang dari inventaris" : "Inventaris belum tersedia"}</option>
                  {inventoryData.map((item) => <option key={item.id_barang} value={item.id_barang}>{item.kode_barang} — {item.nama_barang}</option>)}
                </select>
                <small className="text-slate-400">Pilihan berasal dari inventaris Supabase yang dimuat melalui API Laravel.</small>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Jenis tindakan *</span>
                <select required value={maintenanceForm.jenis} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, jenis: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5">
                  <option>Kalibrasi berkala</option>
                  <option>Pengecekan fungsi</option>
                  <option>Pembersihan perangkat</option>
                  <option>Perbaikan / penggantian komponen</option>
                  <option>Pengecekan keselamatan listrik</option>
                  <option>Lainnya</option>
                </select>
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Tanggal *</span>
                <input required type="date" value={maintenanceForm.tanggal} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, tanggal: event.target.value })} className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Waktu *</span>
                <input required type="time" value={maintenanceForm.waktu} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, waktu: event.target.value })} className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Teknisi / penanggung jawab *</span>
                <input required maxLength="150" value={maintenanceForm.teknisi} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, teknisi: event.target.value })} placeholder="Nama teknisi atau petugas" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Catatan pekerjaan</span>
                <textarea rows="3" maxLength="1000" value={maintenanceForm.catatan} onChange={(event) => setMaintenanceForm({ ...maintenanceForm, catatan: event.target.value })} placeholder="Detail pemeriksaan, alat ukur, atau komponen yang perlu disiapkan" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Jadwal yang dibuat akan muncul di tabel selama halaman ini terbuka. Penyimpanan permanen belum aktif karena API/tabel pemeliharaan belum tersedia.
            </div>
            {maintenanceFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">{maintenanceFormError}</div>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button type="button" onClick={() => setIsMaintenanceModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
              <button type="submit" disabled={!inventoryLoaded || inventoryData.length === 0} className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">Tambahkan Jadwal</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL CATAT PELANGGARAN / KERUSAKAN MAHASISWA */}
      {isSanctionModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setIsSanctionModalOpen(false); }}>
          <form onSubmit={handleSanctionSubmit} className="max-h-[92vh] w-full max-w-2xl space-y-4 overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Formulir kasus mahasiswa</p>
                <h3 className="text-lg font-bold text-slate-900">Tambah Pelanggaran / Kerusakan</h3>
                <p className="mt-1 text-xs text-slate-500">Masukkan identitas mahasiswa, komponen terkait, dan tindak lanjutnya.</p>
              </div>
              <button type="button" onClick={() => setIsSanctionModalOpen(false)} className="text-xl text-slate-400 hover:text-slate-700" aria-label="Tutup">×</button>
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">NIM *</span>
                <input required maxLength="30" value={sanctionForm.nim} onChange={(event) => setSanctionForm({ ...sanctionForm, nim: event.target.value })} placeholder="Masukkan NIM" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nama mahasiswa *</span>
                <input required maxLength="150" value={sanctionForm.nama} onChange={(event) => setSanctionForm({ ...sanctionForm, nama: event.target.value })} placeholder="Nama lengkap mahasiswa" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Barang / komponen terkait *</span>
                {inventoryLoaded && inventoryData.length > 0 ? (
                  <>
                    <select value={sanctionForm.id_barang} onChange={(event) => setSanctionForm({ ...sanctionForm, id_barang: event.target.value, nama_barang_manual: "" })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5">
                      <option value="">Pilih barang dari inventaris</option>
                      {inventoryData.map((item) => <option key={item.id_barang} value={item.id_barang}>{item.kode_barang} — {item.nama_barang}</option>)}
                    </select>
                    <small className="text-slate-400">Komponen dipilih langsung dari data inventaris.</small>
                  </>
                ) : (
                  <>
                    <input required maxLength="255" value={sanctionForm.nama_barang_manual} onChange={(event) => setSanctionForm({ ...sanctionForm, nama_barang_manual: event.target.value })} placeholder="Nama barang / komponen yang terlibat" className="w-full rounded-lg border border-slate-200 p-2.5" />
                    <small className="text-amber-700">Daftar inventaris belum bisa diakses. Nama komponen diisi manual untuk sementara.</small>
                  </>
                )}
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Tanggal kejadian *</span>
                <input required type="date" value={sanctionForm.tanggal} onChange={(event) => setSanctionForm({ ...sanctionForm, tanggal: event.target.value })} className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Status kompensasi</span>
                <select value={sanctionForm.status} onChange={(event) => setSanctionForm({ ...sanctionForm, status: event.target.value })} className="w-full rounded-lg border border-slate-200 bg-white p-2.5">
                  <option>Belum Lunas</option>
                  <option>Dalam Proses</option>
                  <option>Selesai</option>
                </select>
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Uraian pelanggaran / kerusakan *</span>
                <textarea required rows="3" maxLength="1500" value={sanctionForm.masalah} onChange={(event) => setSanctionForm({ ...sanctionForm, masalah: event.target.value })} placeholder="Jelaskan kejadian dan kondisi komponen" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
              <label className="space-y-1 md:col-span-2">
                <span className="font-bold text-slate-600">Bentuk sanksi / kompensasi *</span>
                <textarea required rows="2" maxLength="1000" value={sanctionForm.kompensasi} onChange={(event) => setSanctionForm({ ...sanctionForm, kompensasi: event.target.value })} placeholder="Contoh: penggantian komponen atau tindak lanjut sesuai aturan lab" className="w-full rounded-lg border border-slate-200 p-2.5" />
              </label>
            </div>

            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              Catatan kasus yang dibuat akan muncul di tabel selama halaman ini terbuka. Penyimpanan permanen belum aktif karena API/tabel sanksi belum tersedia.
            </div>
            {sanctionFormError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">{sanctionFormError}</div>}
            <div className="flex justify-end gap-2 border-t border-slate-200 pt-3">
              <button type="button" onClick={() => setIsSanctionModalOpen(false)} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600">Batal</button>
              <button type="submit" className="rounded-lg bg-blue-900 px-4 py-2 text-xs font-semibold text-white">Tambahkan Catatan</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL TAMBAH INVENTARIS: data disimpan melalui API Laravel */}
      {isCenterModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCenterFormSubmit} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Tambah Inventaris Baru</h3>
                <p className="text-[11px] text-slate-400 mt-1">Data akan disimpan ke database melalui API Laravel.</p>
              </div>
              <button type="button" onClick={() => { setIsCenterModalOpen(false); setFormError(""); }} disabled={saving} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Kode inventaris *</span>
                <input required maxLength="50" value={formData.kode_barang} onChange={(event) => setFormData({ ...formData, kode_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Contoh: INV-L1-001" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nama barang *</span>
                <input required maxLength="255" value={formData.nama_barang} onChange={(event) => setFormData({ ...formData, nama_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Nama alat atau bahan" />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Spesifikasi / keterangan *</span>
                <textarea required rows="3" value={formData.spesifikasi} onChange={(event) => setFormData({ ...formData, spesifikasi: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" placeholder="Spesifikasi barang sesuai data pendataan lab" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Jumlah total *</span>
                <input required type="number" min="1" step="1" value={formData.jumlah_total} onChange={(event) => setFormData({ ...formData, jumlah_total: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Jumlah tersedia *</span>
                <input required type="number" min="0" step="1" value={formData.jumlah_tersedia} onChange={(event) => setFormData({ ...formData, jumlah_tersedia: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Lokasi penyimpanan *</span>
                <select required value={formData.id_lokasi} onChange={(event) => setFormData({ ...formData, id_lokasi: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option value="">{lokasiList.length ? "Pilih lokasi penyimpanan" : "Lokasi belum tersedia dari database"}</option>
                  {lokasiList.map((lokasi) => <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>{lokasi.nama_lemari} — {lokasi.nomor_box}{lokasi.keterangan ? ` (${lokasi.keterangan})` : ""}</option>)}
                </select>
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Status inventaris *</span>
                <select value={formData.status_barang} onChange={(event) => setFormData({ ...formData, status_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Stok habis</option>
                  <option value="perawatan">Dalam perawatan</option>
                </select>
              </label>
            </div>

            {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">{formError}</div>}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => { setIsCenterModalOpen(false); setFormError(""); }} disabled={saving} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold">Batal</button>
              <button type="submit" disabled={saving || locationsLoading || lokasiList.length === 0} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan ke Database"}</button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL BERHASIL TAMBAH */}
      {isSuccessModalOpen && registeredItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full grid place-items-center text-lg">✓</div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Inventaris berhasil disimpan</h3>
                <p className="text-xs text-slate-500">Data telah dikirim ke API Laravel.</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-1">
              <p className="font-bold text-slate-900">{registeredItem.nama_barang}</p>
              <p className="text-slate-500">Kode: {registeredItem.kode_barang}</p>
              <p className="text-slate-500">Jumlah: {registeredItem.jumlah_tersedia} tersedia dari {registeredItem.jumlah_total} unit</p>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={() => setIsSuccessModalOpen(false)} className="px-5 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold">Selesai</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DETAIL / EDIT INVENTARIS */}
      {isDetailModalOpen && selectedItemDetail && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateItem} className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-200 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Inventaris</h3>
                <p className="text-[11px] text-slate-400 mt-1">Kode: {selectedItemDetail.kode_barang}</p>
              </div>
              <button type="button" onClick={() => { setIsDetailModalOpen(false); setSelectedItemDetail(null); setFormError(""); }} disabled={saving} className="text-slate-400 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Kode inventaris *</span>
                <input required maxLength="50" value={selectedItemDetail.kode_barang} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, kode_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Nama barang *</span>
                <input required maxLength="255" value={selectedItemDetail.nama_barang} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, nama_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Spesifikasi / keterangan *</span>
                <textarea required rows="3" value={selectedItemDetail.spesifikasi || ""} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, spesifikasi: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Jumlah total *</span>
                <input required type="number" min="1" step="1" value={selectedItemDetail.jumlah_total} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, jumlah_total: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="space-y-1">
                <span className="font-bold text-slate-600">Jumlah tersedia *</span>
                <input required type="number" min="0" step="1" value={selectedItemDetail.jumlah_tersedia} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, jumlah_tersedia: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg" />
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Lokasi penyimpanan *</span>
                <select required value={selectedItemDetail.id_lokasi} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, id_lokasi: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option value="">Pilih lokasi penyimpanan</option>
                  {lokasiList.map((lokasi) => <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>{lokasi.nama_lemari} — {lokasi.nomor_box}{lokasi.keterangan ? ` (${lokasi.keterangan})` : ""}</option>)}
                </select>
              </label>
              <label className="md:col-span-2 space-y-1">
                <span className="font-bold text-slate-600">Status inventaris *</span>
                <select value={selectedItemDetail.status_barang || "tersedia"} onChange={(event) => setSelectedItemDetail({ ...selectedItemDetail, status_barang: event.target.value })} className="w-full p-2 border border-slate-200 rounded-lg bg-white">
                  <option value="tersedia">Tersedia</option>
                  <option value="habis">Stok habis</option>
                  <option value="perawatan">Dalam perawatan</option>
                </select>
              </label>
            </div>

            {formError && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700" role="alert">{formError}</div>}
            <div className="flex flex-wrap justify-between gap-2 pt-3 border-t border-slate-200">
              <button type="button" onClick={() => handleDeleteItem(selectedItemDetail)} disabled={saving || deletingId === selectedItemDetail.id_barang} className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold disabled:opacity-50">{deletingId === selectedItemDetail.id_barang ? "Menghapus..." : "Hapus Inventaris"}</button>
              <div className="flex gap-2">
                <button type="button" onClick={() => { setIsDetailModalOpen(false); setSelectedItemDetail(null); setFormError(""); }} disabled={saving} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-600 text-xs font-semibold">Batal</button>
                <button type="submit" disabled={saving || locationsLoading || lokasiList.length === 0} className="px-4 py-2 bg-blue-900 text-white rounded-lg text-xs font-semibold disabled:opacity-50">{saving ? "Menyimpan..." : "Simpan Perubahan"}</button>
              </div>
            </div>
          </form>
        </div>
      )}

      {toast && <div className="fixed bottom-5 right-5 z-[70] bg-slate-900 text-white px-4 py-3 rounded-xl shadow-lg text-xs" role="status">{toast}</div>}
    </div>
  );
}