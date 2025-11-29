import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import { v4 as uuidv4 } from "uuid";


// ⭐ Ganti dengan NAMA BUCKET Anda yang BENAR dan sama persis
const BUCKET_NAME = "menu-buckets";

const ImageUploader = ({ onUploaded }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);

    // 1. Definisikan path dan nama unik untuk file
    const uniqueId = uuidv4();
    const fileExtension = file.name.split(".").pop();
    const filePath = `menu-items/${uniqueId}.${fileExtension}`;

    // 2. Lakukan Upload ke Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file); // data.path di sini adalah path relatif

    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      alert("Gagal mengupload gambar.");
      setIsUploading(false);
      return;
    }

    // ⭐⭐⭐ BAGIAN KRUSIAL: MENGAMBIL URL PUBLIK ⭐⭐⭐
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(data.path); // Menggunakan path relatif dari hasil upload

    const publicUrl = publicUrlData.publicUrl;

    // 4. Panggil callback di Builder.jsx
    onUploaded(publicUrl);

    setIsUploading(false);
  };

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={isUploading}
        style={{ marginBottom: "10px" }}
      />
      {isUploading && (
        <p style={{ color: "blue" }}>Mengupload... Mohon tunggu.</p>
      )}
    </div>
  );
};

export default ImageUploader;
