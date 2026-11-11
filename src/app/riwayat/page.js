'use client';

import React, { useState } from 'react';
import {
  LayoutDashboard,
  Box,
  FileText,
  History,
  UserCheck,
  Settings,
  BookOpen,
  Search,
  Download,
  Calendar,
  Clock,
  QrCode,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  Flag,
  X,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export default function RiwayatPage() {
  const [activeTab, setActiveTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrxId, setSelectedTrxId] = useState('TRX-2025-0304-0089');
  
  const [modalType, setModalType] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const transactions = [
    {
      id: 'TRX-2025-0304-0089',
      date: '01 Mar 2025 • 09:15 WIB',
      title: 'ESP32 DevKit V1 (2x), Soil Moisture (1x), Relay 4-Ch (1x)',
      status: 'Aktif',
      category: 'Aktif',
      statusColor: 'bg-blue-100 text-blue-700 border-blue-300',
      deadline: 'Tempo: 06 Mar 2025 (2 hari lagi)',
      items: [
        { name: 'ESP32 DOIT DevKit V1', sku: 'MCU-ESP-01', sn: 'SN-9641, SN-9943', qty: '2 Unit', cond: 'Baik & Lengkap' },
        { name: 'Soil Moisture Sensor', sku: 'SEN-SMS-02', sn: 'Lot Batch #B24-88', qty: '1 Unit', cond: 'Bersih & Terkalibrasi' },
        { name: '4-Channel Relay Module', sku: 'MOD-RLY-04', sn: 'SN-RLY-3301', qty: '1 Unit', cond: 'Normal Utuh' },
      ]
    },
    {
      id: 'TRX-2025-0302-0042',
      date: '03 Mar 2025 • 14:20 WIB',
      title: 'Rigol Oscilloscope DS1054Z (1 unit)',
      status: 'Review Asisten Lab',
      category: 'Review',
      statusColor: 'bg-amber-100 text-amber-700 border-amber-300',
      queue: 'Antrean Verifikasi #2',
      items: [
        { name: 'Rigol Oscilloscope DS1054Z', sku: 'INS-OSC-01', sn: 'SN-OSC-998', qty: '1 Unit', cond: 'Khusus Lab' }
      ]
    },
    {
      id: 'TRX-2025-0220-0112',
      date: '20 Feb 2025 • 11:05 WIB',
      title: 'Arduino Uno R3 SMD (2x), Breadboard & Jumper Wire Set',
      status: 'Selesai / Kembali',
      category: 'Selesai',
      statusColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      info: 'Dikembalikan: 20 Feb 2025 (Tepat Waktu) • Kondisi Utuh',
      items: [
        { name: 'Arduino Uno R3 SMD', sku: 'MCU-ARD-02', sn: 'SN-ARD-112', qty: '2 Unit', cond: 'Utuh' }
      ]
    },
    {
      id: 'TRX-2025-0210-0087',
      date: '10 Feb 2025 • 08:30 WIB',
      title: 'Raspberry Pi 4 Model B 8GB (1 unit)',
      status: 'Ditolak',
      category: 'Ditolak',
      statusColor: 'bg-rose-100 text-rose-700 border-rose-300',
      reason: 'Alasan: Stok habis dialokasikan untuk Praktikum Modul 5.',
      items: [
        { name: 'Raspberry Pi 4 Model B', sku: 'SBC-RPI-04', sn: '-', qty: '1 Unit', cond: '-' }
      ]
    },
  ];

  const filterTabs = ['Semua', 'Aktif', 'Review', 'Selesai', 'Ditolak'];

  const filteredTransactions = transactions.filter((trx) => {
    const matchesTab = activeTab === 'Semua' || trx.category === activeTab;
    const matchesSearch = 
      trx.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
      trx.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const selectedTransaction = transactions.find((t) => t.id === selectedTrxId) || transactions[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 text-sm relative">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs border border-slate-700 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {modalType === 'pdf' && 'Unduh Bukti Peminjaman (PDF)'}
                {modalType === 'perpanjangan' && 'Formulir Perpanjangan Peminjaman'}
                {modalType === 'kendala' && 'Laporkan Kendala / Kerusakan Alat'}
                {modalType === 'loket' && 'Petunjuk & Lokasi Loket Lab IoT'}
                {modalType === 'qr' && 'Perbesar QR Pass Digital'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {modalType === 'pdf' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Dokumen Berita Acara & Bukti Peminjaman resmi bernomor <strong className="text-slate-800">{selectedTransaction.id}</strong> siap diunduh.</p>
                <button
                  onClick={() => { setModalType(null); showToast("File PDF berhasil diunduh ke perangkat Anda!"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Download File PDF Sekarang
                </button>
              </div>
            )}

            {modalType === 'perpanjangan' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Ajukan perpanjangan waktu peminjaman untuk transaksi <strong className="text-slate-800">{selectedTransaction.id}</strong> (+3 hari kerja).</p>
                <textarea rows="3" placeholder="Alasan perpanjangan..." className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"></textarea>
                <button
                  onClick={() => { setModalType(null); showToast("Permintaan perpanjangan berhasil dikirim ke Asisten Lab!"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Kirim Pengajuan Perpanjangan
                </button>
              </div>
            )}

            {modalType === 'kendala' && (
              <div className="space-y-3 text-xs text-slate-600">
                <textarea rows="3" placeholder="Jelaskan kendala secara detail..." className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"></textarea>
                <button
                  onClick={() => { setModalType(null); showToast("Laporan kendala telah dikirim ke teknisi lab."); }}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Kirim Laporan Kendala
                </button>
              </div>
            )}

            {modalType === 'loket' && (
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <strong className="text-slate-800 block text-sm">📍 Loket Administrasi & Meja Jaga Lab IoT</strong>
                  <p>Gedung Jurusan Teknik Elektro, Lantai 2, Ruang Lab Sistem Tertanam.</p>
                </div>
                <button onClick={() => setModalType(null)} className="w-full bg-slate-800 text-white py-2 rounded-xl">Tutup</button>
              </div>
            )}

            {modalType === 'qr' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-48 h-48 mx-auto bg-white border-2 border-slate-200 rounded-2xl p-3 flex items-center justify-center">
                  <QrCode size={160} className="text-slate-900" />
                </div>
                <button onClick={() => setModalType(null)} className="w-full bg-blue-600 text-white py-2 rounded-xl">Selesai</button>
              </div>
            )}
          </div>
        </div>
      )}

      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-bold text-white tracking-wider text-base">SIPL-IoT</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">IOT LABORATORY LAB</p>
        </div>

        <div className="px-4 py-2 text-[11px] font-semibold text-slate-500 uppercase">Mode Akses: Asisten Lab</div>

        <nav className="flex-1 px-3 space-y-1">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-3 pb-1">Mahasiswa</div>
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </a>
          <a href="/inventaris" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <Box size={18} />
            <span>Katalog & Cari Alat</span>
          </a>
          <a href="/peminjaman" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <FileText size={18} />
            <span>Pengajuan Peminjaman</span>
          </a>
          <a href="/riwayat" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium">
            <History size={18} />
            <span>Riwayat Peminjaman</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-slate-500 text-xs font-medium">
            SIPL IoT Lab / Mahasiswa / <span className="text-slate-800 font-semibold">Riwayat Peminjaman</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative w-80">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Cari hardware, sensor, atau ID pinjam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 text-slate-700 pl-9 pr-4 py-1.5 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none text-xs"
              />
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <h4 className="font-semibold text-slate-800 text-xs">Muh. Althaf Andriansyah</h4>
                <p className="text-[11px] text-slate-400">NIP. 2108561086</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Althaf" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h1 className="text-xl font-bold text-slate-900">Riwayat Peminjaman & Pelacakan Transaksi</h1>
              <p className="text-xs text-slate-500 mt-0.5">Pantau status permohonan, jadwal pengembalian, dan berita acara serah terima.</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setModalType('pdf')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Download size={14} /> Unduh Bukti Pinjam (PDF)
              </button>
              <button 
                onClick={() => setModalType('perpanjangan')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
              >
                <Calendar size={14} /> Ajukan Perpanjangan
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 pb-2">
                {filterTabs.map((tab, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                      activeTab === tab ? 'bg-blue-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                  <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                    Tidak ada riwayat transaksi yang cocok.
                  </div>
                ) : (
                  filteredTransactions.map((trx, index) => (
                    <div
                      key={index}
                      onClick={() => setSelectedTrxId(trx.id)}
                      className={`bg-white p-4 rounded-xl border transition cursor-pointer ${
                        selectedTrxId === trx.id ? 'border-blue-500 ring-2 ring-blue-500/10 shadow-sm' : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-mono font-bold text-xs text-slate-800">{trx.id}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${trx.statusColor}`}>
                          {trx.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">{trx.date}</div>
                      <p className="text-xs font-medium text-slate-800 line-clamp-2">{trx.title}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">PASS PENGEMBALIAN DIGITAL • SIPL-GATE-NODE-01</span>
                    <h3 className="font-bold text-slate-900 text-base font-mono mt-0.5">{selectedTransaction.id}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${selectedTransaction.statusColor}`}>
                    ● {selectedTransaction.status}
                  </span>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                      <Clock size={14} /> Tenggat: 06 Mar 2025 - 16:00 WIB
                    </span>
                    <div className="flex items-center gap-3 pt-2">
                      <div 
                        onClick={() => setModalType('qr')}
                        className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center p-1 cursor-pointer hover:border-blue-500 transition group shadow-sm"
                        title="Klik untuk memperbesar QR"
                      >
                        <QrCode size={48} className="text-slate-800 group-hover:text-blue-600 transition" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs">QR PASS LAB</h4>
                        <p className="text-[11px] text-slate-500">Klik QR untuk memperbesar</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50/60 rounded-xl border border-amber-200 p-4 text-xs space-y-3">
                <div className="flex items-center gap-2 pt-2">
                  <button 
                    onClick={() => setModalType('kendala')}
                    className="flex-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <Flag size={14} /> Laporkan Kendala / Rusak
                  </button>
                  <button 
                    onClick={() => setModalType('loket')}
                    className="flex-1 bg-white hover:bg-amber-100 border border-amber-300 text-amber-800 font-semibold py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 transition active:scale-95"
                  >
                    <ExternalLink size={14} /> Petunjuk Loket Lab
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}