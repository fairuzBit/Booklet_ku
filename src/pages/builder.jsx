import { DndContext, closestCenter } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useEffect } from "react";
import ImageUploader from "../components/ImageUploader";
import { supabase } from "../supabase";

// 1. HELPER FUNCTION (DI LUAR KOMPONEN)
const formatCurrency = (amount) => {
  const amountStr = String(amount).replace(/[^0-9]/g, "");
  if (!amountStr) return "";
  // Menggunakan ekspresi reguler untuk memisahkan ribuan dengan titik
  const formatted = amountStr.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return formatted;
};

// 2. Fungsi untuk D&D atau drop and drag
const SortableItem = ({ item, deleteItem, formatCurrency }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: item.id });

  const style = {
    // Gaya D&D
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: "grab",
    zIndex: 10,
    // Gaya Card Menu
    border: "1px solid #ddd",
    padding: "15px",
    borderRadius: "10px",
    marginBottom: "15px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {/* Area Gambar */}
      {item.image && (
        <img
          src={item.image}
          alt={item.name}
          width="100"
          height="100"
          style={{ borderRadius: "8px", objectFit: "cover", flexShrink: 0 }}
        />
      )}

      {/* Area Teks dan Info */}
      <div style={{ flexGrow: 1 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "5px",
          }}
        >
          <strong style={{ fontSize: "1.2em", color: "#333" }}>
            {item.name}
          </strong>
          <span style={{ fontWeight: "bold", color: "rgb(220, 53, 69)" }}>
            Rp{formatCurrency(item.price)},00
          </span>
        </div>

        <div style={{ color: "#666", marginBottom: "5px" }}>{item.desc}</div>

        <div
          style={{
            fontSize: "12px",
            opacity: 0.7,
            padding: "3px 8px",
            backgroundColor: "rgb(233, 236, 239)",
            borderRadius: "4px",
            display: "inline-block",
          }}
        >
          {item.category}
        </div>
      </div>

      {/* Tombol Hapus */}
      <button
        onClick={() => deleteItem(item.id)}
        style={{
          background: "rgb(220, 53, 69)",
          color: "white",
          padding: "8px 15px",
          borderRadius: "6px",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Hapus
      </button>
    </div>
  );
};

// ⭐ 3. KOMPONEN UTAMA BUILDER
export default function Builder() {
  // --- STATE ---
  const [menu, setMenu] = useState([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [desc, setDesc] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  // --- HANDLERS LOKAL ---
  const handlePriceChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    setPrice(rawValue);
  };

  // --- FUNGSI CRUD & D&D ---

  // READ: Mengambil data menu dari Supabase
  const fetchMenu = async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("id, name, Harga, Deskripsi, Kategori, foto_url, order")
      .order("order", { ascending: true }); // Urutkan berdasarkan kolom 'order'

    if (error) {
      console.error("Error fetching menu:", error);
    } else {
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

  // CREATE: Menambahkan item baru ke Supabase
  const addItem = async () => {
    if (!name || !price) return alert("Nama & harga wajib diisi!");
    if (!category) return alert("Kategori wajib diisi!");

    const parsedPrice = parseFloat(price);

    if (isNaN(parsedPrice)) {
      return alert("Harga harus diisi dengan angka yang valid!");
    }

    const newItem = {
      name: name,
      Harga: parsedPrice,
      Deskripsi: desc,
      Kategori: category,
      foto_url: imageUrl,
      order: menu.length, // Order baru = panjang array saat ini
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

    // reset input
    setName("");
    setPrice("");
    setDesc("");
    setCategory("");
    setImageUrl("");
  };

  // DELETE: Menghapus item dari Supabase
  const deleteItem = async (id) => {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      console.error("Error deleting item:", error);
      alert("Gagal menghapus menu!");
      return;
    }

    setMenu(menu.filter((item) => item.id !== id));
  };

  // D&D HANDLER: Mengelola perubahan urutan dan menyimpannya ke Supabase
  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (active.id !== over.id) {
      const oldIndex = menu.findIndex((item) => item.id === active.id);
      const newIndex = menu.findIndex((item) => item.id === over.id);

      // 1. Update state lokal (tampilan)
      const newMenu = arrayMove(menu, oldIndex, newIndex);
      setMenu(newMenu);

      // 2. SIMPAN URUTAN BARU KE SUPABASE (Auto-Save)
      for (let i = 0; i < newMenu.length; i++) {
        const item = newMenu[i];

        const { error } = await supabase
          .from("menu_items")
          .update({ order: i })
          .eq("id", item.id);

        if (error) {
          console.error("Gagal update urutan untuk item", item.name, error);
        }
      }
    }
  };

  // --- RENDERING JSX ---
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "rgb(240, 248, 255)",
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "900px",
          width: "100%",
          backgroundColor: "#fff",
          padding: "30px",
          borderRadius: "15px",
          boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}
        >
          Menu Builder
        </h1>

        {/* KONTENER DUA KOLOM DENGAN FLEXBOX */}
        <div style={{ display: "flex", gap: "30px", alignItems: "flex-start" }}>
          {/* Kolom Kiri: Form Tambah Item */}
          <div
            style={{
              flexShrink: 0,
              width: "400px",
              padding: "20px",
              border: "1px solid #ddd",
              borderRadius: "12px",
              backgroundColor: "#f9f9f9",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3>Tambah Menu</h3>

            <input
              placeholder="Nama menu…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "95%",
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            <input
              placeholder="Harga…"
              value={formatCurrency(price)}
              onChange={handlePriceChange}
              style={{
                width: "95%",
                marginBottom: "15px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            <input
              placeholder="Deskripsi…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                width: "95%",
                marginBottom: "15px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
              }}
            />

            {/* DROPDOWN KATEGORI */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{
                width: "101%",
                marginBottom: "15px",
                padding: "10px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                height: "40px",
              }}
            >
              <option value="" disabled>
                Jenis Menu
              </option>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Dessert">Dessert</option>
              <option value="Snack">Snack</option>
            </select>

            {/* Upload Gambar */}
            <p>Upload Gambar Menu:</p>
            <ImageUploader onUploaded={(url) => setImageUrl(url)} />

            {/* PREVIEW GAMBAR LEBIH BESAR & PUSAT */}
            {imageUrl && (
              <div
                style={{
                  marginTop: "10px",
                  marginBottom: "10px",
                  textAlign: "center",
                }}
              >
                <p>Preview Gambar:</p>
                <img
                  src={imageUrl}
                  alt="menu"
                  width="300"
                  height="200"
                  style={{ borderRadius: "8px", objectFit: "cover" }}
                />
              </div>
            )}

            <button
              onClick={addItem}
              style={{
                marginTop: "20px",
                width: "100%",
                padding: "10px",
                backgroundColor: "rgb(40, 167, 69)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              + Tambah Menu
            </button>
          </div>
          {/* Akhir Kolom Kiri */}

          {/* Kolom Kanan: Daftar Menu */}
          <div
            style={{
              flexGrow: 1,
              padding: "20px",
              backgroundColor: "#fff",
              borderRadius: "12px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                textAlign: "center",
                marginBottom: "20px",
                color: "#333",
              }}
            >
              Daftar Menu
            </h3>

            {menu.length === 0 && (
              <p style={{ textAlign: "center", color: "#666" }}>
                Belum ada menu.
              </p>
            )}

            {/* KONTEKS DND UTAMA */}
            <DndContext
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={menu.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {menu.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    deleteItem={deleteItem}
                    formatCurrency={formatCurrency}
                  />
                ))}
              </SortableContext>
            </DndContext>
          </div>
          {/* Akhir Kolom Kanan */}
        </div>
      </div>
    </div>
  );
}
