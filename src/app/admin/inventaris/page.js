"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { apiRequest } from "../../lib/api";
import styles from "./inventaris.module.css";

const EMPTY_FORM = {
  kode_barang: "",
  nama_barang: "",
  spesifikasi: "",
  jumlah_total: "1",
  jumlah_tersedia: "1",
  id_lokasi: "",
  status_barang: "tersedia",
};


function formatStatus(status) {
  const labels = {
    tersedia: "Tersedia",
    habis: "Stok Habis",
    perawatan: "Dalam Perawatan",
  };
  return labels[status] || status || "—";
}

function statusClass(status, css) {
  if (status === "tersedia") return css.statusAvailable;
  if (status === "habis") return css.statusEmpty;
  return css.statusMaintenance;
}

export default function InventarisPage() {
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

  const [inventaris, setInventaris] = useState([]);
  const [lokasiList, setLokasiList] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [locationsLoading, setLocationsLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [toast, setToast] = useState("");

  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState({ q: "", status_barang: "", nama_lemari: "" });
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState(null); // null | "create" | "edit"
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const cabinetOptions = useMemo(
    () => [...new Set(lokasiList.map((item) => item.nama_lemari).filter(Boolean))].sort(),
    [lokasiList]
  );

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
    setLoading(true);
    setPageError("");

    try {
      const params = new URLSearchParams({ page: String(page), per_page: "15" });
      if (filters.q) params.set("q", filters.q);
      if (filters.status_barang) params.set("status_barang", filters.status_barang);
      if (filters.nama_lemari) params.set("nama_lemari", filters.nama_lemari);

      const result = await apiRequest(`/admin/inventaris?${params.toString()}`);
      setInventaris(Array.isArray(result?.data) ? result.data : []);
      setPagination({
        current_page: result?.current_page || 1,
        last_page: result?.last_page || 1,
        total: result?.total || 0,
        from: result?.from || 0,
        to: result?.to || 0,
      });
    } catch (error) {
      setInventaris([]);
      setPagination(null);
      if (error.status === 401) {
        setPageError("Sesi belum aktif. Silakan masuk menggunakan akun Kepala Lab untuk mengakses pengelolaan inventaris.");
      } else if (error.status === 403) {
        setPageError("Akun yang digunakan tidak memiliki hak akses Kepala Lab.");
      } else {
        setPageError(error.message || "Gagal mengambil data inventaris dari server.");
      }
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    if (authLoading || !authenticated || user?.role !== "kepala_lab") return;
    loadLocations();
  }, [authLoading, authenticated, user?.role, loadLocations]);

  useEffect(() => {
    if (authLoading || !authenticated || user?.role !== "kepala_lab") return;
    loadInventaris();
  }, [authLoading, authenticated, user?.role, loadInventaris]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  function applyFilters(event) {
    event.preventDefault();
    setPage(1);
    setFilters((current) => ({
      ...current,
      q: searchInput.trim(),
    }));
  }

  function openCreateModal() {
    setSelectedId(null);
    setForm({ ...EMPTY_FORM, id_lokasi: lokasiList[0]?.id_lokasi ? String(lokasiList[0].id_lokasi) : "" });
    setFormError("");
    setModalMode("create");
  }

  function openEditModal(item) {
    setSelectedId(item.id_barang);
    setForm({
      kode_barang: item.kode_barang || "",
      nama_barang: item.nama_barang || "",
      spesifikasi: item.spesifikasi || "",
      jumlah_total: String(item.jumlah_total ?? 0),
      jumlah_tersedia: String(item.jumlah_tersedia ?? 0),
      id_lokasi: String(item.id_lokasi ?? item.lokasi?.id_lokasi ?? ""),
      status_barang: item.status_barang || "tersedia",
    });
    setFormError("");
    setModalMode("edit");
  }

  function closeModal() {
    if (saving) return;
    setModalMode(null);
    setSelectedId(null);
    setFormError("");
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    const total = Number(form.jumlah_total);
    const tersedia = Number(form.jumlah_tersedia);

    if (!Number.isInteger(total) || total < 1) {
      setFormError("Jumlah total minimal 1 dan harus berupa bilangan bulat.");
      return;
    }
    if (!Number.isInteger(tersedia) || tersedia < 0 || tersedia > total) {
      setFormError("Jumlah tersedia harus berupa bilangan bulat antara 0 dan jumlah total.");
      return;
    }
    if (!form.id_lokasi) {
      setFormError("Pilih lokasi penyimpanan terlebih dahulu.");
      return;
    }

    const body = {
      kode_barang: form.kode_barang.trim(),
      nama_barang: form.nama_barang.trim(),
      spesifikasi: form.spesifikasi.trim(),
      jumlah_total: total,
      jumlah_tersedia: tersedia,
      id_lokasi: Number(form.id_lokasi),
      status_barang: form.status_barang,
    };

    setSaving(true);
    try {
      if (modalMode === "edit") {
        await apiRequest(`/admin/inventaris/${selectedId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        setToast("Data inventaris berhasil diperbarui.");
      } else {
        await apiRequest("/admin/inventaris", {
          method: "POST",
          body: JSON.stringify(body),
        });
        setToast("Inventaris baru berhasil disimpan ke database.");
      }

      setModalMode(null);
      setSelectedId(null);
      await loadInventaris();
    } catch (error) {
      const validationMessages = error.errors
        ? Object.values(error.errors).flat().join(" ")
        : "";
      setFormError(validationMessages || error.message || "Data gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Hapus inventaris ${item.nama_barang} (${item.kode_barang})? Data yang sudah memiliki riwayat peminjaman mungkin tidak dapat dihapus.`
    );
    if (!confirmed) return;

    setDeletingId(item.id_barang);
    try {
      await apiRequest(`/admin/inventaris/${item.id_barang}`, { method: "DELETE" });
      setToast("Data inventaris berhasil dihapus.");
      await loadInventaris();
    } catch (error) {
      setToast(error.status === 409
        ? "Inventaris tidak dapat dihapus karena sudah memiliki riwayat peminjaman."
        : error.message || "Data inventaris gagal dihapus.");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  if (authLoading || !authenticated || user?.role !== "kepala_lab") {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-50 text-slate-600 text-sm">
        Memverifikasi sesi Kepala Lab...
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div>
          <Link href="/admin/dashboard" className={styles.brand}>
            <span className={styles.brandMark}>⌁</span>
            <span>
              <strong>SIPL-IoT</strong>
              <small>LAB INVENTORY SYSTEM</small>
            </span>
          </Link>

          <div className={styles.navGroup}>
            <p className={styles.navHeading}>MENU UTAMA</p>
            <Link href="/admin/dashboard" className={styles.navLink}>
              <span>▦</span> Dashboard
            </Link>
            <Link href="/admin/inventaris" className={`${styles.navLink} ${styles.navActive}`}>
              <span>▣</span> Kelola Inventaris
            </Link>
            <div className={`${styles.navLink} ${styles.navDisabled}`} title="Fitur dikerjakan pada tahap berikutnya">
              <span>⇄</span> Peminjaman Aktif
            </div>
            <div className={`${styles.navLink} ${styles.navDisabled}`} title="Fitur dikerjakan pada tahap berikutnya">
              <span>✓</span> Pengembalian
            </div>
            <Link href="/riwayat" className={styles.navLink}>
              <span>◷</span> Riwayat Peminjaman
            </Link>
          </div>
        </div>

        <div className={styles.sidebarFooter}>
          <span className={styles.onlineDot} /> Sistem Inventaris Lab IoT
          <small>Area Admin / Kepala Lab</small>
        </div>
      </aside>

      <main className={styles.main}>
        <header className={styles.topbar}>
          <div>
            <p className={styles.breadcrumb}>SIPL-IoT / Admin / <strong>Kelola Inventaris</strong></p>
            <h1>Kelola Inventaris</h1>
            <p className={styles.subtitle}>Kelola data alat dan bahan laboratorium yang tersimpan di database.</p>
          </div>
          <div className={styles.adminPill}>
            <span className={styles.adminAvatar}>KL</span>
            <span><strong>{user?.nama || "Kepala Laboratorium"}</strong><small>Kepala Lab</small></span>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-2 rounded-lg border border-slate-200 px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 hover:text-rose-600"
            >
              Keluar
            </button>
          </div>
        </header>

        {pageError && (
          <div className={styles.errorBanner} role="alert">
            <strong>{pageError}</strong>
            <span>Data tidak diganti dengan contoh atau data dummy.</span>
            <button type="button" onClick={() => { loadLocations(); loadInventaris(); }}>Coba lagi</button>
          </div>
        )}

        <section className={styles.summaryGrid} aria-label="Ringkasan inventaris">
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>▣</span>
            <div><small>Jenis inventaris</small><strong>{pagination ? pagination.total : "—"}</strong><span>Data dari database</span></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>⌕</span>
            <div><small>Lokasi penyimpanan</small><strong>{locationsLoading ? "—" : lokasiList.length}</strong><span>Lokasi terdaftar</span></div>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryIcon}>≡</span>
            <div><small>Data ditampilkan</small><strong>{inventaris.length}</strong><span>Baris pada halaman ini</span></div>
          </article>
        </section>

        <section className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <h2>Daftar Alat & Bahan</h2>
              <p>Data inventaris diambil langsung dari Supabase melalui API Laravel.</p>
            </div>
            <button type="button" className={styles.primaryButton} onClick={openCreateModal} disabled={locationsLoading || lokasiList.length === 0}>
              <span>＋</span> Tambah Inventaris
            </button>
          </div>

          <form className={styles.filters} onSubmit={applyFilters}>
            <label className={styles.searchBox}>
              <span>⌕</span>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Cari nama barang atau kode inventaris..."
              />
            </label>
            <select
              value={filters.nama_lemari}
              onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, nama_lemari: event.target.value })); }}
              aria-label="Filter lemari"
            >
              <option value="">Semua Lemari</option>
              {cabinetOptions.map((cabinet) => <option key={cabinet} value={cabinet}>{cabinet}</option>)}
            </select>
            <select
              value={filters.status_barang}
              onChange={(event) => { setPage(1); setFilters((current) => ({ ...current, status_barang: event.target.value })); }}
              aria-label="Filter status"
            >
              <option value="">Semua Status</option>
              <option value="tersedia">Tersedia</option>
              <option value="habis">Stok Habis</option>
              <option value="perawatan">Dalam Perawatan</option>
            </select>
            <button type="submit" className={styles.secondaryButton}>Cari</button>
            <button type="button" className={styles.resetButton} onClick={() => { setSearchInput(""); setFilters({ q: "", status_barang: "", nama_lemari: "" }); setPage(1); }}>Reset</button>
          </form>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Kode inventaris</th>
                  <th>Nama barang</th>
                  <th>Lokasi penyimpanan</th>
                  <th>Stok tersedia</th>
                  <th>Status</th>
                  <th className={styles.actionHeading}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className={styles.tableMessage}>Memuat data inventaris dari database...</td></tr>
                ) : pageError ? (
                  <tr><td colSpan="6" className={styles.tableMessage}>Data belum dapat dimuat karena akses API belum tersedia.</td></tr>
                ) : inventaris.length === 0 ? (
                  <tr><td colSpan="6" className={styles.tableMessage}>Tidak ada data yang sesuai dengan pencarian atau filter.</td></tr>
                ) : inventaris.map((item) => (
                  <tr key={item.id_barang}>
                    <td><span className={styles.code}>{item.kode_barang}</span></td>
                    <td>
                      <strong className={styles.itemName}>{item.nama_barang}</strong>
                      <span className={styles.specification}>{item.spesifikasi || "Spesifikasi belum diisi"}</span>
                    </td>
                    <td>
                      <strong className={styles.locationName}>{item.lokasi?.nama_lemari || "Lokasi belum tersedia"}</strong>
                      <span className={styles.specification}>{item.lokasi?.nomor_box || "—"}</span>
                    </td>
                    <td>
                      <strong className={styles.stock}>{item.jumlah_tersedia} <span>/ {item.jumlah_total}</span></strong>
                      <span className={styles.specification}>unit tersedia / total</span>
                    </td>
                    <td><span className={`${styles.status} ${statusClass(item.status_barang, styles)}`}>{formatStatus(item.status_barang)}</span></td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button type="button" className={styles.editButton} onClick={() => openEditModal(item)}>Edit</button>
                        <button type="button" className={styles.deleteButton} onClick={() => handleDelete(item)} disabled={deletingId === item.id_barang}>
                          {deletingId === item.id_barang ? "Menghapus..." : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span>
              {pagination && pagination.total > 0
                ? `Menampilkan ${pagination.from}–${pagination.to} dari ${pagination.total} data`
                : ""}
            </span>
            <div className={styles.pageControls}>
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={loading || !pagination || page <= 1}>Sebelumnya</button>
              <span>Halaman {pagination?.current_page || page} dari {pagination?.last_page || 1}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(pagination?.last_page || current, current + 1))} disabled={loading || !pagination || page >= pagination.last_page}>Berikutnya</button>
            </div>
          </div>
        </section>

        <p className={styles.pageNote}>Perubahan yang disimpan melalui halaman ini akan dikirim ke API Laravel dan disimpan pada database Supabase.</p>
      </main>

      {modalMode && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="inventory-modal-title">
            <div className={styles.modalHeader}>
              <div>
                <p>FORMULIR INVENTARIS</p>
                <h2 id="inventory-modal-title">{modalMode === "edit" ? "Ubah Data Inventaris" : "Tambah Inventaris Baru"}</h2>
              </div>
              <button type="button" className={styles.closeButton} onClick={closeModal} disabled={saving} aria-label="Tutup">×</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGrid}>
                <label>
                  <span>Kode inventaris *</span>
                  <input required maxLength="50" value={form.kode_barang} onChange={(event) => updateForm("kode_barang", event.target.value)} placeholder="Masukkan kode inventaris" />
                </label>
                <label>
                  <span>Nama barang *</span>
                  <input required maxLength="255" value={form.nama_barang} onChange={(event) => updateForm("nama_barang", event.target.value)} placeholder="Nama alat atau bahan" />
                </label>
                <label className={styles.fullField}>
                  <span>Spesifikasi / keterangan *</span>
                  <textarea required rows="3" value={form.spesifikasi} onChange={(event) => updateForm("spesifikasi", event.target.value)} placeholder="Tuliskan spesifikasi, kelengkapan, atau catatan barang berdasarkan pendataan lab." />
                </label>
                <label>
                  <span>Jumlah total *</span>
                  <input required type="number" min="1" step="1" value={form.jumlah_total} onChange={(event) => updateForm("jumlah_total", event.target.value)} />
                </label>
                <label>
                  <span>Jumlah tersedia *</span>
                  <input required type="number" min="0" step="1" value={form.jumlah_tersedia} onChange={(event) => updateForm("jumlah_tersedia", event.target.value)} />
                </label>
                <label className={styles.fullField}>
                  <span>Lokasi penyimpanan *</span>
                  <select required value={form.id_lokasi} onChange={(event) => updateForm("id_lokasi", event.target.value)}>
                    <option value="">Pilih lokasi penyimpanan</option>
                    {lokasiList.map((lokasi) => (
                      <option key={lokasi.id_lokasi} value={lokasi.id_lokasi}>
                        {lokasi.nama_lemari} — {lokasi.nomor_box}{lokasi.keterangan ? ` (${lokasi.keterangan})` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                <label className={styles.fullField}>
                  <span>Status inventaris *</span>
                  <select value={form.status_barang} onChange={(event) => updateForm("status_barang", event.target.value)}>
                    <option value="tersedia">Tersedia (mengikuti stok)</option>
                    <option value="habis">Stok habis (mengikuti stok)</option>
                    <option value="perawatan">Dalam perawatan</option>
                  </select>
                  <small>Status tersedia/habis dihitung berdasarkan jumlah stok. Pilih perawatan jika barang sedang tidak dapat digunakan.</small>
                </label>
              </div>

              {formError && <div className={styles.formError} role="alert">{formError}</div>}

              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelButton} onClick={closeModal} disabled={saving}>Batal</button>
                <button type="submit" className={styles.primaryButton} disabled={saving || lokasiList.length === 0}>
                  {saving ? "Menyimpan..." : modalMode === "edit" ? "Simpan Perubahan" : "Simpan ke Database"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {toast && <div className={styles.toast} role="status">{toast}</div>}
    </div>
  );
}
