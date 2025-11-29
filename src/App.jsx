<<<<<<< HEAD
// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from '/vite.svg'
// import './App.css'

// function App() {
//   const [count, setCount] = useState(0)

//   return (
//     <>
//       <div>
//         <a href="https://vite.dev" target="_blank">
//           <img src={viteLogo} className="logo" alt="Vite logo" />
//         </a>
//         <a href="https://react.dev" target="_blank">
//           <img src={reactLogo} className="logo react" alt="React logo" />
//         </a>
//       </div>
//       <h1>Vite + React</h1>
//       <div className="card">
//         <button onClick={() => setCount((count) => count + 1)}>
//           count is {count}
//         </button>
//         <p>
//           Edit <code>src/App.jsx</code> and save to test HMR
//         </p>
//       </div>
//       <p className="read-the-docs">
//         Click on the Vite and React logos to learn more
//       </p>
//     </>
//   )
// }

// export default App
=======
"use client";
import { Routes, Route, useLocation } from "react-router-dom"; // Tambahkan useLocation
import Home from "./pages/home";
import Builder from "./pages/builder";
import Preview from "./pages/preview";
// import Navbar from "./components/navbar"; // ⭐ TIDAK DIGUNAKAN LAGI ⭐
import { useState } from "react";
import Dashboard from "./pages/dashboard";

// Komponen untuk Layout Admin
const AdminLayout = ({ children }) => {
  // Karena Home.jsx dan Builder.jsx akan menggunakan layout sidebar yang berbeda,
  // untuk saat ini, kita biarkan halaman tersebut di-render langsung.
  // Sidebar Navigasi sudah dibuat di Home.jsx, sehingga tidak perlu di sini.
  return <>{children}</>;
};

function App() {
  const location = useLocation();

  // ⭐ Tentukan rute yang merupakan tampilan publik (tanpa sidebar admin) ⭐
  const isPublicPreview = location.pathname.startsWith("/preview");

  // Jika ini adalah halaman Preview (publik), render Preview saja.
  if (isPublicPreview) {
    return (
      <Routes>
        {/* Rute Preview TIDAK menggunakan layout Admin */}
        <Route path="/preview" element={<Preview />} />
        {/* Rute Preview dengan ID user */}
        <Route path="/preview/:id" element={<Preview />} />
      </Routes>
    );
  }

  // Jika BUKAN halaman Preview, gunakan Layout Admin (Home dan Builder)
  return (
    <>
      {/* ⭐ NAV ATAS DIHILANGKAN, menggunakan Nav Sidebar di Home.jsx ⭐ */}
      <AdminLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/builder" element={<Builder />} />

          {/* Tambahkan rute Preview di sini juga, tapi akan dialihkan ke blok if di atas */}
          <Route path="/preview" element={<Preview />} />
        </Routes>
      </AdminLayout>
    </>
  );
}

export default App;
>>>>>>> teman/main
