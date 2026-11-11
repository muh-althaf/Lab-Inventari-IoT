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
  Clock,
  ChevronRight,
  ExternalLink,
  X,
  CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  
  const [modalType, setModalType] = useState(null); // 'pinjam' | 'antrean' | 'reservasi' | 'checkout' | 'sop'
  const [selectedTool, setSelectedTool] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const tools = [
    {
      id: 'MCU-ESP-01',
      name: 'ESP32 DOIT DevKit V1 30-Pin',
      desc: 'Dual Core Tensilica 240MHz, WiFi + BLE 4.2',
      category: 'WIFI / BLE',
      badge: 'Tersedia',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      stock: '32 / 45 unit',
      location: 'Rak A-02',
      condition: 'Sangat Baik',
      type: 'pinjam',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'MCU-ARD-02',
      name: 'Arduino Uno R3 SMD',
      desc: 'ATmega328P 16MHz, 14 Digital I/O, 6 PWM',
      category: 'I2C / SPI Sensors',
      badge: 'Stok Terbatas',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-300',
      stock: '5 / 30 unit',
      location: 'Rak A-01',
      condition: 'Baik',
      type: 'pinjam',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'SBC-RPI-04',
      name: 'Raspberry Pi 4 Model B',
      desc: 'Broadcom BCM2711 Quad-core Cortex-A72 (ARM v8)',
      category: 'Power Supplies',
      badge: 'Habis Dipinjam',
      badgeColor: 'bg-rose-100 text-rose-700 border-rose-300',
      stock: '0 / 12 unit',
      location: 'Rak B-01',
      estReturn: '03 Maret',
      type: 'antrean',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'KIT-SEN-37',
      name: 'Sensor Kit 37-in-1 IoT Pack',
      desc: 'Termasuk PIR, Flame, Joystick, Hall Effect, Gas',
      category: 'I2C / SPI Sensors',
      badge: 'Tersedia',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      stock: '14 / 20 unit',
      location: 'Rak C-03',
      condition: 'Komplit',
      type: 'pinjam',
      image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'SEN-DHT-22',
      name: 'DHT22 Digital Temperature Sensor',
      desc: 'Akurasi tinggi ±0.5°C, Rentang kelembaban 0-100%',
      category: 'I2C / SPI Sensors',
      badge: 'Tersedia',
      badgeColor: 'bg-emerald-100 text-emerald-700 border-emerald-300',
      stock: '41 / 50 unit',
      location: 'Rak C-01',
      condition: 'Terkalibrasi',
      type: 'pinjam',
      image: 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?auto=format&fit=crop&w=300&q=80',
    },
    {
      id: 'INS-OSC-01',
      name: 'Digital Oscilloscope Rigol',
      desc: '50MHz, 4 Channel, 1GSa/s Real-time Sample Rate',
      category: 'Oscilloscope',
      badge: 'Khusus Lab',
      badgeColor: 'bg-purple-100 text-purple-700 border-purple-300',
      stock: '3 / 6 unit',
      location: 'Meja Lab 4',
      usage: 'Penggunaan On-Site Saja',
      type: 'reservasi',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80',
    },
  ];

  const categories = ['Semua', 'WIFI / BLE', 'I2C / SPI Sensors', 'Power Supplies', 'Oscilloscope'];

  const filteredTools = tools.filter((tool) => {
    const matchesCategory = activeCategory === 'Semua' || tool.category === activeCategory;
    const matchesSearch = tool.name.toLowerCase().includes(searchQuery.toLowerCase()) || tool.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const addToCart = (tool) => {
    if (cart.some((item) => item.id === tool.id)) {
      showToast(`${tool.name} sudah ada di dalam keranjang!`);
      return;
    }
    setCart([...cart, tool]);
    showToast(`${tool.name} berhasil ditambahkan ke keranjang.`);
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
                {modalType === 'pinjam' && `Konfirmasi Pengajuan: ${selectedTool?.name}`}
                {modalType === 'antrean' && `Daftar Antrean: ${selectedTool?.name}`}
                {modalType === 'reservasi' && `Reservasi Meja: ${selectedTool?.name}`}
                {modalType === 'checkout' && 'Formulir Pengajuan Peminjaman Lab'}
                {modalType === 'sop' && 'SOP & Aturan Lengkap Lab IoT'}
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
                <X size={18} />
              </button>
            </div>

            {modalType === 'pinjam' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Anda akan mengajukan peminjaman perangkat <strong className="text-slate-800">{selectedTool?.name}</strong> dari <span className="text-blue-600 font-semibold">{selectedTool?.location}</span>.</p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Durasi Peminjaman (Hari):</label>
                  <input type="number" defaultValue="3" min="1" max="5" className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500" />
                </div>
                <button
                  onClick={() => { addToCart(selectedTool); setModalType(null); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Masukkan ke Keranjang Pengajuan
                </button>
              </div>
            )}

            {modalType === 'antrean' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-amber-800">
                  Perangkat sedang habis dipinjam. Estimasi tersedia kembali pada <strong>{selectedTool?.estReturn}</strong>.
                </p>
                <button
                  onClick={() => { setModalType(null); showToast("Berhasil masuk dalam antrean prioritas."); }}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Daftar Antrean Otomatis
                </button>
              </div>
            )}

            {modalType === 'reservasi' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Alat ini khusus untuk penggunaan on-site di <strong>{selectedTool?.location}</strong>.</p>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pilih Jam Sesi Lab:</label>
                  <select className="w-full border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-none focus:border-blue-500">
                    <option>Sesi 1: 09.00 - 12.00 WITA</option>
                    <option>Sesi 2: 13.00 - 16.00 WITA</option>
                  </select>
                </div>
                <button
                  onClick={() => { setModalType(null); showToast("Reservasi meja lab berhasil dicatat!"); }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Konfirmasi Reservasi Meja
                </button>
              </div>
            )}

            {modalType === 'checkout' && (
              <div className="space-y-3 text-xs text-slate-600">
                <p>Total item dalam keranjang: <strong className="text-slate-800">{cart.length} Perangkat</strong></p>
                <div className="max-h-40 overflow-y-auto space-y-2 border-y border-slate-100 py-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg">
                      <span>{item.name}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:underline">Hapus</button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { setCart([]); setModalType(null); showToast("Formulir peminjaman berhasil dikirim ke Asisten Lab!"); }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl transition shadow-md"
                >
                  Kirim Pengajuan Sekarang
                </button>
              </div>
            )}

            {modalType === 'sop' && (
              <div className="space-y-3 text-xs text-slate-600 max-h-60 overflow-y-auto">
                <h4 className="font-bold text-slate-800 text-sm">Panduan Lengkap Laboratorium IoT</h4>
                <p>1. Setiap peminjaman wajib melampirkan NIM dan persetujuan dosen pembimbing.</p>
                <p>2. Pemeriksaan fisik alat dilakukan bersama asisten jaga saat serah terima.</p>
                <p>3. Dilarang membawa keluar perangkat lab tanpa izin tertulis kepala laboratorium.</p>
                <button onClick={() => setModalType(null)} className="w-full bg-slate-800 text-white py-2 rounded-xl mt-2 font-semibold">Tutup</button>
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
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg bg-blue-600 text-white font-medium">
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
          <a href="/riwayat" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition">
            <History size={18} />
            <span>Riwayat Peminjaman</span>
          </a>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="text-slate-500 text-xs font-medium">
            SIPL IoT Lab / <span className="text-slate-800 font-semibold">LABORATORIUM TEKNIK ELEKTRO</span>
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

        <div className="p-6 flex gap-6">
          <div className="flex-1 space-y-6">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-xl shrink-0">
                  ((•))
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Selamat datang kembali, Muh. Althaf Andriansyah</h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-semibold text-slate-700">NIM: 2108561086</span> • Program Studi Teknik Komputer & Jaringan
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="text-slate-400 text-[11px] font-medium">KATEGORI:</span>
                {categories.map((cat, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition shadow-sm ${
                      activeCategory === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTools.length === 0 ? (
                <div className="col-span-full bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                  Tidak ada perangkat yang sesuai dengan pencarian atau kategori.
                </div>
              ) : (
                filteredTools.map((item, index) => (
                  <div key={index} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-slate-300 transition">
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[11px] text-slate-400 font-medium">{item.category}</span>
                        <span className={`px-2 py-0.5 text-[10px] rounded-full border font-medium ${item.badgeColor}`}>
                          • {item.badge}
                        </span>
                      </div>

                      {/* GAMBAR ILUSTRASI ALAT */}
                      <div className="h-32 bg-slate-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden border border-slate-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="object-cover w-full h-full opacity-90 hover:scale-105 transition duration-300"
                        />
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{item.name}</h3>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{item.desc}</p>

                      <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 block">Ketersediaan</span>
                          <span className="font-semibold text-slate-700">{item.stock}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Lokasi Lab</span>
                          <span className="font-semibold text-slate-700">{item.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
                      {item.type === 'pinjam' && (
                        <button 
                          onClick={() => { setSelectedTool(item); setModalType('pinjam'); }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95"
                        >
                          <FileText size={14} /> Ajukan Pinjam
                        </button>
                      )}
                      {item.type === 'antrean' && (
                        <button 
                          onClick={() => { setSelectedTool(item); setModalType('antrean'); }}
                          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95"
                        >
                          <Clock size={14} /> Antrean Pinjaman
                        </button>
                      )}
                      {item.type === 'reservasi' && (
                        <button 
                          onClick={() => { setSelectedTool(item); setModalType('reservasi'); }}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition active:scale-95"
                        >
                          <BookOpen size={14} /> Reservasi Meja
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="w-72 space-y-4 shrink-0">
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-center">
              <div className="flex justify-between items-center mb-3 text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <ShoppingBag size={14} /> Keranjang Pengajuan
                </span>
                <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{cart.length} item</span>
              </div>

              {cart.length === 0 ? (
                <div className="py-8 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                    <ShoppingBag size={20} />
                  </div>
                  <h4 className="font-semibold text-slate-800 text-xs">Keranjang Kosong</h4>
                  <p className="text-[11px] text-slate-400 mt-1 px-2">Pilih alat dari katalog di sebelah kiri</p>
                </div>
              ) : (
                <div className="space-y-2 py-2 text-left max-h-36 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-xs border border-slate-100">
                      <span className="line-clamp-1 font-medium">{item.name}</span>
                      <button onClick={() => removeFromCart(item.id)} className="text-rose-500 text-[10px] hover:underline shrink-0">Hapus</button>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => {
                  if (cart.length === 0) {
                    showToast("Keranjang masih kosong!");
                    return;
                  }
                  setModalType('checkout');
                }}
                className={`w-full font-semibold py-2 rounded-lg text-xs flex items-center justify-center gap-1 transition mt-2 ${
                  cart.length > 0 ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md active:scale-95' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                Proses Formulir <ChevronRight size={14} />
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1">
                <BookOpen size={14} /> Aturan & SOP
              </h4>
              <button 
                onClick={() => setModalType('sop')}
                className="text-[11px] text-blue-600 font-medium hover:underline flex items-center gap-1 pt-1 text-left w-full"
              >
                Baca Panduan SOP Lengkap <ExternalLink size={10} />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}