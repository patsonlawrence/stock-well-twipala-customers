"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function InventoryAdminPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [price, setPrice] = useState<number | string>("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    const list: any[] = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    setProducts(list);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // ADD OR EDIT PRODUCT
  const saveProduct = async () => {
    if (!name || !price) {
      alert("Name & price required!");
      return;
    }

    if (editingId) {
      // EDIT MODE
      await updateDoc(doc(db, "products", editingId), {
        name,
        price: Number(price),
      });
      alert("Product updated!");
    } else {
      // ADD MODE
      await addDoc(collection(db, "products"), {
        name,
        price: Number(price),
      });
      alert("Product added!");
    }

    setName("");
    setPrice("");
    setEditingId(null);
    loadProducts();
  };

  // DELETE PRODUCT
  const removeProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;

    await deleteDoc(doc(db, "products", id));
    alert("Product deleted!");
    loadProducts();
  };

  // LOAD PRODUCT INTO FORM FOR EDITING
  const editProduct = (p: any) => {
    setName(p.name);
    setPrice(p.price);
    setEditingId(p.id);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2>📦 Inventory Admin</h2>

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
    </div>
  );
}

const styles = {
  card: {
    padding: "15px",
    background: "#f5f5f5",
    borderRadius: "10px",
    marginBottom: "20px",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  saveBtn: {
    width: "100%",
    padding: "12px",
    background: "green",
    color: "white",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  cancelBtn: {
    width: "100%",
    padding: "12px",
    background: "gray",
    color: "white",
    borderRadius: "6px",
    border: "none",
    marginTop: "8px",
    cursor: "pointer",
  },
  itemRow: {
    display: "flex",
    justifyContent: "space-between",
    background: "#eee",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "10px",
  },
  editBtn: {
    padding: "8px 12px",
    marginRight: "6px",
    background: "#007bff",
    color: "white",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
  deleteBtn: {
    padding: "8px 12px",
    background: "red",
    color: "white",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
  },
};
