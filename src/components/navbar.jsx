import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav
      style={{
        padding: "12px 20px",
        background: "#f3f3f3",
        display: "flex",
        gap: "20px",
        borderBottom: "1px solid #ddd",
      }}
    >
      <Link to="/">Dasbord</Link>
      <Link to="/builder">Tambah Menu</Link>
      <Link to="/preview">Preview User</Link>
    </nav>
  );
}
