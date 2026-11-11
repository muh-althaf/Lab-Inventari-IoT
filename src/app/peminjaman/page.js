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
  Plus,
  Trash2,
  Send,
  CheckCircle2,
  AlertCircle,
  X,
  Calendar,
} from 'lucide-react';

export default function PeminjamanPage() {
  const [selectedTools, setSelectedTools] = useState([
    { id: 'MCU-ESP-01', name: 'ESP32 DOIT DevKit V1 30-Pin', qty: 2, stock: 45, location: 'Rak A-02' }
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [dosen, setDosen] = useState('Dr. Ir. Hendra S., M.T.');
  const [keperluan, setKeperluan] = useState('Tugas Akhir: Smart Farming IoT LoRa & MQTT');
  const [durasi, setDurasi] = useState('3');
  const [toastMessage, setToastMessage] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Katalog sampel untuk dipilih
  const availableTools = [
    { id: 'MCU-ESP-01', name: 'ESP32 DOIT DevKit V1 30-Pin', stock: 45, location: 'Rak A-02' },
    { id: 'MCU-ARD-02', name: 'Arduino Uno R3 SMD', stock: 30, location: 'Rak A-01' },
    { id: 'SEN-DHT-22', name: 'DHT22 Digital Temperature Sensor', stock: 50, location: 'Rak C-01' },
    { id: 'KIT-SEN-37', name: 'Sensor Kit 37-in-1 IoT Pack', stock: 20, location: 'Rak C-03' },
    { id: 'MOD-RLY-04', name: '4-Channel Relay Module 5V', stock: 15, location: 'Rak B-02' },
  ];

  const filteredCatalog = availableTools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToolToForm = (tool) => {
    if (selectedTools.some(item => item.id === tool.id)) {
      showToast(`${tool.name} sudah ada dalam daftar pengajuan!`);
      return;
    }
    setSelectedTools([...selectedTools, { ...tool, qty: 1 }]);
    showToast(`${tool.name} ditambahkan ke formulir.`);
  };

  const removeTool = (id) => {
    setSelectedTools(selectedTools.filter(item => item.id !== id));
    showToast("Perangkat dihapus dari daftar.");
  };

  const updateQty = (id, newQty) => {
    setSelectedTools(selectedTools.map(item => {
      if (item.id === id) {
        const qty = Math.max(1, Math.min(item.stock, Number(newQty)));
        return { ...item, qty };
      }
      return item;
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedTools.length === 0) {
      showToast("Pilih minimal 1 perangkat hardware!");
      return;
    }
    setShowSuccessModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-800 text-sm relative">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs border border-slate-700 animate-bounce">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Pengajuan Berhasil Dikirim!</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Formulir peminjaman Anda telah masuk ke antrean verifikasi Asisten Lab (<strong className="text-slate-700">Bagas Pratama, S.T.</strong>). Pantau status di menu Riwayat Peminjaman.
            </p>
            <button
              onClick={() => { setShowSuccessModal(false); window.location.href = '/riwayat'; }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md text-xs"
            >
              Lihat Riwayat & Pelacakan Transaksi
            </button>
          </div>
        </div>
      )}

      {/* SIDEBAR NAVIGATION */}
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
          <a href="/peminjaman" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium">
            <FileText size={18} />
            <span>Pengajuan Peminjaman</span>
          </a>
          <a href="/riwayat" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <History size={18} />
            <span>Riwayat Peminjaman</span>
          </a>

          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-4 pb-1">Administrasi & Lab</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <LayoutDashboard size={18} />
            <span>Dashboard Admin</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <Box size={18} />
            <span>Inventaris Alat (CRUD)</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <UserCheck size={18} />
            <span>Persetujuan Pinjaman</span>
          </a>

          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-4 pb-1">Sistem</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <Settings size={18} />
            <span>Pengaturan Profil</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <BookOpen size={18} />
            <span>Panduan SOP Lab</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs flex justify-between items-center text-slate-400">
          <span>BLAB-NODE v2.4</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">● ONLINE</span>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-slate-500 text-xs font-medium">
            SIPL IoT Lab / Mahasiswa / <span className="text-slate-800 font-semibold">Formulir Pengajuan Peminjaman</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <h4 className="font-semibold text-slate-800 text-xs">Muh. Althaf Andriansyah</h4>
              <p className="text-[11px] text-slate-400">NIM. 2108561086</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Althaf" alt="Avatar" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6 max-w-5xl mx-auto w-full">
          {/* BANNER HEADER */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-1">
            <h1 className="text-xl font-bold text-slate-900">Formulir Pengajuan Peminjaman Alat IoT</h1>
            <p className="text-xs text-slate-500">Lengkapi formulir di bawah ini dengan memilih perangkat dan melampirkan detail keperluan praktikum atau tugas akhir.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* GRID UTAMA: FORM & KATALOG PILIHAN */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* KIRI: DAFTAR ALAT YANG DIPILIH */}
              <div className="lg:col-span-7 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Perangkat yang Diajukan ({selectedTools.length})</h3>
                    <span className="text-[11px] text-slate-400">Maks. 5 Jenis Alat</span>
                  </div>

                  {selectedTools.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 text-xs">
                      Belum ada perangkat yang dipilih. Silakan pilih dari katalog di sebelah kanan.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedTools.map((tool, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs gap-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-slate-800">{tool.name}</h4>
                            <span className="text-[10px] text-slate-400 font-mono">SKU: {tool.id} | Lokasi: {tool.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 block">Jumlah</span>
                              <input
                                type="number"
                                min="1"
                                max={tool.stock}
                                value={tool.qty}
                                onChange={(e) => updateQty(tool.id, e.target.value)}
                                className="w-14 text-center border border-slate-200 rounded-lg py-1 text-xs focus:outline-none focus:border-blue-500 bg-white font-semibold"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeTool(tool.id)}
                              className="text-rose-500 hover:text-rose-700 p-2 rounded-lg hover:bg-rose-50 transition"
                              title="Hapus"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DETAIL KEPERLUAN */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-3">Detail Keperluan & Dosen Pembimbing</h3>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Dosen Pembimbing / Penanggung Jawab:</label>
                      <input
                        type="text"
                        value={dosen}
                        onChange={(e) => setDosen(e.target.value)}
                        placeholder="Nama Dosen & Gelar"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Keperluan / Judul Tugas Akhir:</label>
                      <textarea
                        rows="2"
                        value={keperluan}
                        onChange={(e) => setKeperluan(e.target.value)}
                        placeholder="Jelaskan peruntukan alat..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                        required
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Durasi Peminjaman:</label>
                        <select
                          value={durasi}
                          onChange={(e) => setDurasi(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500"
                        >
                          <option value="3">3 Hari Kerja</option>
                          <option value="5">5 Hari Kerja (Maksimal)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">Unggah Proposal / Surat:</label>
                        <input
                          type="file"
                          className="w-full text-[11px] text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* KANAN: KATALOG PENCARIAN ALAT TAMBAHAN */}
              <div className="lg:col-span-5 space-y-4">
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">Tambah Perangkat dari Katalog</h3>

                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Cari alat tambahan..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {filteredCatalog.map((tool, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div>
                          <h4 className="font-bold text-slate-800">{tool.name}</h4>
                          <span className="text-[10px] text-slate-400">Stok: {tool.stock} • {tool.location}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addToolToForm(tool)}
                          className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-lg transition shadow-sm"
                          title="Tambah ke formulir"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* TOMBOL SUBMIT FINAL */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
                    <p>Pastikan data NIM, Dosen Pembimbing, dan daftar alat sudah benar sebelum mengajukan verifikasi ke Asisten Lab.</p>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl text-xs transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Send size={16} /> Kirim Formulir Pengajuan Pinjam
                  </button>
                </div>
              </div>

            </div>
          </form>
        </div>
      </main>
    </div>
  );
}