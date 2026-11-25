
"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "../../lib/api";

export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [inventaris, setInventaris] = useState([]);
    const [peminjaman, setPeminjaman] = useState([]);

    useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);
                setError("");

                const [inventoryResult, borrowingResult] =
                    await Promise.all([
                        apiRequest("/inventaris?per_page=100"),
                        apiRequest("/peminjaman?per_page=100"),
                    ]);

                setInventaris(
                    inventoryResult.data?.data || []
                );

                setPeminjaman(
                    borrowingResult.data?.data || []
                );
            } catch (err) {
                console.error("Dashboard error:", err);
                setError(err.message || "Gagal mengambil data dashboard.");
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const totalJenisBarang = inventaris.length;

    const totalBarang = inventaris.reduce(
        (total, barang) => total + Number(barang.jumlah_total || 0),
        0
    );

    const stokTersedia = inventaris.reduce(
        (total, barang) => total + Number(barang.jumlah_tersedia || 0),
        0
    );

    const statusCount = (status) =>
        peminjaman.filter(
            (item) => item.status_peminjaman === status
        ).length;

    const cards = [
        {
            label: "Jenis Inventaris",
            value: totalJenisBarang,
        },
        {
            label: "Total Barang",
            value: totalBarang,
        },
        {
            label: "Stok Tersedia",
            value: stokTersedia,
        },
        {
            label: "Sedang Dipinjam",
            value: statusCount("sedang_dipinjam"),
        },
    ];

    if (loading) {
        return (
            <div className="p-8 text-slate-400">
                Memuat data dashboard...
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8">
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-5 text-red-300">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 space-y-8">
            <header>
                <p className="text-sm text-blue-400 font-medium">
                    Panel Kepala Laboratorium
                </p>

                <h1 className="text-2xl md:text-3xl font-bold mt-2">
                    Dashboard
                </h1>

                <p className="text-slate-400 mt-2">
                    Ringkasan inventaris dan aktivitas peminjaman laboratorium.
                </p>
            </header>

            <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className="bg-slate-900 border border-slate-800 rounded-xl p-5"
                    >
                        <p className="text-sm text-slate-400">
                            {card.label}
                        </p>

                        <p className="text-3xl font-bold mt-3">
                            {card.value.toLocaleString("id-ID")}
                        </p>
                    </div>
                ))}
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-5">
                    Status Peminjaman
                </h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        ["Menunggu", "menunggu"],
                        ["Disetujui", "disetujui"],
                        ["Ditolak", "ditolak"],
                        ["Selesai", "selesai"],
                    ].map(([label, status]) => (
                        <div
                            key={status}
                            className="bg-slate-800/70 rounded-lg p-4"
                        >
                            <p className="text-sm text-slate-400">
                                {label}
                            </p>
                            <p className="text-2xl font-bold mt-2">
                                {statusCount(status)}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h2 className="text-lg font-semibold mb-4">
                    Pengajuan Peminjaman Terbaru
                </h2>

                {peminjaman.length === 0 ? (
                    <p className="text-sm text-slate-400">
                        Belum ada data peminjaman.
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-slate-400 border-b border-slate-800">
                                <tr>
                                    <th className="py-3 pr-4">Kode Transaksi</th>
                                    <th className="py-3 pr-4">Mahasiswa</th>
                                    <th className="py-3 pr-4">Tanggal Pengajuan</th>
                                    <th className="py-3">Status</th>
                                </tr>
                            </thead>

                            <tbody>
                                {peminjaman.slice(0, 5).map((item) => (
                                    <tr
                                        key={item.id_peminjaman}
                                        className="border-b border-slate-800 last:border-0"
                                    >
                                        <td className="py-3 pr-4">
                                            {item.kode_transaksi}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {item.mahasiswa?.nama || "-"}
                                        </td>
                                        <td className="py-3 pr-4">
                                            {item.tgl_pengajuan
                                                ? new Date(item.tgl_pengajuan).toLocaleDateString("id-ID")
                                                : "-"}
                                        </td>
                                        <td className="py-3">
                                            {item.status_peminjaman}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
}