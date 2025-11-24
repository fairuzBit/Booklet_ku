import React, { useState, useEffect } from "react";
import { supabase } from "../supabase";
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
// ⭐ 1. DEFINISI HELPERS & KONFIGURASI ⭐
// ===========================================

const formatCurrency = (amount) => {
  const amountStr = String(Math.round(amount)).replace(/[^0-9]/g, "");
  if (!amountStr) return "0";
  return amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Konfigurasi Admin
const CURRENT_USER_ID = "user_unique_id_123";
const BASE_URL = window.location.origin;
const PREVIEW_URL = `${BASE_URL}/preview/${CURRENT_USER_ID}`;

const theme = {
  bgMain: "#f4f7ff",
  bgSidebar: "#ffffff",
  cardBg: "#ffffff",
  textColor: "#333333",
  accentColor: "#007bff", // Biru terang untuk Chart/Accent
  graphLine: "#28a745",
};

// --- Style Link Navigasi ---
const navLinkStyle = (theme, isActive) => ({
  display: "block",
  textDecoration: "none",
  opacity: isActive ? 1 : 0.8,
  marginBottom: "10px",
  padding: "10px 20px",
  borderRadius: "8px",
  cursor: "pointer",
  backgroundColor: isActive ? "#e0f7fa" : "transparent",
  color: isActive ? theme.accentColor : theme.textColor,
  fontWeight: isActive ? "bold" : "normal",
  transition: "background-color 0.2s",
});

// ===========================================
// ⭐ 2. KOMPONEN UTAMA DASHBOARD ⭐
// ===========================================

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState({
    template: "Colorful",
    whatsappNumber: "6281xxxxxx",
  });
  const [waInput, setWaInput] = useState(settings.whatsappNumber);
  const [notification, setNotification] = useState(null);

  // --- Data Simulasi & Perhitungan ---
  const totalItems = menu.length;
  const totalInventoryValue = menu.reduce((sum, item) => sum + item.price, 0);
  const simulatedSales = totalInventoryValue * 1.5;

  // --- FUNGSI NOTIFIKASI POP-UP ---
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // --- FETCH DATA (Menu dan Settings) ---
  const fetchMenu = async () => {
    const { data } = await supabase.from("menu_items").select("Harga");
    if (data) {
      setMenu(data.map((item) => ({ price: item.Harga })));
    }
  };

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("user_settings")
      .select("template, whatsapp_number")
      .eq("user_id", CURRENT_USER_ID)
      .single();

    if (data) {
      setSettings({
        template: data.template,
        whatsappNumber: data.whatsapp_number,
      });
      setWaInput(data.whatsapp_number);
    }
  };

  useEffect(() => {
    fetchMenu();
    fetchSettings();
  }, []);

  // --- TEMPLATE HANDLER (UPDATE Logic) ---
  const handleTemplateChange = async (newTemplate) => {
    setSettings({ ...settings, template: newTemplate });

    const { error } = await supabase
      .from("user_settings")
      .update({ template: newTemplate })
      .eq("user_id", CURRENT_USER_ID);

    if (error) {
      console.error("Gagal menyimpan template:", error);
      showNotification("Gagal menyimpan pilihan template!", "error");
    } else {
      showNotification(
        `Template berhasil diubah menjadi: ${newTemplate}`,
        "success"
      );
    }
  };

  // --- WHATSAPP HANDLER (UPDATE Logic) ---
  const handleWhatsappChange = async (newNumber) => {
    const cleanNumber = newNumber.replace(/[^0-9]/g, "");

    if (!cleanNumber)
      return showNotification("Nomor WA tidak boleh kosong.", "error");

    setSettings((prevSettings) => ({
      ...prevSettings,
      whatsappNumber: cleanNumber,
    }));

    const { error } = await supabase
      .from("user_settings")
      .update({ whatsapp_number: cleanNumber })
      .eq("user_id", CURRENT_USER_ID);

    if (error) {
      console.error("Gagal menyimpan nomor WA:", error);
      showNotification("Gagal menyimpan nomor WhatsApp.", "error");
    } else {
      showNotification("Nomor WhatsApp berhasil disimpan!", "success");
    }
  };

  return (
    // KONTENER UTAMA
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.bgMain,
        color: theme.textColor,
      }}
    >
      {/* ⭐ RENDER NOTIFIKASI POP-UP DI SINI ⭐ */}
      {notification && (
        <NotificationToast notification={notification} theme={theme} />
      )}

      {/* =================================== */}
      {/* ⭐ KOLOM 1: SIDEBAR NAV (NAVIGASI UTAMA) ⭐ */}
      {/* =================================== */}
      <div
        style={{
          width: "240px",
          backgroundColor: theme.bgSidebar,
          padding: "30px 10px",
          flexShrink: 0,
          height: "100vh",
          position: "sticky",
          top: 0,
          boxShadow: "2px 0 10px rgba(0,0,0,0.05)",
          borderRight: "1px solid #eee",
        }}
      >
        <h2
          style={{
            marginBottom: "40px",
            textAlign: "center",
            color: theme.accentColor,
          }}
        >
          Admin Menu
        </h2>

        {/* NAVIGATION LINKS */}
        <Link to="/" style={navLinkStyle(theme, true)}>
          📈 Dashboard Penjualan
        </Link>

        <Link to="/builder" style={navLinkStyle(theme, false)}>
          🧱 Tambah Menu
        </Link>

        <Link
          to={`/preview/${CURRENT_USER_ID}`}
          target="_blank"
          rel="noopener noreferrer"
          style={navLinkStyle(theme, false)}
        >
          ⚙️ Preview User
        </Link>

        <Link to="/#whatsapp-settings" style={navLinkStyle(theme, false)}>
          💬 WA Setting
        </Link>
      </div>

      {/* =================================== */}
      {/* ⭐ KOLOM 2: KONTEN DASHBOARD ⭐ */}
      {/* =================================== */}
      <div style={{ flexGrow: 1, padding: "30px 40px", overflowY: "auto" }}>
        <h1 style={{ marginBottom: "40px", color: theme.textColor }}>
          Ringkasan Bisnis
        </h1>

        {/* --- ROW 1: METRIC CARDS --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <MetricCard
            title="Total Penjualan"
            value={`Rp${formatCurrency(simulatedSales)},00`}
            icon="💵"
            theme={theme}
          />

          <MetricCard
            title="Total Menu Tersedia"
            value={`${totalItems} Item`}
            icon="🍔"
            theme={theme}
          />

          <MetricCard
            title="Tampilan Aktif"
            value={settings.template}
            icon="🎨"
            isSelect={true}
            onSelect={handleTemplateChange}
            currentTemplate={settings.template}
            theme={theme}
          />
        </div>

        {/* --- ROW 2: GRAFIK PENJUALAN (SIMULASI) --- */}
        <div style={{ marginBottom: "40px" }}>
          <GraphPlaceholder theme={theme} />
        </div>

        {/* --- ROW 3: QR CODE & WA SETTINGS --- */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          <PublishCard theme={theme} previewUrl={PREVIEW_URL} />

          <WhatsappSettingsCard
            id="whatsapp-settings"
            theme={theme}
            waInput={waInput}
            setWaInput={setWaInput}
            onSave={handleWhatsappChange}
            currentNumber={settings.whatsappNumber}
          />

          <div
            style={{
              padding: "20px",
              backgroundColor: theme.cardBg,
              borderRadius: "12px",
              opacity: 0.7,
              boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              border: `1px solid #e0e0e0`,
              color: theme.textColor,
            }}
          >
            <h3>Analisis Pengunjung</h3>
            <p>Tracked Views: 452x</p>
            <p style={{ marginTop: "10px", fontSize: "0.9em" }}>
              *Fitur ini membutuhkan implementasi logic tracking di Preview.jsx.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===========================================
// ⭐ 3. KOMPONEN PEMBANTU (Deklarasi Tunggal) ⭐
// ===========================================

// --- Komponen Notifikasi Pop-up (Toast) ---
const NotificationToast = ({ notification, theme }) => {
  if (!notification) return null;

  // Warna Kustom: Ungu (Aksen Utama) dan Putih
  const successColor = "#5014a0"; // Ungu Tua (Primary Accent)
  const errorColor = "#dc3545"; // Merah
  const icon = notification.type === "success" ? "✓" : "✗"; // Ikon Centang/Silang

  const bgColor = notification.type === "success" ? successColor : errorColor;
  const messageColor = "white";

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        backgroundColor: bgColor,
        color: messageColor,
        padding: "15px 25px",
        borderRadius: "8px",
        boxShadow: `0 4px 15px rgba(0, 0, 0, 0.2)`,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        // ⭐ ANIMASI POP-UP ⭐
        transition: "transform 0.3s ease-in-out",
        transform: "translateY(0)",
        fontSize: "1em",
      }}
    >
      <span
        style={{
          fontSize: "1.5em",
          marginRight: "10px",
          fontWeight: "bold",
          color: "white",
        }}
      >
        {icon}
      </span>
      <div>
        <strong>
          {notification.type === "success" ? "Sukses!" : "Gagal!"}
        </strong>
        <p style={{ margin: 0 }}>{notification.message}</p>
      </div>
    </div>
  );
};

// --- Card Metrik Sederhana ---
const MetricCard = ({
  title,
  value,
  icon,
  theme,
  isSelect,
  onSelect,
  currentTemplate,
}) => (
  <div
    style={{
      padding: "20px",
      backgroundColor: theme.cardBg,
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      border: `1px solid #e0e0e0`,
      color: theme.textColor,
    }}
  >
    <div
      style={{
        fontSize: "2em",
        marginBottom: "10px",
        color: theme.accentColor,
      }}
    >
      {icon}
    </div>
    <div style={{ opacity: 0.7 }}>{title}</div>
    <h3
      style={{ fontSize: "1.5em", marginTop: "5px", color: theme.accentColor }}
    >
      {value}
    </h3>

    {isSelect && (
      <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
        <button
          onClick={() => onSelect("Colorful")}
          style={{
            padding: "8px 12px",
            backgroundColor:
              currentTemplate === "Colorful" ? theme.accentColor : "#ccc",
            color: currentTemplate === "Colorful" ? "white" : theme.textColor,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          Colorful
        </button>
        <button
          onClick={() => onSelect("Minimalist")}
          style={{
            padding: "8px 12px",
            backgroundColor:
              currentTemplate === "Minimalist" ? theme.accentColor : "#ccc",
            color: currentTemplate === "Minimalist" ? "white" : theme.textColor,
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            opacity: 0.9,
          }}
        >
          Minimalist
        </button>
      </div>
    )}
  </div>
);

// --- Placeholder Grafik Garis (Menggunakan Recharts) ---
const GraphPlaceholder = ({ theme }) => {
  // Data Penjualan Simulasi (7 Hari)
  const simulatedData = [
    { day: "Sen", Pesanan: 15, Dilihat: 50 },
    { day: "Sel", Pesanan: 25, Dilihat: 70 },
    { day: "Rab", Pesanan: 18, Dilihat: 65 },
    { day: "Kam", Pesanan: 35, Dilihat: 90 },
    { day: "Jum", Pesanan: 45, Dilihat: 120 },
    { day: "Sab", Pesanan: 55, Dilihat: 150 },
    { day: "Min", Pesanan: 30, Dilihat: 80 },
  ];

  return (
    <div
      style={{
        padding: "20px",
        backgroundColor: theme.cardBg,
        borderRadius: "12px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        border: `1px solid #e0e0e0`,
        height: "350px",
      }}
    >
      <h2 style={{ color: theme.textColor, marginBottom: "10px" }}>
        Tren Penjualan Mingguan
      </h2>
      <p style={{ opacity: 0.6, marginBottom: "20px" }}>*Data Disimulasikan</p>

      <ResponsiveContainer width="100%" height={250}>
        <LineChart
          data={simulatedData}
          margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" stroke={theme.textColor} opacity={0.7} />
          <YAxis stroke={theme.textColor} opacity={0.7} />
          <Tooltip
            contentStyle={{
              backgroundColor: theme.cardBg,
              border: "none",
              borderRadius: "5px",
            }}
          />
          <Legend iconType="circle" wrapperStyle={{ padding: "10px 0 0 0" }} />

          <Line
            type="monotone"
            dataKey="Pesanan"
            stroke={theme.accentColor}
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
          <Line
            type="monotone"
            dataKey="Dilihat"
            stroke={theme.graphLine}
            strokeWidth={2}
            activeDot={{ r: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// --- Card QR Code Publishing ---
const PublishCard = ({ theme, previewUrl }) => (
  <div
    style={{
      flex: 1,
      padding: "20px",
      backgroundColor: theme.cardBg,
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      textAlign: "center",
      border: `1px solid #e0e0e0`,
      color: theme.textColor,
    }}
  >
    <h3>QR Code Publikasi</h3>
    <p style={{ opacity: 0.7, marginBottom: "15px" }}>
      Scan untuk melihat tampilan pelanggan.
    </p>

    <div
      style={{
        margin: "15px auto",
        width: "fit-content",
        border: "5px solid #007bff",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.2)",
      }}
    >
      <QRCodeSVG
        value={previewUrl}
        size={180}
        bgColor={"#ffffff"}
        fgColor={"#000000"}
        level={"Q"}
      />
    </div>

    <a
      href={previewUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: theme.accentColor,
        textDecoration: "none",
        marginTop: "10px",
        display: "block",
      }}
    >
      Lihat Link Preview
    </a>
  </div>
);

// --- Card Pengaturan WhatsApp ---
const WhatsappSettingsCard = ({
  theme,
  waInput,
  setWaInput,
  onSave,
  currentNumber,
  id,
}) => (
  <div
    id={id}
    style={{
      padding: "20px",
      backgroundColor: theme.cardBg,
      borderRadius: "12px",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      border: `1px solid #e0e0e0`,
      color: theme.textColor,
    }}
  >
    <h3>💬 Pengaturan WhatsApp</h3>
    <p style={{ opacity: 0.7, marginBottom: "15px" }}>
      Nomor ini digunakan untuk checkout pelanggan (format 62xxxx).
    </p>

    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
      <input
        type="text"
        value={waInput}
        onChange={(e) => setWaInput(e.target.value)}
        placeholder="Contoh: 628123xxxx"
        style={{
          flexGrow: 1,
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #ccc",
          color: "#333",
        }}
      />
      <button
        onClick={() => onSave(waInput)}
        style={{
          padding: "10px 15px",
          backgroundColor: theme.accentColor,
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        Simpan WA
      </button>
    </div>
    <p style={{ fontSize: "0.8em", color: theme.graphLine, marginTop: "10px" }}>
      Nomor Aktif: {currentNumber}
    </p>
  </div>
);
