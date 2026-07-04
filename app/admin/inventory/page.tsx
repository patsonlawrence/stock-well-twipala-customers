"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";

// ----- Product Type -----
interface Product {
  productId: string;
  productName: string;
  ProductPrice: number;
  productQty: number;
}

export default function AdminInventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState("");
  const [ProductPrice, setProductPrice] = useState<number | "">("");
  const [productQty, setProductQty] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list: Product[] = snap.docs.map((d) => ({ productId: d.id, ...(d.data() as any) }));
      setProducts(list);
    } catch (err) {
      console.error("Failed to load products:", err);
      alert("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Add/Edit product
  const saveProduct = async () => {
    if (!productName.trim() || ProductPrice === "" || ProductPrice <= 0 || productQty === "" || productQty <= 0) {
      alert("Please enter a valid name, price, and quantity.");
      return;
    }

    setLoading(true);
    try {
      const data = { productName: productName.trim(), ProductPrice: Number(ProductPrice), productQty: Number(productQty) };
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
        alert("Product updated!");
      } else {
        await addDoc(collection(db, "products"), data);
        alert("Product added!");
      }

      // Reset form
      setProductName("");
      setProductPrice("");
      setProductQty("");
      setEditingId(null);
      loadProducts();
    } catch (err: any) {
      console.error("SAVE ERROR:", err);
      alert("Error saving product: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const removeProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "products", productId));
      alert("Product deleted!");
      loadProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const editProduct = (p: Product) => {
    setProductName(p.productName);
    setProductPrice(p.ProductPrice);
    setProductQty(p.productQty);
    setEditingId(p.productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      alert("Logout failed");
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <button
        onClick={() => router.push("/dashboard/admindashboard")}
        style={styles.backBtn}
      >
        🔙 Back to Admin
      </button>

      <h2>📦 Inventory Admin</h2>

      {/* Add/Edit Form */}
      <div style={styles.card}>
        <h3>{editingId ? "✏️ Edit Product" : "➕ Add Product"}</h3>

        <input
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          style={styles.input}
          disabled={loading}
        />

        <input
          placeholder="Price (UGX)"
          type="number"
          value={ProductPrice}
          onChange={(e) => setProductPrice(Number(e.target.value))}
          style={styles.input}
          disabled={loading}
        />
        <input
          placeholder="Quantity"
          type="number"
          value={productQty}
          onChange={(e) => setProductQty(Number(e.target.value))}
          style={styles.input}
          disabled={loading}
        />

        <button onClick={saveProduct} style={styles.saveBtn} disabled={loading}>
          {editingId ? "Update Product" : "Add Product"}
        </button>

        {editingId && (
          <button
            onClick={() => {
              setProductName("");
              setProductPrice("");
              setProductQty("");
              setEditingId(null);
            }}
            style={styles.cancelBtn}
            disabled={loading}
          >
            Cancel Edit
          </button>
        )}
      </div>

      {/* Inventory List */}
      <h3 style={{ marginTop: "30px" }}>📋 Current Inventory</h3>

      {loading && <p>Loading products...</p>}
      {!loading && products.length === 0 && <p>No products yet.</p>}

      {products.map((p) => (
        <div key={p.productId} style={styles.itemRow}>
          <div>
            <strong>{p.productName}</strong>
            <br />
            {p.ProductPrice.toLocaleString()} UGX
            <br />
            {p.productQty} in stock
          </div>

          <div>
            <button onClick={() => editProduct(p)} style={styles.editBtn} disabled={loading}>
              Edit
            </button>
            <button onClick={() => removeProduct(p.productId)} style={styles.deleteBtn} disabled={loading}>
              Delete
            </button>
          </div>
        </div>
      ))}

      {/* Floating Logout Button */}
      <button onClick={handleLogout} style={{
  position: "fixed" as const,   // cast to literal type
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
  zIndex: 1000,                  // zIndex should be a number, not string
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
  backBtn: { marginBottom: 20, padding: "8px 12px", backgroundColor: "gray", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" },
  logoutBtn: {
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
  },
};
