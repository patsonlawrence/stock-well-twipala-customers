"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
//import { roleDashboards } from "@/lib/dashboards";
//import ProtectedRoute from "@/app/ProtectedPage";

// ----- Inventory Page Content -----
function AdminInventoryPageContent() {
  const router = useRouter();

  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  // Load products
  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Add or edit product
  const saveProduct = async () => {
    try {
      if (!name || !price) {
        alert("Name & price required!");
        return;
      }

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), { name, price: Number(price) });
        alert("Product updated!");
      } else {
        await addDoc(collection(db, "products"), { name, price: Number(price) });
        alert("Product added!");
      }

      setName("");
      setPrice("");
      setEditingId(null);
      loadProducts();
    } catch (err: any) {
      console.error("SAVE ERROR:", err);
      alert("Error: " + err.message);
    }
  };

  // Delete product
  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    await deleteDoc(doc(db, "products", id));
    alert("Product deleted!");
    loadProducts();
  };

  // Load product into form for editing
  const editProduct = (p: any) => {
    setName(p.name);
    setPrice(p.price);
    setEditingId(p.id);
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err: any) {
      console.error("Logout failed:", err.message);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>📦 Inventory Admin</h2>

      {/* Add/Edit Form */}
      <div style={styles.card}>
        <h3>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h3>

        <input
          placeholder="Product Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />

        <input
          placeholder="Price (UGX)"
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          style={styles.input}
        />

        <button onClick={saveProduct} style={styles.saveBtn}>
          {editingId ? "Update Product" : "Add Product"}
        </button>

        {editingId && (
          <button
            onClick={() => {
              setName("");
              setPrice("");
              setEditingId(null);
            }}
            style={styles.cancelBtn}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Current Inventory */}
      <h3 style={{ marginTop: "30px" }}>📋 Current Inventory</h3>
      {products.map((p) => (
        <div key={p.id} style={styles.itemRow}>
          <div>
            <strong>{p.name}</strong>
            <br />
            {p.price.toLocaleString()} UGX
          </div>

          <div>
            <button onClick={() => editProduct(p)} style={styles.editBtn}>
              Edit
            </button>
            <button onClick={() => removeProduct(p.id)} style={styles.deleteBtn}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Floating Logout Button */}
      <button
        onClick={handleLogout}
        style={{
          position: "fixed",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "white",
          color: "green",
          padding: "0.75rem 1.5rem",
          border: "none",
          borderRadius: "1.75rem",
          cursor: "pointer",
          fontWeight: 500,
          fontSize: "1rem",
          width: "75%",
          zIndex: 1000,
          textAlign: "center",
          boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
        }}
      >
        Logout
      </button>
    </div>
  );
}

// ----- Styles -----
const styles = {
  card: { padding: "15px", background: "#f5f5f5", borderRadius: "10px", marginBottom: "20px" },
  input: { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" },
  saveBtn: { width: "100%", padding: "12px", background: "green", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
  cancelBtn: { width: "100%", padding: "12px", background: "gray", color: "white", borderRadius: "6px", border: "none", marginTop: "8px", cursor: "pointer" },
  itemRow: { display: "flex", justifyContent: "space-between", background: "#eee", padding: "12px", borderRadius: "8px", marginBottom: "10px" },
  editBtn: { padding: "8px 12px", marginRight: "6px", background: "#007bff", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
  deleteBtn: { padding: "8px 12px", background: "red", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
};

// ----- Export Wrapped with ProtectedRoute -----
export default function AdminInventoryPage() {
  return (
          <AdminInventoryPageContent />    
  );
}
