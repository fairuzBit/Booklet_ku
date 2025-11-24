import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { useParams } from "react-router-dom"; // ⭐ TAMBAH: Untuk mengambil ID dari URL ⭐

// ===========================================
//  1. DEFINISI TEMPLATE & HELPERS

const TEMPLATES = {
  // TEMPLATE 1: Colorful (Inspirasi desain Ungu)
  Colorful: {
    bgMain: "#f2f2f2",
    sidebarBg: "rgb(80, 20, 160)", // Ungu gelap
    sidebarText: "white",
    primaryAccent: "rgb(80, 20, 160)", // Ungu untuk harga/judul
    cardBg: "white",
    cardShadow: "0 4px 10px rgba(0,0,0,0.08)",
    cardBorder: "none",
    textColor: "#333",
  },
  // TEMPLATE 2: Minimalist
  Minimalist: {
    bgMain: "#ffffff",
    sidebarBg: "#f8f8f8",
    sidebarText: "#333",
    primaryAccent: "#007bff", // Biru
    cardBg: "#ffffff",
    cardShadow: "none",
    cardBorder: "1px solid #eee",
    textColor: "#333",
  },
};

/**
 * Memformat angka menjadi string format Rupiah (tanpa "Rp").
 */
const formatCurrency = (amount) => {
  // Pastikan amount diolah sebagai string sebelum formatting
  const amountStr = String(Math.round(amount)).replace(/[^0-9]/g, "");
  if (!amountStr) return "0";
  const formatted = amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formatted;
};

// ===========================================
// ⭐ 2. KOMPONEN PREVIEW UTAMA ⭐
// ===========================================

export default function Preview() {
  // ⭐ BARIS BARU: Ambil ID dari URL (Contoh: /preview/user_unique_id_123) ⭐
  const { id: userId } = useParams();

  const [menu, setMenu] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State Settings (Nanti akan diambil dari Supabase)
  const [settings, setSettings] = useState({
    template: "Colorful", // Default
    whatsappNumber: "082229081327", // Default
  });

  // State Keranjang Belanja
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Tema Aktif
  const theme = TEMPLATES[settings.template] || TEMPLATES.Colorful;

  // --- FUNGSI READ DATA MENU & SETTINGS ---
  const fetchMenuAndSettings = async () => {
    setIsLoading(true);

    // 1. Ambil Settings (Template & WA Number)
    if (userId) {
      // Hanya fetch jika ID tersedia
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("template, whatsapp_number")
        .eq("user_id", userId)
        .single();

      if (settingsData) {
        setSettings({
          template: settingsData.template,
          whatsappNumber: settingsData.whatsapp_number, // ⭐ NOMOR BARU DARI DB ⭐
        });
      }
    }

    // 2. Ambil Data Menu
    const { data: menuData } = await supabase
      .from("menu_items")
      .select("id, name, Harga, Deskripsi, Kategori, foto_url, order")
      .order("order", { ascending: true });

    if (menuData) {
      setMenu(
        menuData.map((item) => ({
          ...item,
          price: item.Harga,
          desc: item.Deskripsi,
          category: item.Kategori,
          image: item.foto_url,
        }))
      );
    }
    setIsLoading(false);
  };

  useEffect(() => {
    // ⭐ Panggil fungsi baru ini ⭐
    fetchMenuAndSettings();
  }, [userId]); // Re-fetch jika ID di URL berubah

  // --- LOGIKA KERANJANG BELANJA ---

  const handleAddToCart = (item) => {
    setCart((cart) => {
      const existingItem = cart.find((cartItem) => cartItem.id === item.id);
      if (existingItem) {
        // Item sudah ada, tambahkan kuantitasnya
        return cart.map((cartItem) =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        // Item baru
        return [...cart, { ...item, quantity: 1 }];
      }
    });
  };

  const handleUpdateQuantity = (id, change) => {
    setCart((cart) =>
      cart
        .map((item) =>
          item.id === id
            ? { ...item, quantity: Math.max(0, item.quantity + change) }
            : item
        )
        .filter((item) => item.quantity > 0)
    ); // Hapus jika kuantitas jadi 0
  };

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Keranjang belanja masih kosong!");

    let orderList = cart
      .map(
        (item, index) =>
          `${index + 1}. ${item.name} (${
            item.quantity
          } porsi) - Rp${formatCurrency(item.price * item.quantity)},00`
      )
      .join("\n");

    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    const message = `Hallo kak, saya ingin memesan menu berikut yaa :\n\n*DAFTAR PESANAN:*\n${orderList}\n\n*TOTAL HARGA: Rp${formatCurrency(
      total
    )},00*\n\nTerimakasih kak, mohon segera diproses yaa.`;

    // Logika WA
    // ⭐ NOMOR DIJAMIN MENGGUNAKAN settings.whatsappNumber DARI DB ⭐
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const fullNumber = cleanNumber.startsWith("62")
      ? cleanNumber
      : `62${cleanNumber.substring(1)}`;

    const whatsappUrl = `https://wa.me/${fullNumber}?text=${encodeURIComponent(
      message
    )}`;
    window.open(whatsappUrl, "_blank");

    setCart([]); // Bersihkan keranjang
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // --- FILTER & RENDER SETTINGS ---
  const categories = ["All", ...new Set(menu.map((item) => item.category))];
  const filteredMenu =
    selectedCategory === "All"
      ? menu
      : menu.filter((item) => item.category === selectedCategory);

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>Memuat Menu...</div>
    );
  }

  // --- RENDERING DENGAN TIGA KOLOM ---
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: theme.bgMain,
        justifyContent: "space-between",
      }}
    >
      {/* KOLOM 1: SIDEBAR/NAV (Kategori) */}
      <div
        style={{
          width: "280px",
          backgroundColor: theme.sidebarBg,
          padding: "30px",
          flexShrink: 0,
          borderRadius: "0 20px 20px 0",
          boxShadow: theme.cardShadow,
          borderRight: theme.cardBorder,
        }}
      >
        <h2
          style={{
            color: theme.sidebarText,
            marginBottom: "40px",
            fontSize: "1.5em",
          }}
        >
          Menu Digital
        </h2>

        <div
          style={{
            color: theme.sidebarText,
            opacity: 0.8,
            marginBottom: "20px",
            fontWeight: "bold",
          }}
        >
          Kategori Menu:
        </div>

        {categories.map((cat) => (
          <div
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "12px 15px",
              marginBottom: "10px",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: selectedCategory === cat ? "bold" : "normal",
              backgroundColor:
                selectedCategory === cat ? "rgba(0, 0, 0, 0.1)" : "transparent",
              transition: "background-color 0.2s",
              color: theme.sidebarText,
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            {cat}
          </div>
        ))}

        <div
          style={{
            marginTop: "50px",
            padding: "15px",
            backgroundColor:
              settings.template === "Colorful"
                ? "rgba(255, 255, 255, 0.1)"
                : "rgba(0, 0, 0, 0.05)",
            borderRadius: "10px",
            color: theme.sidebarText,
          }}
        >
          <p style={{ fontSize: "0.9em", opacity: 0.9 }}>
            Pesan mudah tanpa perlu ngantri ribet ke kasir ya kan, yuk cukup
            list pesanan kamu dan kirimkan orderan kamu ke wa admin nanti mimin
            langsung proses pesenan kamu :)
          </p>
        </div>
      </div>

      {/* KOLOM 2: AREA KONTEN MENU */}

      <div style={{ flexGrow: 1, padding: "30px 30px 30px 50px" }}>
        {/* Header Konten */}
        <header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <h1 style={{ color: theme.textColor, fontSize: "1.8em" }}>
            Menu {selectedCategory}
          </h1>
          <div
            style={{
              padding: "8px 15px",
              backgroundColor: theme.cardBg,
              borderRadius: "20px",
              boxShadow: theme.cardShadow,
              border: theme.cardBorder,
              fontWeight: "bold",
              color: theme.primaryAccent,
            }}
          >
            {menu.length} Item Tersedia
          </div>
        </header>

        {/* Grid Item Menu */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "25px",
          }}
        >
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              style={{
                backgroundColor: theme.cardBg,
                borderRadius: "12px",
                boxShadow: theme.cardShadow,
                border: theme.cardBorder,
                overflow: "hidden",
                transition: "transform 0.2s",
              }}
            >
              {/* Gambar Item */}
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  style={{
                    width: "100%",
                    height: "300px",
                    objectFit: "cover",
                    objectPosition: "center",
                  }}
                />
              )}

              {/* Detail Teks */}
              <div style={{ padding: "15px" }}>
                <strong style={{ fontSize: "1.1em", color: theme.textColor }}>
                  {item.name}
                </strong>
                <p
                  style={{ fontSize: "0.9em", color: "#666", margin: "5px 0" }}
                >
                  {item.desc}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "10px",
                  }}
                >
                  <span
                    style={{ fontWeight: "bold", color: theme.primaryAccent }}
                  >
                    Rp{formatCurrency(item.price)},00
                  </span>

                  {/* Tombol Add to Cart */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    style={{
                      padding: "8px 12px",
                      backgroundColor: theme.primaryAccent, // Warna Aksen Utama
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "bold",
                      fontSize: "0.9em",
                    }}
                  >
                    + Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =================================== */}
      {/* KOLOM 3: KERANJANG BELANJA */}
      {/* =================================== */}
      <div
        style={{
          width: "350px",
          backgroundColor: theme.cardBg,
          padding: "30px",
          flexShrink: 0,
          boxShadow: "-4px 0 10px rgba(0,0,0,0.05)",
          borderLeft: theme.cardBorder,
        }}
      >
        <h3
          style={{
            color: theme.textColor,
            borderBottom: `2px solid ${theme.primaryAccent}`,
            paddingBottom: "10px",
            marginBottom: "20px",
          }}
        >
          🛒 Keranjang
        </h3>

        {/* List Item Keranjang */}
        <div
          style={{
            minHeight: "300px",
            maxHeight: "60vh",
            overflowY: "auto",
            marginBottom: "20px",
          }}
        >
          {cart.length === 0 ? (
            <p
              style={{ textAlign: "center", color: "#999", paddingTop: "50px" }}
            >
              Keranjang kosong.
            </p>
          ) : (
            cart.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "15px",
                  borderBottom: "1px dotted #eee",
                  paddingBottom: "10px",
                }}
              >
                <div style={{ flexGrow: 1 }}>
                  <div style={{ fontWeight: "bold", color: theme.textColor }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: "0.9em", color: "#666" }}>
                    Rp{formatCurrency(item.price)},00 x {item.quantity}
                  </div>
                </div>

                {/* Kontrol Kuantitas */}
                <div
                  style={{ display: "flex", alignItems: "center", gap: "5px" }}
                >
                  <button
                    onClick={() => handleUpdateQuantity(item.id, -1)}
                    style={{
                      padding: "5px",
                      background: "#f0f0f0",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    -
                  </button>
                  <span style={{ fontWeight: "bold" }}>{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, 1)}
                    style={{
                      padding: "5px",
                      background: "#f0f0f0",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                    }}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Total dan Tombol Checkout */}
        <div
          style={{
            marginTop: "20px",
            paddingTop: "15px",
            borderTop: `1px solid #ddd`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontWeight: "bold",
              fontSize: "1.2em",
              color: theme.textColor,
            }}
          >
            <span>Total:</span>
            <span>Rp{formatCurrency(cartTotal)},00</span>
          </div>

          <button
            onClick={handleCheckout}
            style={{
              marginTop: "20px",
              width: "100%",
              padding: "12px",
              backgroundColor: "#25D366", // Hijau WA
              color: "black",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "1em",
            }}
          >
            Checkout Pesanan (
            {cart.reduce((sum, item) => sum + item.quantity, 0)} Porsi)
          </button>
        </div>
      </div>
    </div>
  );
}
