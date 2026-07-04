"use client";

import React, { useEffect, useState } from "react";
import {
  collection,
  query,
  where,
  addDoc,
  getDocs,
  serverTimestamp,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";

/* -------------------------------------------------- */
/* TYPES */
/* -------------------------------------------------- */
type Item = {
  name: string;
  qty: number;
  price: number;
};

type Product = {
  id: string;
  name: string;
  price: number;
};

/* -------------------------------------------------- */
/* COMPONENT */
/* -------------------------------------------------- */
export default function OrderPage() {
  const [customer, setCustomer] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<Item[]>([{ name: "", qty: 1, price: 0 }]);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);
  const [productList, setProductList] = useState<Product[]>([]);
  const [customersList, setCustomersList] = useState<string[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  /* -------------------------------------------------- */
  /* AUTH */
  /* -------------------------------------------------- */
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  /* -------------------------------------------------- */
  /* LOAD DATA */
  /* -------------------------------------------------- */
  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (currentUser) loadPreviousOrders();
  }, [currentUser]);

  const loadProducts = async () => {
    const snap = await getDocs(collection(db, "products"));
    setProductList(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Product)));
  };

  const loadCustomers = async () => {
    const snap = await getDocs(collection(db, "Outlets"));
    setCustomersList(snap.docs.map((d) => d.data().name));
  };

  const loadPreviousOrders = async () => {
    const q = query(
      collection(db, "orders"),
      where("orderedByUid", "==", currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const snap = await getDocs(q);
    setPreviousOrders(
      snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    );
  };

  /* -------------------------------------------------- */
  /* ITEMS */
  /* -------------------------------------------------- */
  const addItem = () =>
    setItems([...items, { name: "", qty: 1, price: 0 }]);

  const removeItem = (index: number) =>
    setItems(items.filter((_, i) => i !== index));

  const updateItem = (
    index: number,
    field: "name" | "qty",
    value: any
  ) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === "name") {
        const product = productList.find((p) => p.name === value);
        next[index] = {
          ...next[index],
          name: value,
          price: product?.price || 0,
        };
      } else {
        next[index] = { ...next[index], qty: value };
      }
      return next;
    });
  };

  const total = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  /* -------------------------------------------------- */
  /* SUBMIT */
  /* -------------------------------------------------- */
  const handleSubmit = async () => {
    if (saving) return;

    if (!customer || !orderNumber || items.some((i) => !i.name)) {
      alert("Please complete all fields");
      return;
    }

    if (!currentUser) {
      alert("User not logged in");
      return;
    }

    setSaving(true);

    try {
      /* Prevent duplicate order numbers */
      const dupQ = query(
        collection(db, "orders"),
        where("orderNumber", "==", orderNumber),
        where("customer", "==", customer)
      );

      const dupSnap = await getDocs(dupQ);
      if (!dupSnap.empty) {
        alert("Order number already exists for this outlet.");
        setSaving(false);
        return;
      }

      /* Snapshot items */
      const cleanItems = items.map((it) => {
        const product = productList.find((p) => p.name === it.name);
        return {
          productId: product?.id || null,
          name: it.name,
          qty: it.qty,
          unitPrice: it.price,
        };
      });

      const order = {
        customer,
        orderNumber,
        items: cleanItems,
        total,
        itemCount: cleanItems.length,
        status: "pending",
        orderedByUid: currentUser.uid,
        orderedByName:
          currentUser.displayName || currentUser.email || "Unknown",
        createdAt: serverTimestamp(),
      };

      /* Save FIRST */
      await addDoc(collection(db, "orders"), order);

      /* WhatsApp */
      const msg = [
        `Order No: ${orderNumber}`,
        `Outlet: ${customer}`,
        "",
        "Items:",
        ...cleanItems.map(
          (i) =>
            `${i.name} x${i.qty} = ${(i.qty * i.unitPrice).toLocaleString()} UGX`
        ),
        "",
        `Total: ${total.toLocaleString()} UGX`,
      ];

      window.open(
        `https://wa.me/256709095815?text=${encodeURIComponent(
          msg.join("\n")
        )}`,
        "_blank"
      );

      /* Reset */
      setCustomer("");
      setOrderNumber("");
      setItems([{ name: "", qty: 1, price: 0 }]);
      setSearch("");
      loadPreviousOrders();

      alert("Order saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to save order");
    } finally {
      setSaving(false);
    }
  };

  /* -------------------------------------------------- */
  /* UI */
  /* -------------------------------------------------- */
  const filteredProducts = productList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "1rem", maxWidth: 600, margin: "0 auto" }}>
      <h2>🛒 Create Order</h2>

      <select value={customer} onChange={(e) => setCustomer(e.target.value)} style={styles.input}>
        <option value="">Select Outlet</option>
        {customersList.map((c) => (
          <option key={c}>{c}</option>
        ))}
      </select>

      <input
        placeholder="Order Number"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        style={styles.input}
      />

      <input
        placeholder="Search product..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />

      {items.map((item, i) => (
        <div key={i} style={styles.row}>
          <select
            value={item.name}
            onChange={(e) => updateItem(i, "name", e.target.value)}
            style={styles.input}
          >
            <option value="">Select item</option>
            {filteredProducts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name} — {p.price.toLocaleString()} UGX
              </option>
            ))}
          </select>

          <input
            type="number"
            min={1}
            value={item.qty}
            onChange={(e) => updateItem(i, "qty", Number(e.target.value))}
            style={{ ...styles.input, width: 80 }}
          />

          <button onClick={() => removeItem(i)} style={styles.removeBtn}>✖</button>
        </div>
      ))}

      <button onClick={addItem} style={styles.addBtn}>➕ Add Item</button>
      <h3>Total: {total.toLocaleString()} UGX</h3>

      <button
        onClick={handleSubmit}
        disabled={saving}
        style={{
          ...styles.submitBtn,
          opacity: saving ? 0.6 : 1,
        }}
      >
        {saving ? "Saving..." : "Save Order"}
      </button>

      <hr />
      <h4>Previous Orders</h4>

      {previousOrders.map((o) => (
        <div key={o.id} style={styles.orderCard}>
          <strong>{o.customer}</strong> — #{o.orderNumber} <br />
          Status: {o.status} <br />
          Total: {o.total?.toLocaleString()} UGX
        </div>
      ))}

      <Link href="/dashboard/salesdashboard" style={styles.backBtn}>
        Back
      </Link>
    </div>
  );
}

/* -------------------------------------------------- */
/* STYLES */
/* -------------------------------------------------- */
const styles: any = {
  input: { padding: 10, width: "100%", marginBottom: 12, borderRadius: 6 },
  row: { display: "flex", gap: 8, marginBottom: 8 },
  addBtn: { background: "#007bff", color: "#fff", padding: 10, width: "100%" },
  submitBtn: { background: "green", color: "#fff", padding: 14, width: "100%" },
  removeBtn: { background: "red", color: "#fff", padding: 6 },
  orderCard: { background: "#eee", padding: 10, borderRadius: 6, marginBottom: 8 },
  backBtn: { position: "fixed", bottom: 20, left: "50%", transform: "translateX(-50%)" },
};
