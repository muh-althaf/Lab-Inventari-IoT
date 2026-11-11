'use client';

import React, { useState } from 'react';
import {
  Search,
  LayoutDashboard,
  Box,
  FileText,
  History,
  UserCheck,
  Settings,
  BookOpen,
  ShoppingBag,
  ChevronRight,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function InventarisPage() {
  const [activeCategory, setActiveCategory] = useState('Semua (48)');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [cart, setCart] = useState([
    { id: 'MCU-ESP-01', name: 'ESP32 DevKit V1', sku: 'MCU-ESP01-01', qty: 1 },
    { id: 'SEN-DHT22', name: 'DHT22 Temp Se...', sku: 'SNS-DHT22-09', qty: 1 },
    { id: 'SNS-SOIL', name: 'Soil Moisture Se...', sku: 'SNS-SOIL-03', qty: 1 },
  ]);
  
  const [modalType, setModalType] = useState(null);
  const [selectedTool, setSelectedTool] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const tools = [
    {
      id: 'MCU-ESP-01',
      name: 'ESP32 DOIT DevKit V1',
      desc: 'Dual-core Xtensa 32-bit LX6, Integrated Wi-Fi & Bluetooth BLE 4.2. Ideal untuk...',
      category: 'Microcontroller',
      badge: 'Tersedia 32/45',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      location: 'Rak A-02 • Kotak S-04',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
      status: 'tersedia',
    },
    {
      id: 'MCU-ARD-02',
      name: 'Arduino Uno R3 DIP Version',
      desc: 'Papan prototyping standar 14 pin digital I/O, 6 input analog, clock speed 16 MHz...',
      category: 'Microcontroller',
      badge: 'Tersedia 18/25',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      location: 'Rak A-01 • Kotak C-01',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80',
      status: 'tersedia',
    },
    {
      id: 'SBC-RPI-04',
      name: 'Raspberry Pi 4 Model B (4GB RAM)',
      desc: 'Broadcom BCM2711 quad-core Cortex-A72, dual-band 2.4/5.0 GHz Wi-Fi, suppo...',
      category: 'Single Board Computer',
      badge: 'Tersedia 4/10',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      location: 'Rak B-01 • Lemari Khusus',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      status: 'tersedia',
    },
    {
      id: 'KIT-SEN-37',
      name: 'Sensor Kit 37-in-1 Complete Box',
      desc: 'Set lengkap modul sensor: IR receiver, flame, relay, obstacle avoidance,...',
      category: 'Sensors',
      badge: 'Habis (0/5)',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-300',
      location: 'Rak C-03 • Box S-01',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80',
      status: 'habis',
    },
    {
      id: 'SEN-DHT-22',
      name: 'DHT22 / AM2302 Precision Sensor',
      desc: 'Sensor pembacaan suhu (-40 hingga 80°C ±0.5°C) & kelembapan relatif (0-100% R...',
      category: 'Sensors',
      badge: 'Tersedia 15/20',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      location: 'Rak C-01 • Laci 05',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=400&q=80',
      status: 'tersedia',
    },
    {
      id: 'INS-OSC-01',
      name: 'Digital Storage Oscilloscope 100MHz',
      desc: 'Dual-channel bandwidth 100MHz, 1GSa/s real-time sample rate dengan trigger bus...',
      category: 'Testing & Measurement',
      badge: 'Tersedia 2/3',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      location: 'Meja Kalibrasi Lab 1',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80',
      status: 'tersedia',
    },
  ];

  const categories = ['Semua (48)', 'Microcontroller (14)', 'Sensors (22)', 'Single Board Computer (6)'];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory.includes('Semua') || tool.category.toLowerCase().includes(activeCategory.split(' ')[0].toLowerCase());
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || tool.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAvailable = !onlyAvailable || tool.status === 'tersedia';
    return matchesCategory && matchesSearch && matchesAvailable;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (tool) => {
    if (tool.status === 'habis') {
      showToast("Maaf, perangkat sedang habis!");
      return;
    }
    if (cart.some((item) => item.id === tool.id)) {
      showToast(`${tool.name} sudah ada di keranjang!`);
      return;
    }
    setCart([...cart, { id: tool.id, name: tool.name, sku: tool.id + '-01', qty: 1 }]);
    showToast(`${tool.name} ditambahkan ke keranjang.`);
  };

  const removeFromCart = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    showToast("Item dihapus dari keranjang.");
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
                {modalType === 'pinjam' && `Konfirmasi Peminjaman: ${selectedTool?.name}`}
                {modalType === 'checkout' && 'Formulir Pengajuan Peminjaman Lab'}
                {modalType === 'sop' && 'SOP & Jam Operasional Lab IoT'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {modalType === 'pinjam' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Tambah perangkat <strong className="text-slate-800">{selectedTool?.name}</strong> ke keranjang pengajuan Anda?</p>
                <button
                  onClick={() => { addToCart(selectedTool); setModalType(null); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Ya, Tambahkan ke Keranjang
                </button>
              </div>
            )}

            {modalType === 'checkout' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Total item dalam keranjang: <strong className="text-slate-800">{cart.length} Alat</strong></p>
                <div className="max-h-40 overflow-y-auto space-y-2 border-y border-slate-100 py-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span>{item.name} ({item.sku})</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:underline">Hapus</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setCart([]); setModalType(null); showToast("Pengajuan peminjaman berhasil dikirim!"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Kirim Pengajuan Sekarang
                </button>
              </div>
            )}

            {modalType === 'sop' && (
              <div className="space-y-3 text-xs text-slate-600 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-slate-800 text-sm">SOP & Aturan Laboratorium IoT</h4>
                <p>1. Wajib menunjukkan kartu identitas atau QR pass saat pengambilan alat.</p>
                <p>2. Maksimal peminjaman adalah 7 hari kerja.</p>
                <p>3. Pengembalian wajib tepat waktu sebelum hari Jumat pukul 16:30 WIB.</p>
                <button onClick={() => setModalType(null)} className="w-full bg-slate-800 text-white py-2 rounded-xl mt-2 font-semibold">Tutup</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-screen border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <span className="font-bold text-white tracking-wider text-base">SIPL-IoT</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">IoT Lab System</p>
        </div>

        <nav className="flex-1 px-3 space-y-1 py-3">
          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pb-1">MAHASISWA</div>
          <a href="/inventaris" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium">
            <LayoutDashboard size={18} />
            <span>Dashboard & Katalog</span>
          </a>
          <a href="/peminjaman" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <FileText size={18} />
            <span>Pengajuan Peminjaman</span>
          </a>
          <a href="/riwayat" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <History size={18} />
            <span>Riwayat Peminjaman</span>
          </a>

          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-4 pb-1">ADMIN LAB</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <Box size={18} />
            <span>Inventaris & CRUD</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <UserCheck size={18} />
            <span>Persetujuan</span>
          </a>

          <div className="text-[10px] font-semibold text-slate-500 uppercase px-3 pt-4 pb-1">SISTEM</div>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <Settings size={18} />
            <span>Pengaturan Profil</span>
          </a>
          <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <BookOpen size={18} />
            <span>Status Sistem</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800 text-xs space-y-1 text-slate-400">
          <p className="font-semibold text-slate-300">● Lab Buka: 08:00 - 17:00</p>
          <p className="text-[11px]">Asisten: Aldi Alfriansyah</p>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-80">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari alat, kode rak, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-100 text-slate-700 pl-9 pr-4 py-1.5 rounded-lg border border-transparent focus:border-blue-500 focus:bg-white focus:outline-none text-xs"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs">
              <span className="text-slate-400">NIM:</span>
              <span className="font-semibold text-slate-700">2108561086</span>
            </div>
            <button onClick={() => setModalType('sop')} className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg font-medium transition">
              <BookOpen size={14} /> Panduan Lab
            </button>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="text-right">
                <h4 className="font-semibold text-slate-800 text-xs">lisa blackpink</h4>
                <p className="text-[11px] text-slate-400">Mahasiswa</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa" alt="Avatar" className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">Selamat datang, lisa blackpink</h1>
                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded font-medium">D4 Teknik Komputer Dan Jaringan • Semester 4</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-blue-600 font-medium">
                <span className="w-2 h-2 rounded-full bg-blue-600"></span> Mahasiswa Riset
              </div>
              <p className="text-xs text-slate-500">Pantau stok sensor & perangkat mikrokontroler laboratorium secara langsung (real-time).</p>

              <div className="grid grid-cols-3 gap-4 pt-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">PINJAMAN AKTIF</span>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">2 <span className="text-xs font-normal text-slate-500">Alat</span></div>
                  <span className="text-[10px] text-rose-600 mt-1 block">1 jatuh tempo dalam 2 hari (ESP32-CAM)</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">MENUNGGU REVIEW</span>
                  <div className="text-xl font-bold text-slate-800 mt-0.5">1 <span className="text-xs font-normal text-slate-500">Pengajuan</span></div>
                  <span className="text-[10px] text-slate-500 mt-1 block">TRX-2025-0304-0091 antrean asisten</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">STATUS LABORATORIUM</span>
                  <div className="text-xl font-bold text-emerald-600 mt-0.5">Bebas Tanggungan</div>
                  <span className="text-[10px] text-slate-500 mt-1 block">Tidak ada denda atau alat tertahan</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition ${
                      activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                  className="rounded bg-slate-100 border-slate-300 text-blue-600 focus:ring-0"
                />
                Hanya tampilkan yang tersedia
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTools.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  Tidak ada perangkat yang ditemukan.
                </div>
              ) : (
                filteredTools.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition">
                    <div className="relative h-36 bg-slate-100 overflow-hidden">
                      <img src={item.image} alt={item.name} className="object-cover w-full h-full opacity-90" />
                      <div className="absolute top-2 left-2 bg-slate-900/70 backdrop-blur-md text-white px-2 py-0.5 rounded text-[10px] font-medium">
                        {item.category}
                      </div>
                      <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${item.badgeColor}`}>
                        ● {item.badge}
                      </div>
                    </div>

                    <div className="p-4 flex-1 space-y-2">
                      <h3 className="font-bold text-slate-900 text-sm">{item.name}</h3>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{item.desc}</p>

                      <div className="pt-2 border-t border-slate-100 text-[11px] flex items-center justify-between text-slate-600">
                        <span>Lokasi Rak: <strong className="text-slate-800">{item.location}</strong></span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100">
                      {item.status === 'tersedia' ? (
                        <button
                          onClick={() => { setSelectedTool(item); setModalType('pinjam'); }}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-xs font-semibold transition active:scale-95 shadow-sm"
                        >
                          + Tambah ke Pinjaman
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full bg-slate-200 text-slate-400 py-2 rounded-lg text-xs font-semibold cursor-not-allowed"
                        >
                          Alat Tidak Tersedia (Ingatkan)
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-80 space-y-4 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-blue-600" /> Keranjang Pengajuan
                </span>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{cart.length} Alat</span>
              </div>

              <div className="space-y-1 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Batas Maksimal Kuota</span>
                  <span className="font-semibold text-slate-700">3 / 5 Alat</span>
                </div>
                <p className="text-[10px] text-slate-400">Maksimal pinjam 5 modul untuk mahasiswa riset.</p>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <strong className="text-slate-800 block truncate max-w-[170px]">{item.name}</strong>
                      <span className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold">1x</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 text-xs font-bold">×</button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-500 leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-200">
                Durasi pinjaman default: <strong>7 hari kerja</strong>. Pengambilan langsung di Meja Piket Asisten Lab IoT.
              </div>

              <button
                onClick={() => setModalType('checkout')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-md active:scale-95 flex items-center justify-center gap-1"
              >
                Lanjut Pengajuan ({cart.length} Alat) <ChevronRight size={14} />
              </button>

              <button onClick={() => setModalType('sop')} className="text-[11px] text-blue-600 font-medium hover:underline block text-center w-full pt-1">
                ⊙ Lihat SOP & Jam Operasional Lab
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-bold text-slate-800">KALENDER LAB PEKAN INI</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Peralatan wajib dikembalikan sebelum hari Jumat pkl 16:30 WIB untuk sesi stock opname mingguan.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}