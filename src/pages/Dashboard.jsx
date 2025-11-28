import React, { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// ===========================================
// ⭐ 1. DEFINISI HELPERS
// ===========================================

const formatCurrency = (amount) => {
  const amountStr = String(Math.round(amount)).replace(/[^0-9]/g, "");
  if (!amountStr) return "0";
  return amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Konfigurasi Admin
const CURRENT_USER_ID = "user_unique_id_123";
const BASE_URL = window.location.origin;
const PREVIEW_URL = `${BASE_URL}/Preview/${CURRENT_USER_ID}`;

// ===========================================
// ⭐ 2. KOMPONEN UTAMA DASHBOARD
// ===========================================

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState({
    template: "Colorful",
    whatsappNumber: "6281xxxxxx",
  });
  const [waInput, setWaInput] = useState(settings.whatsappNumber);
  const [notification, setNotification] = useState(null);

  // State untuk Tanggal Realtime
  const [currentDate, setCurrentDate] = useState("");

  // Data Simulasi & Perhitungan
  const totalItems = menu.length;
  const totalInventoryValue = menu.reduce((sum, item) => sum + item.price, 0);
  const uniqueViews = 91;
  const simulatedSales = totalInventoryValue * 1.5;
  const totalLeads = 126;

  // --- FUNGSI NOTIFIKASI POP-UP ---
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // --- FETCH DATA & SET DATE ---
  useEffect(() => {
    // 1. Set Tanggal Realtime (Format Indonesia)
    const date = new Date();
    const options = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    setCurrentDate(date.toLocaleDateString("id-ID", options));

    // 2. Fetch Data Supabase
    const fetchData = async () => {
      // Fetch Menu
      const { data: menuData } = await supabase
        .from("menu_items")
        .select("Harga");
      if (menuData) {
        setMenu(menuData.map((item) => ({ price: item.Harga })));
      }

      // Fetch Settings
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("template, whatsapp_number")
        .eq("user_id", CURRENT_USER_ID)
        .single();

      if (settingsData) {
        setSettings({
          template: settingsData.template,
          whatsappNumber: settingsData.whatsapp_number,
        });
        setWaInput(settingsData.whatsapp_number);
      }
    };
    fetchData();
  }, []);

  // --- WHATSAPP HANDLER ---
  const handleWhatsappChange = async () => {
    const cleanNumber = waInput.replace(/[^0-9]/g, "");
    if (!cleanNumber)
      return showNotification("Nomor WA tidak boleh kosong.", "error");

    setSettings((prev) => ({ ...prev, whatsappNumber: cleanNumber }));

    const { error } = await supabase
      .from("user_settings")
      .update({ whatsapp_number: cleanNumber })
      .eq("user_id", CURRENT_USER_ID);

    if (error) {
      console.error("Gagal menyimpan:", error);
      showNotification("Gagal menyimpan nomor WhatsApp.", "error");
    } else {
      showNotification("Nomor WhatsApp berhasil disimpan!", "success");
    }
  };

  return (
    // CONTAINER UTAMA (Sidebar + Content)
    <div className="flex min-h-screen bg-[#F4F6F8] font-sans text-[#2C3E50]">
      {/* ⭐ NOTIFIKASI TOAST ⭐ */}
      {notification && (
        <div
          className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-lg shadow-xl text-white flex items-center gap-3 transition-transform transform translate-y-0 ${
            notification.type === "success" ? "bg-[#0600AB]" : "bg-red-500"
          }`}
        >
          <span className="text-xl font-bold">
            {notification.type === "success" ? "✓" : "✕"}
          </span>
          <div>
            <strong className="block">
              {notification.type === "success" ? "Sukses!" : "Gagal!"}
            </strong>
            <p className="text-sm m-0">{notification.message}</p>
          </div>
        </div>
      )}

      {/* =================================== */}
      {/* ⭐ KOLOM 1: SIDEBAR NAV ⭐ */}
      {/* =================================== */}
      <aside className="w-full lg:w-[300px] bg-white border-r border-gray-200 flex-shrink-0 hidden lg:block sticky top-0 h-screen overflow-y-auto shadow-sm">
        <div className="p-6">
          <nav className="flex flex-col gap-2">
            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 bg-[#f0f0ff] text-[#0600AB] font-bold rounded-lg transition-colors"
            >
              Dashboard
            </Link>

            {/* 🗑️ ITEM "TAMBAH MENU" DI SINI SUDAH DIHAPUS (Sesuai Request) */}

            <Link
              to={`/Preview/${CURRENT_USER_ID}`}
              target="_blank"
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 hover:text-[#0600AB] rounded-lg transition-colors"
            >
              Dashboard Pelanggan
            </Link>
          </nav>
        </div>

        {/* ✅ TOMBOL TAMBAH MENU YANG DIPERTAHANKAN */}
        <div className="p-6 border-t border-gray-100 mt-auto">
          <Link
            to="/AddMenu"
            className="flex items-center justify-center gap-2 w-full py-3 bg-[#0600AB] text-white rounded-xl font-bold shadow-lg shadow-blue-900/30 hover:bg-blue-800 transition-all"
          >
            <span className="text-xl leading-none">+</span> Tambah Menu
          </Link>
        </div>
      </aside>

      {/* =================================== */}
      {/* ⭐ KOLOM 2: KONTEN DASHBOARD ⭐ */}
      {/* =================================== */}
      <main className="flex-grow p-4 lg:p-10 overflow-y-auto">
        {/* HEADER MOBILE (Hanya muncul di HP) */}
        <div className="lg:hidden mb-6 flex flex-col gap-4">
          <h2 className="text-2xl font-bold text-[#2C3E50]">Dashboard Admin</h2>
        </div>

        {/* HEADER DESKTOP */}
        <div className="hidden lg:flex justify-between items-center mb-8 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-3xl font-normal text-[#2C3E50] m-0">
              Dashboard Admin
            </h2>
            {/* ⭐ TANGGAL REALTIME DI SINI ⭐ */}
            <p className="text-gray-400 text-sm mt-1">
              {currentDate || "Memuat tanggal..."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[#0600AB] text-white rounded-full flex items-center justify-center font-bold text-sm">
              AJ
            </div>
          </div>
        </div>

        {/* --- HERO BANNER --- */}
        <div className="bg-[#0600AB] text-white p-6 lg:p-10 rounded-2xl shadow-xl shadow-blue-900/20 mb-10 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between">
          <div className="relative z-10 max-w-2xl text-center lg:text-left">
            <h1 className="text-3xl lg:text-5xl font-bold mb-2">Hi, Admin!</h1>
            <p className="text-base lg:text-xl opacity-90">
              Siap untuk memulai hari Anda dengan mengatur menu?
            </p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        </div>

        {/* --- METRICS OVERVIEW --- */}
        <h3 className="text-xl text-gray-500 mb-5 font-medium">Overview</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-10">
          {/* Card 1: Total Penjualan (Kuning) */}
          <div className="bg-[#FFC300] p-6 rounded-xl text-white shadow-lg shadow-yellow-500/30 flex flex-col justify-center min-h-[140px] text-center overflow-hidden">
            {/* ⭐ PERBAIKAN OVERFLOW: text-size responsif & break-words ⭐ */}
            <div className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-1 break-words leading-tight">
              Rp{formatCurrency(simulatedSales)}
              <span className="text-sm font-normal">,00</span>
            </div>
            <div className="opacity-90 text-sm font-medium">
              Total Penjualan
            </div>
          </div>

          {/* Card 2: Total Item (Ungu Muda) */}
          <div className="bg-[#7B68EE] p-6 rounded-xl text-white shadow-lg shadow-indigo-500/30 flex flex-col justify-center min-h-[140px] text-center">
            <div className="text-4xl lg:text-5xl font-bold mb-1">
              {totalItems} <span className="text-lg font-normal">Item</span>
            </div>
            <div className="opacity-90 text-sm font-medium">Total Menu</div>
          </div>

          {/* Card 3: Pengunjung (Pink) */}
          <div className="bg-[#FF6392] p-6 rounded-xl text-white shadow-lg shadow-pink-500/30 flex flex-col justify-center min-h-[140px] text-center">
            <div className="text-4xl lg:text-5xl font-bold mb-1">
              {uniqueViews}
            </div>
            <div className="opacity-90 text-sm font-medium">Pengunjung</div>
          </div>

          {/* Card 4: Total Leads (Biru Gelap) */}
          <div className="bg-[#0600AB] p-6 rounded-xl text-white shadow-lg shadow-blue-900/30 flex flex-col justify-center min-h-[140px] text-center">
            <div className="text-4xl lg:text-5xl font-bold mb-1">
              {totalLeads}
            </div>
            <div className="opacity-90 text-sm font-medium">Total Leads</div>
          </div>
        </div>

        {/* --- PENGATURAN & ANALISIS --- */}
        <h3 className="text-xl text-gray-500 mb-5 font-medium">
          Pengaturan & Analisis
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* KOLOM KIRI: GRAFIK */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-700 mb-6">
              Analisis Penjualan Harian & User Akses
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={[
                    { day: "Sen", Pesanan: 15, Dilihat: 50 },
                    { day: "Sel", Pesanan: 25, Dilihat: 70 },
                    { day: "Rab", Pesanan: 18, Dilihat: 65 },
                    { day: "Kam", Pesanan: 70, Dilihat: 90 },
                    { day: "Jum", Pesanan: 80, Dilihat: 120 },
                    { day: "Sab", Pesanan: 100, Dilihat: 150 },
                    { day: "Min", Pesanan: 30, Dilihat: 80 },
                  ]}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#eee"
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#999", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#999", fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "none",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}
                  />
                  <Legend iconType="circle" />
                  <Line
                    type="monotone"
                    dataKey="Pesanan"
                    stroke="#7B68EE"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="Dilihat"
                    stroke="#28a745"
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* KOLOM KANAN: QR & WA */}
          <div className="flex flex-col gap-6">
            {/* Kartu QR Code */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center flex-1 flex flex-col justify-center items-center">
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                QR Code Publikasi
              </h3>
              <p className="text-gray-500 text-sm mb-6">
                Scan untuk melihat tampilan pelanggan.
              </p>

              <div className="p-4 border-4 border-[#0600AB] rounded-xl shadow-lg inline-block bg-white">
                <QRCodeSVG
                  value={PREVIEW_URL}
                  size={160}
                  bgColor={"#ffffff"}
                  fgColor={"#000000"}
                  level={"Q"}
                />
              </div>

              <a
                href={PREVIEW_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-block text-[#0600AB] font-bold hover:underline"
              >
                Lihat Link Preview →
              </a>
            </div>

            {/* Kartu Setting WA */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">
                Setting No Admin Default
              </h3>
              <p className="text-gray-500 text-sm mb-4">
                Nomor ini digunakan untuk checkout pelanggan.
              </p>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={waInput}
                  onChange={(e) => setWaInput(e.target.value)}
                  className="flex-grow p-3 rounded-lg border border-gray-300 focus:outline-none focus:border-[#0600AB] focus:ring-1 focus:ring-[#0600AB] transition-all"
                  placeholder="628xxxxx"
                />
                <button
                  onClick={handleWhatsappChange}
                  className="bg-[#0600AB] hover:bg-blue-800 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Simpan
                </button>
              </div>
              <p className="text-xs text-green-600 mt-2 font-medium">
                Nomor Aktif: {settings.whatsappNumber}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
