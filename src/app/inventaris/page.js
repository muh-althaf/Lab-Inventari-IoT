
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../lib/api";
import {
  Search, LayoutDashboard, Box, FileText, History,
  LogOut, Package, MapPin, Filter, X, ShoppingBag,
  ChevronLeft, ChevronRight, RefreshCw, AlertCircle,
  Info, BookOpen
} from "lucide-react";

export default function InventarisPage() {
  const router = useRouter();
  const { user, loading, authenticated, logout } = useAuth();

  const [items, setItems] = useState([]);
  const [locations, setLocations] = useState([]);

  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [onlyAvailable, setOnlyAvailable] = useState(false);

  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  const [selectedItem, setSelectedItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [toast, setToast] = useState("");

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

  useEffect(() => {
    if (!authenticated || user?.role !== "mahasiswa") return;

    loadLocations();
  }, [authenticated, user]);

  useEffect(() => {
    if (!authenticated || user?.role !== "mahasiswa") return;

    const timer = setTimeout(() => {
      loadInventory();
    }, 350);

    return () => clearTimeout(timer);
  }, [authenticated, user, page, search, locationFilter, onlyAvailable]);

  async function loadLocations() {
    try {
      const result = await apiRequest("/lokasi-penyimpanan");
      setLocations(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      console.error("Gagal memuat lokasi:", err);
    }
  }

  async function loadInventory() {
    try {
      setFetching(true);
      setError("");

      const params = new URLSearchParams({
        page: String(page),
        per_page: "12",
      });

      if (search.trim()) params.set("search", search.trim());
      if (locationFilter) params.set("id_lokasi", locationFilter);

      const result = await apiRequest(`/inventaris?${params.toString()}`);
      const paginator = result.data;

      let rows = Array.isArray(paginator?.data) ? paginator.data : [];

      if (onlyAvailable) {
        rows = rows.filter(
          (item) => Number(item.jumlah_tersedia || 0) > 0
        );
      }

      setItems(rows);
      setLastPage(paginator?.last_page || 1);
      setTotal(paginator?.total || rows.length);
    } catch (err) {
      setError(err.message || "Gagal mengambil data inventaris.");
    } finally {
      setFetching(false);
    }
  }

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(""), 2500);
  }

  function addToCart(item) {
    if (Number(item.jumlah_tersedia) <= 0) {
      showToast("Stok barang sedang kosong.");
      return;
    }

    const exists = cart.some(
      (cartItem) => cartItem.id_barang === item.id_barang
    );

    if (exists) {
      showToast("Barang sudah ada dalam keranjang.");
      return;
    }

    setCart((previous) => [
      ...previous,
      {
        id_barang: item.id_barang,
        kode_barang: item.kode_barang,
        nama_barang: item.nama_barang,
        jumlah_tersedia: item.jumlah_tersedia,
      },
    ]);

    showToast("Barang ditambahkan ke keranjang.");
  }

  function removeFromCart(id) {
    setCart((previous) =>
      previous.filter((item) => item.id_barang !== id)
    );
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  function resetFilters() {
    setSearch("");
    setLocationFilter("");
    setOnlyAvailable(false);
    setPage(1);
  }

  if (loading || !authenticated || !user) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        Memverifikasi sesi pengguna...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl text-sm">
          {toast}
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 shrink-0 bg-slate-950 text-slate-300 hidden md:flex flex-col">
        <div className="p-5 border-b border-slate-800">
          <h1 className="font-bold text-white tracking-wide">SIPL-IoT</h1>
          <p className="text-[10px] text-slate-500 mt-1">Laboratory System</p>
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-slate-500">
            Menu Mahasiswa
          </p>

          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-800 text-sm">
            <LayoutDashboard size={18} /> Dashboard
          </Link>

          <Link href="/inventaris" className="flex items-center gap-3 px-3 py-3 rounded-lg bg-blue-600 text-white text-sm">
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

      {/* MAIN */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 md:px-8 py-4 flex justify-between items-center gap-3">
          <div>
            <p className="text-xs text-slate-400">SIPL-IoT / Mahasiswa</p>
            <h2 className="font-bold text-slate-800">Katalog Inventaris</h2>
          </div>

          <div className="text-right">
            <p className="text-sm font-semibold">{user.nama}</p>
            <p className="text-xs text-slate-400">{user.nip_nim}</p>
          </div>
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto space-y-6">
          {/* TITLE */}
          <section>
            <h1 className="text-2xl font-bold">Inventaris Laboratorium</h1>
            <p className="text-sm text-slate-500 mt-1">
              Cari dan periksa ketersediaan perangkat Laboratorium IoT.
            </p>
          </section>

          {/* FILTER */}
          <section className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
            <div className="grid md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-slate-400" size={17} />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Cari nama atau kode barang..."
                  className="w-full border border-slate-200 rounded-xl pl-10 pr-3 py-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <select
                value={locationFilter}
                onChange={(e) => {
                  setLocationFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Semua lokasi penyimpanan</option>
                {locations.map((location) => (
                  <option key={location.id_lokasi} value={location.id_lokasi}>
                    {location.nama_lemari} - {location.nomor_box}
                  </option>
                ))}
              </select>

              <button
                onClick={resetFilters}
                className="border border-slate-200 rounded-xl px-3 py-3 text-sm hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={15} /> Reset Filter
              </button>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 mt-4">
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded text-blue-600"
                />
                Hanya tampilkan barang tersedia
              </label>

              <p className="text-xs text-slate-400">
                {total} data inventaris
              </p>
            </div>
          </section>

          {/* ERROR */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl p-4 flex gap-2 text-sm">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* LOADING */}
          {fetching ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
              Memuat inventaris dari server...
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
              <Package className="mx-auto text-slate-300" size={40} />
              <p className="font-semibold mt-3">Barang tidak ditemukan</p>
              <p className="text-sm text-slate-400 mt-1">
                Coba ubah kata kunci atau filter pencarian.
              </p>
            </div>
          ) : (
            <>
              {/* GRID BARANG */}
              <section className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map((item) => {
                  const available = Number(item.jumlah_tersedia || 0);
                  const totalStock = Number(item.jumlah_total || 0);
                  const empty = available <= 0;

                  return (
                    <article
                      key={item.id_barang}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-blue-300 transition flex flex-col"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 grid place-items-center">
                          <Package size={22} />
                        </div>

                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${empty
                          ? "bg-rose-50 text-rose-600"
                          : "bg-emerald-50 text-emerald-700"
                          }`}>
                          {empty ? "Stok kosong" : "Tersedia"}
                        </span>
                      </div>

                      <div className="mt-4 flex-1">
                        <p className="text-[11px] font-mono text-slate-400">
                          {item.kode_barang || `ID-${item.id_barang}`}
                        </p>

                        <h3 className="font-bold text-slate-900 mt-1">
                          {item.nama_barang}
                        </h3>

                        <p className="text-xs text-slate-500 mt-2 line-clamp-3">
                          {item.spesifikasi || "Tidak ada spesifikasi tambahan."}
                        </p>
                      </div>

                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Stok tersedia</span>
                          <strong>{available} / {totalStock} unit</strong>
                        </div>

                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full"
                            style={{
                              width: `${totalStock > 0 ? Math.min((available / totalStock) * 100, 100) : 0}%`,
                            }}
                          />
                        </div>

                        <div className="flex items-start gap-2 text-xs text-slate-500">
                          <MapPin size={14} className="shrink-0 mt-0.5" />
                          <span>
                            {item.lokasi?.nama_lemari || "Lokasi belum diatur"}
                            {" • "}
                            {item.lokasi?.nomor_box || "-"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2">
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="border border-slate-200 rounded-lg py-2 text-xs font-semibold hover:bg-slate-50 flex justify-center items-center gap-1"
                          >
                            <Info size={14} /> Detail
                          </button>

                          <button
                            onClick={() => addToCart(item)}
                            disabled={empty}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg py-2 text-xs font-semibold"
                          >
                            + Ajukan
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </section>

              {/* PAGINATION */}
              <div className="flex justify-between items-center bg-white border border-slate-200 rounded-xl p-4">
                <p className="text-xs text-slate-500">
                  Halaman {page} dari {lastPage}
                </p>

                <div className="flex gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="p-2 border rounded-lg disabled:opacity-40"
                  >
                    <ChevronLeft size={17} />
                  </button>

                  <button
                    disabled={page >= lastPage}
                    onClick={() => setPage((p) => p + 1)}
                    className="p-2 border rounded-lg disabled:opacity-40"
                  >
                    <ChevronRight size={17} />
                  </button>
                </div>
              </div>
            </>
          )}

          {/* CART */}
          <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShoppingBag className="text-blue-600" size={20} />
                <h2 className="font-bold">Keranjang Pengajuan</h2>
              </div>
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">
                {cart.length} barang
              </span>
            </div>

            {cart.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Belum ada barang yang dipilih.
              </p>
            ) : (
              <div className="mt-4 divide-y divide-slate-100">
                {cart.map((item) => (
                  <div key={item.id_barang} className="py-3 flex justify-between items-center gap-3">
                    <div>
                      <p className="text-sm font-semibold">{item.nama_barang}</p>
                      <p className="text-xs text-slate-400">{item.kode_barang}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id_barang)}
                      className="text-rose-500 text-xs hover:underline"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            )}

            <button
              disabled={cart.length === 0}
              onClick={() => showToast("API pengajuan peminjaman belum tersedia. Keranjang belum dikirim.")}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl py-3 text-sm font-semibold"
            >
              Lanjut Pengajuan ({cart.length})
            </button>

            <p className="text-[11px] text-slate-400 mt-3 text-center">
              Pengiriman pengajuan akan diaktifkan setelah API peminjaman selesai dibuat.
            </p>
          </section>

          <section className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <BookOpen className="text-blue-600 shrink-0" size={18} />
            <p className="text-xs text-blue-900">
              Periksa jumlah stok dan lokasi penyimpanan sebelum mengajukan peminjaman.
            </p>
          </section>
        </div>
      </main>

      {/* DETAIL MODAL */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm grid place-items-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-4">
              <h3 className="font-bold text-lg">Detail Barang</h3>
              <button onClick={() => setSelectedItem(null)}>
                <X size={20} className="text-slate-400" />
              </button>
            </div>

            <div className="py-5 space-y-4">
              <div>
                <p className="text-xs text-slate-400">Nama barang</p>
                <p className="font-bold text-lg">{selectedItem.nama_barang}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <DetailField label="Kode barang" value={selectedItem.kode_barang} />
                <DetailField label="Status" value={selectedItem.status_barang} />
                <DetailField label="Jumlah total" value={selectedItem.jumlah_total} />
                <DetailField label="Jumlah tersedia" value={selectedItem.jumlah_tersedia} />
                <DetailField label="Lemari" value={selectedItem.lokasi?.nama_lemari} />
                <DetailField label="Kotak" value={selectedItem.lokasi?.nomor_box} />
              </div>

              <div>
                <p className="text-xs text-slate-400">Spesifikasi</p>
                <p className="text-sm mt-1">
                  {selectedItem.spesifikasi || "Tidak ada spesifikasi."}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Keterangan lokasi</p>
                <p className="text-sm mt-1">
                  {selectedItem.lokasi?.keterangan || "-"}
                </p>
              </div>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="w-full bg-slate-900 text-white rounded-xl py-3 text-sm font-semibold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-sm font-semibold mt-1">{value ?? "-"}</p>
    </div>
  );
}
