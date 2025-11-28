import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useEffect, useMemo } from "react";
import ImageUploader from "../components/ImageUploader";
import { supabase } from "../utils/supabase";

// --- FUNGSI HELPER MOBILE/RESPONSIVE ---
const useIsMobile = (breakpoint = 1024) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };

    window.addEventListener("resize", checkIsMobile);
    return () => window.removeEventListener("resize", checkIsMobile);
  }, [breakpoint]);

  return isMobile;
};

// 1. HELPER FUNCTION
const formatCurrency = (amount) => {
  const amountStr = String(amount).replace(/[^0-9]/g, "");
  if (!amountStr) return "";
  const formatted = amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formatted;
};

// 2. SortableItem (Card Menu)
const SortableItem = ({ item, deleteItem, formatCurrency }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  // dnd-kit styling (Wajib Inline untuk Transformasi)
  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={dndStyle}
      {...attributes}
      {...listeners}
      className="relative z-10 flex flex-col items-start gap-4 p-4 mb-4 font-sans transition-shadow bg-white border border-gray-200 shadow-sm cursor-grab sm:flex-row sm:items-center sm:gap-5 sm:p-5 rounded-xl hover:shadow-md"
    >
      {/* Area Gambar */}
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          className="object-cover flex-shrink-0 w-full h-40 border-2 rounded-lg border-[#6B8E23] sm:w-32 sm:h-32"
        />
      )}

      {/* Area Teks dan Info */}
      <div className="flex-grow w-full">
        <div className="flex flex-col justify-between mb-1 sm:flex-row sm:items-baseline">
          <strong className="text-lg font-bold text-[#2C3E50] sm:text-xl">
            {item.name}
          </strong>
          <span className="mt-1 font-bold text-[#E74C3C] sm:text-lg sm:mt-0">
            Rp{formatCurrency(item.price)},00
          </span>
        </div>

        <div className="mb-3 text-sm text-gray-500 sm:text-base">
          {item.desc}
        </div>

        <div className="inline-block px-3 py-1 text-xs font-bold text-white rounded-full bg-[#6B8E23]">
          {item.category}
        </div>
      </div>

      {/* Tombol Hapus */}
      <button
        onClick={() => deleteItem(item.id)}
        className="w-full px-4 py-2 mt-2 font-bold text-white transition duration-200 bg-[#E74C3C] rounded-lg sm:w-auto sm:mt-0 hover:bg-red-700 flex-shrink-0"
      >
        ✕ Hapus
      </button>
    </div>
  );
};

// ⭐ 3. KOMPONEN UTAMA BUILDER
export default function Builder() {
  const isMobile = useIsMobile(1024); // Breakpoint Desktop (lg)

  // --- STATE INPUT & DATA ---
  const [menu, setMenu] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // ⭐ STATE FILTER & MOBILE FORM ⭐
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("Semua Kategori");
  const [isFormVisible, setIsFormVisible] = useState(false);

  // --- HANDLERS ---
  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setPrice(rawValue);
  };

  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, Harga, Deskripsi, Kategori, foto_url, order")
      .order("order", { ascending: true });

    if (error) console.error("Error fetching menu:", error);
    else {
      setMenu(
        data.map((item) => ({
          ...item,
          price: item.Harga,
          desc: item.Deskripsi,
          category: item.Kategori,
          image: item.foto_url,
          order: item.order,
        }))
      );
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const addItem = async () => {
    if (!name || !price || !category)
      return alert("Nama, harga & kategori wajib diisi!");
    const parsedPrice = parseInt(price, 10);
    if (isNaN(parsedPrice))
      return alert("Harga harus diisi dengan angka yang valid!");

    const newItem = {
      name: name,
      Harga: parsedPrice,
      Deskripsi: desc,
      Kategori: category,
      foto_url: imageUrl,
      order: menu.length,
    };

    const { data, error } = await supabase
      .from("menu_items")
      .insert([newItem])
      .select();

    if (error) {
      console.error("Error adding item:", error);
      alert("Gagal menambahkan menu!");
      return;
    }

    const addedItem = {
      ...data[0],
      price: data[0].Harga,
      desc: data[0].Deskripsi,
      category: data[0].Kategori,
      image: data[0].foto_url,
    };

    setMenu([...menu, addedItem]);
    setName("");
    setPrice("");
    setDesc("");
    setCategory("");
    setImageUrl("");
    if (isMobile) setIsFormVisible(false);
  };

  const deleteItem = async (id) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      console.error("Error deleting item:", error);
      alert("Gagal menghapus menu!");
      return;
    }
    setMenu(menu.filter((item) => item.id !== id));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = menu.findIndex((item) => item.id === active.id);
      const newIndex = menu.findIndex((item) => item.id === over.id);
      const newMenu = arrayMove(menu, oldIndex, newIndex);
      setMenu(newMenu);

      for (let i = 0; i < newMenu.length; i++) {
        await supabase
          .from("menu_items")
          .update({ order: i })
          .eq("id", newMenu[i].id);
      }
    }
  };

  // --- LOGIKA FILTER ---
  const allCategories = [
    "Semua Kategori",
    ...new Set(menu.map((item) => item.category)),
  ];

  const filteredMenu = useMemo(() => {
    let currentMenu = menu;
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (selectedFilter !== "Semua Kategori") {
      currentMenu = currentMenu.filter(
        (item) => item.category === selectedFilter
      );
    }
    if (lowerCaseSearch) {
      currentMenu = currentMenu.filter(
        (item) =>
          item.name.toLowerCase().includes(lowerCaseSearch) ||
          item.desc.toLowerCase().includes(lowerCaseSearch)
      );
    }
    return currentMenu;
  }, [menu, searchTerm, selectedFilter]);

  // --- RENDERING JSX ---
  return (
    <div className="min-h-screen p-0 font-sans bg-[#F4F6F8]">
      <div className="w-full p-5 mx-auto bg-white shadow-xl max-w-7xl lg:p-10 sm:rounded-xl">
        {/* Header */}
        <h1 className="mb-6 text-3xl font-normal text-[#2C3E50] border-b-4 border-[#FFD700] pb-2 lg:mb-10 lg:text-4xl">
          Menu Admin
        </h1>

        <div className="flex flex-col items-start gap-5 lg:flex-row lg:gap-10">
          {/* Tombol Toggle Form (Mobile Only) */}
          {isMobile && (
            <button
              onClick={() => setIsFormVisible(!isFormVisible)}
              className={`w-full p-3 mb-5 font-bold rounded-lg transition duration-200 text-white ${
                isFormVisible
                  ? "bg-[#E74C3C] hover:bg-red-700"
                  : "bg-[#6B8E23] hover:bg-[#8BA154]"
              }`}
            >
              {isFormVisible ? "❌ Tutup Form Input" : "➕ Input Menu Baru"}
            </button>
          )}

          {/* Kolom Kiri: Form Input (Sticky di Desktop) */}
          <div
            className={`
            flex-shrink-0 w-full lg:w-96 p-5 lg:p-7 
            border border-gray-200 rounded-xl bg-[#F4F6F8] shadow-sm
            ${
              isMobile
                ? isFormVisible
                  ? "block"
                  : "hidden"
                : "lg:sticky lg:top-10"
            }
          `}
          >
            <h3 className="mb-5 text-lg font-bold text-[#6B8E23]">
              Input Menu Baru
            </h3>

            <input
              placeholder="Nama menu (misal: Kopi Susu Aren)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
            />

            <input
              placeholder="Harga (misal: 18000)"
              value={formatCurrency(price)}
              onChange={handlePriceChange}
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
            />

            <textarea
              placeholder="Deskripsi singkat menu…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows="3"
              className="w-full p-3 mb-3 border border-gray-300 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-12 p-3 mb-5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
            >
              <option value="" disabled>
                Pilih Kategori Menu
              </option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Dessert">Dessert</option>
              <option value="Snack">Snack</option>
            </select>

            <p className="mb-2 font-bold text-[#2C3E50]">🖼️ Gambar Menu:</p>
            <ImageUploader onUploaded={(url) => setImageUrl(url)} />

            {imageUrl && (
              <div className="mt-5 text-center">
                <img
                  src={imageUrl}
                  alt="menu preview"
                  className="w-full h-48 lg:w-[300px] lg:h-52 object-cover rounded-lg border-4 border-[#6B8E23]"
                />
              </div>
            )}

            <button
              onClick={addItem}
              className="w-full p-3.5 mt-7 text-lg font-bold text-white bg-[#6B8E23] rounded-lg hover:bg-[#5a781d] transition duration-200"
            >
              ➕ Tambah Menu Sekarang
            </button>
          </div>

          {/* Kolom Kanan: Daftar Menu */}
          <div className="flex-grow w-full pt-5 lg:pt-0">
            <h3 className="mb-5 text-xl font-semibold text-[#2C3E50] lg:text-2xl">
              Atur Daftar Menu ({filteredMenu.length} Item)
            </h3>

            {/* Search & Filter */}
            <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:gap-4">
              <input
                type="text"
                placeholder="🔍 Cari menu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-grow w-full p-3 border border-gray-300 rounded-lg shadow-sm sm:w-auto focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
              />

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="flex-shrink-0 w-full p-3 bg-white border border-gray-300 rounded-lg shadow-sm sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#6B8E23]"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {filteredMenu.length === 0 && (
              <div className="p-10 text-center text-gray-500 rounded-lg bg-[#F4F6F8]">
                {menu.length === 0
                  ? "👋 Belum ada menu. Mulai tambah dari kolom kiri!"
                  : "😞 Menu tidak ditemukan sesuai filter Anda."}
              </div>
            )}

            {/* Drag & Drop List */}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              {filteredMenu.length > 0 && (
                <SortableContext
                  items={filteredMenu.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filteredMenu.map((item) => (
                    <SortableItem
                      key={item.id}
                      item={item}
                      deleteItem={deleteItem}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </SortableContext>
              )}
            </DndContext>
          </div>
        </div>
      </div>
    </div>
  );
}
