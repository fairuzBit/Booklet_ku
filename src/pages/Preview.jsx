import { useState, useEffect } from "react";
import { supabase } from "../utils/supabase";
import { useParams } from "react-router-dom";

// ===========================================
//  1. DEFINISI TEMPLATE & HELPERS
// ===========================================

const TRANSLATIONS = {
  id: {
    title: "Menu Digital",
    categoryTitle: "Kategori Menu:",
    all: "Semua",
    cartTitle: "🛒 Keranjang",
    cartEmpty: "Keranjang kosong.",
    total: "Total:",
    checkout: "Pesan Sekarang",
    availableItems: "Item Tersedia",
    add: "Tambah",
    descMessage:
      "Pesan mudah tanpa perlu ngantri ribet. List pesanan dan kirim ke WA admin.",
    viewCart: "Lihat Pesanan",
    hideCart: "Tutup Keranjang",
  },
  en: {
    title: "Digital Menu",
    categoryTitle: "Menu Categories:",
    all: "All",
    cartTitle: "🛒 Your Cart",
    cartEmpty: "Your cart is empty.",
    total: "Total:",
    checkout: "Checkout Now",
    availableItems: "Items Available",
    add: "Add",
    descMessage:
      "Order easily without queuing up. List your order and send via WhatsApp.",
    viewCart: "View Order",
    hideCart: "Hide Cart",
  },
};

const TEMPLATES = {
  Colorful: {
    bgMain: "#f2f2f2",
    sidebarBg: "rgb(80, 20, 160)",
    sidebarText: "white",
    primaryAccent: "rgb(80, 20, 160)",
    cardBg: "white",
    textColor: "#333",
  },
  Minimalist: {
    bgMain: "#ffffff",
    sidebarBg: "#f8f8f8",
    sidebarText: "#333",
    primaryAccent: "#007bff",
    cardBg: "#ffffff",
    textColor: "#333",
  },
};

const formatCurrency = (amount) => {
  const amountStr = String(Math.round(amount)).replace(/[^0-9]/g, "");
  if (!amountStr) return "0";
  return amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export default function Preview() {
  const { id: userId } = useParams();

  // State
  const [menu, setMenu] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [lang, setLang] = useState("id");
  const [settings, setSettings] = useState({
    template: "Colorful",
    whatsappNumber: "082229081327",
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileCart, setShowMobileCart] = useState(false);

  const T = TRANSLATIONS[lang];
  const theme = TEMPLATES[settings.template] || TEMPLATES.Colorful;

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleTemplateChange = async (newTemplate) => {
    setSettings((prev) => ({ ...prev, template: newTemplate }));
    const { error } = await supabase
      .from("user_settings")
      .update({ template: newTemplate })
      .eq("user_id", userId);
    if (error) alert("Gagal menyimpan template!");
  };

  const fetchMenuData = async () => {
    const { data: menuData, error } = await supabase
      .from("menu_items")
      .select("id, name, Harga, Deskripsi, Kategori, foto_url, order")
      .order("order", { ascending: true });

    if (error) console.error("Gagal mengambil menu:", error);
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
  };

  useEffect(() => {
    if (!userId) return;
    const loadData = async () => {
      setIsLoading(true);
      const { data: settingsData } = await supabase
        .from("user_settings")
        .select("template, whatsapp_number")
        .eq("user_id", userId)
        .single();
      if (settingsData) {
        setSettings({
          template: settingsData.template,
          whatsappNumber: settingsData.whatsapp_number,
        });
      }
      await fetchMenuData();
      setIsLoading(false);
    };
    loadData();

    const settingsChannel = supabase
      .channel("settings_changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_settings",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new.template) {
            setSettings((prev) => ({
              ...prev,
              template: payload.new.template,
              whatsappNumber: payload.new.whatsapp_number,
            }));
          }
        }
      )
      .subscribe();

    const menuChannel = supabase
      .channel("menu_items_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "menu_items" },
        () => {
          fetchMenuData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(menuChannel);
    };
  }, [userId]);

  const handleAddToCart = (item) => {
    setCart((cart) => {
      const existing = cart.find((i) => i.id === item.id);
      return existing
        ? cart.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
          )
        : [...cart, { ...item, quantity: 1 }];
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
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return alert(T.cartEmpty);
    let greeting =
      lang === "id" ? "Hallo kak, mau pesan:" : "Hello, I want to order:";
    let orderList = cart
      .map(
        (item, idx) =>
          `${idx + 1}. ${item.name} (${item.quantity}x) - Rp${formatCurrency(
            item.price * item.quantity
          )}`
      )
      .join("\n");
    const total = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const message = `${greeting}\n\n*DAFTAR PESANAN:*\n${orderList}\n\n*TOTAL: Rp${formatCurrency(
      total
    )}*`;
    const cleanNumber = settings.whatsappNumber.replace(/[^0-9]/g, "");
    const fullNumber = cleanNumber.startsWith("62")
      ? cleanNumber
      : `62${cleanNumber.substring(1)}`;
    window.open(
      `https://wa.me/${fullNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    setCart([]);
    setShowMobileCart(false);
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const categories = [T.all, ...new Set(menu.map((item) => item.category))];
  const filteredMenu =
    selectedCategory === "All" || selectedCategory === T.all
      ? menu
      : menu.filter((item) => item.category === selectedCategory);

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        Memuat Menu...
      </div>
    );

  return (
    <div
      className="flex flex-col md:flex-row h-screen overflow-hidden font-sans"
      style={{ backgroundColor: theme.bgMain }}
    >
      {/* =======================
          KOLOM 1: SIDEBAR
         ======================= */}
      <div
        className={`
          relative z-10 transition-colors duration-300
          w-full md:w-[280px] md:min-w-[280px] md:shrink-0
          h-auto md:h-full 
          overflow-y-visible md:overflow-y-auto
          overflow-x-hidden
          p-5 md:p-8
          shadow-md md:shadow-lg
        `}
        style={{ backgroundColor: theme.sidebarBg, color: theme.sidebarText }}
      >
        <div className="flex flex-col gap-4 mb-6">
          <h2 className="text-2xl font-bold m-0 leading-tight border-b border-white/20 pb-2">
            {T.title}
          </h2>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {["Colorful", "Minimalist"].map((tName) => (
                <button
                  key={tName}
                  onClick={() => handleTemplateChange(tName)}
                  className={`px-2 py-1 rounded text-[10px] md:text-xs font-bold transition-all ${
                    settings.template === tName
                      ? "bg-white shadow-sm"
                      : "bg-white/20"
                  }`}
                  style={{
                    color:
                      settings.template === tName
                        ? theme.primaryAccent
                        : "inherit",
                  }}
                >
                  {tName === "Colorful" ? "Color" : "Mini"}
                </button>
              ))}
            </div>

            <div className="flex gap-1">
              <button
                onClick={() => setLang("id")}
                className={`w-8 py-1 rounded text-[10px] md:text-xs font-bold text-center ${
                  lang === "id" ? "bg-white text-gray-800" : "bg-white/20"
                }`}
                style={{
                  color: lang === "id" ? theme.primaryAccent : "inherit",
                }}
              >
                ID
              </button>
              <button
                onClick={() => setLang("en")}
                className={`w-8 py-1 rounded text-[10px] md:text-xs font-bold text-center ${
                  lang === "en" ? "bg-white text-gray-800" : "bg-white/20"
                }`}
                style={{
                  color: lang === "en" ? theme.primaryAccent : "inherit",
                }}
              >
                EN
              </button>
            </div>
          </div>
        </div>

        <div
          className={`font-bold opacity-80 mb-3 ${
            isMobile ? "hidden" : "block"
          }`}
        >
          {T.categoryTitle}
        </div>

        <div className={`flex flex-wrap md:flex-col gap-2 pb-2 md:pb-0`}>
          {categories.map((cat) => (
            <div
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`
                px-4 py-2 rounded-full md:rounded-lg cursor-pointer text-sm md:text-base transition-all duration-200
                ${
                  selectedCategory === cat
                    ? "font-bold bg-white/20 shadow-sm"
                    : "hover:bg-black/5 border border-transparent"
                }
              `}
              style={{
                border:
                  selectedCategory === cat
                    ? "1px solid rgba(255,255,255,0.3)"
                    : "",
                backgroundColor:
                  selectedCategory === cat
                    ? theme.sidebarText === "white"
                      ? "rgba(255,255,255,0.2)"
                      : "rgba(0,0,0,0.1)"
                    : "transparent",
              }}
            >
              {cat}
            </div>
          ))}
        </div>

        <div className="hidden md:block mt-8 p-4 bg-white/10 rounded-xl text-sm opacity-90 leading-relaxed">
          {T.descMessage}
        </div>
      </div>

      {/* =======================
          KOLOM 2: KONTEN MENU
         ======================= */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto p-5 md:p-10 pb-32 md:pb-10">
        <header className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <h1
            className="text-2xl md:text-3xl font-bold truncate"
            style={{ color: theme.textColor }}
          >
            {selectedCategory === T.all ? T.all : selectedCategory}
          </h1>
          <div className="px-3 py-1 rounded-full text-sm font-medium bg-gray-200 text-gray-600 whitespace-nowrap">
            {filteredMenu.length} {T.availableItems}
          </div>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenu.map((item) => (
            <div
              key={item.id}
              className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col border border-gray-100 bg-white"
            >
              {item.image && (
                <div className="w-full h-40 overflow-hidden bg-gray-100 relative">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
              )}
              <div className="p-4 flex flex-col flex-grow">
                <strong
                  className="text-lg mb-1 leading-tight"
                  style={{ color: "#333" }}
                >
                  {item.name}
                </strong>
                <p className="text-sm text-gray-500 mb-4 flex-grow line-clamp-2 leading-relaxed">
                  {item.desc}
                </p>

                {/* ⭐ FIX UTAMA: Layout Vertikal (Atas Bawah) ⭐ 
                    Agar Harga dan Tombol tidak rebutan tempat */}
                <div className="mt-auto pt-3 border-t border-gray-50 flex flex-col gap-2">
                  {/* Harga di Atas */}
                  <span
                    className="font-bold text-lg"
                    style={{ color: theme.primaryAccent }}
                  >
                    Rp{formatCurrency(item.price)}
                  </span>

                  {/* Tombol Full Width di Bawah */}
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="
                      w-full py-2
                      rounded-lg 
                      text-sm font-bold text-white 
                      shadow-sm hover:brightness-110 active:scale-95 transition-all
                      flex justify-center items-center gap-2
                    "
                    style={{ backgroundColor: theme.primaryAccent }}
                  >
                    <span>+</span> {T.add}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* =======================
          KOLOM 3: KERANJANG BELANJA
         ======================= */}
      <div
        className={`
          fixed bottom-0 left-0 w-full z-50 flex flex-col transition-all duration-300
          md:static md:h-full
          md:w-[350px] md:min-w-[350px] md:max-w-[350px] md:shrink-0
          bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.15)] md:shadow-[-4px_0_10px_rgba(0,0,0,0.05)]
          rounded-t-2xl md:rounded-none md:border-l border-gray-100
          ${
            isMobile && !showMobileCart && cart.length > 0
              ? "h-auto"
              : isMobile && showMobileCart
              ? "h-[80vh]"
              : isMobile && cart.length === 0
              ? "hidden"
              : "h-full"
          }
        `}
        style={{ backgroundColor: theme.cardBg }}
      >
        {isMobile && cart.length > 0 && (
          <div
            onClick={() => setShowMobileCart(!showMobileCart)}
            className="p-4 text-white cursor-pointer flex justify-between items-center rounded-t-2xl shrink-0"
            style={{ backgroundColor: theme.primaryAccent }}
          >
            <div className="font-bold">
              {cart.reduce((sum, item) => sum + item.quantity, 0)} Item • Rp
              {formatCurrency(cartTotal)}
            </div>
            <div className="text-sm flex items-center gap-1 opacity-90">
              {showMobileCart ? "▼" : "▲"}{" "}
              {showMobileCart ? T.hideCart : T.viewCart}
            </div>
          </div>
        )}

        <div
          className={`p-6 flex-grow overflow-y-auto ${
            isMobile && !showMobileCart ? "hidden" : "block"
          }`}
        >
          {!isMobile && (
            <h3
              className="text-lg font-bold border-b pb-3 mb-4"
              style={{
                color: theme.textColor,
                borderColor: theme.primaryAccent,
              }}
            >
              {T.cartTitle}
            </h3>
          )}

          <div className="mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-gray-400 py-10">
                <div className="text-4xl mb-2">🛒</div>
                <p>{T.cartEmpty}</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center mb-4 border-b border-dashed border-gray-200 pb-3 last:border-0"
                >
                  <div className="flex-grow pr-2 min-w-0">
                    <div
                      className="font-semibold text-sm truncate"
                      style={{ color: theme.textColor }}
                    >
                      {item.name}
                    </div>
                    <div className="text-xs text-gray-500 whitespace-nowrap">
                      Rp{formatCurrency(item.price)} x {item.quantity}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg shrink-0">
                    <button
                      onClick={() => handleUpdateQuantity(item.id, -1)}
                      className="w-6 h-6 flex items-center justify-center bg-white border border-gray-200 rounded text-red-500 font-bold hover:bg-gray-100"
                    >
                      -
                    </button>
                    <span className="font-bold text-sm w-5 text-center text-gray-700">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => handleUpdateQuantity(item.id, 1)}
                      className="w-6 h-6 flex items-center justify-center text-white rounded font-bold"
                      style={{ backgroundColor: theme.primaryAccent }}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {cart.length > 0 && (
            <div className="mt-auto pt-4 border-t border-gray-100 shrink-0">
              <div
                className="flex justify-between font-bold text-lg mb-4"
                style={{ color: theme.textColor }}
              >
                <span>{T.total}</span>
                <span style={{ color: theme.primaryAccent }}>
                  Rp{formatCurrency(cartTotal)}
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full py-3 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2 hover:brightness-110 transition-all active:scale-95"
                style={{ backgroundColor: "#25D366" }}
              >
                <span>WhatsApp</span> {T.checkout}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
