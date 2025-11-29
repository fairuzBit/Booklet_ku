import React, { useState } from "react";
import { supabase } from "../supabase";
import ImageUploader from "../components/ImageUploader";

export default function AddMenu() {
  const [photoUrl, setPhotoUrl] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  async function addMenu() {
    const { error } = await supabase.from("menu_items").insert([
      {
        name,
        price,
        photo_url: photoUrl,
      },
    ]);

    if (error) {
      console.error(error);
      alert("Gagal menambah menu");
      return;
    }

    alert("Menu berhasil ditambah!");
  }

  return (
    <div>
      <h2>Tambah Menu</h2>

      <input
        type="text"
        placeholder="Nama Menu"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <input
        type="number"
        placeholder="Harga"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
      />

      <ImageUploader onUploaded={(url) => setPhotoUrl(url)} />

      {photoUrl && (
        <img
          src={photoUrl}
          alt="preview"
          style={{ width: 150, marginTop: 10 }}
        />
      )}

      <button onClick={addMenu}>Simpan Menu</button>
    </div>
  );
}
