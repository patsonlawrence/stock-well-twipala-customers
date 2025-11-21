"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

export default function OrderPage() {
  const [customer, setCustomer] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [search, setSearch] = useState("");
  const [items, setItems] = useState([{ name: "", qty: 1, price: 0 }]);
  const [previousOrders, setPreviousOrders] = useState<any[]>([]);

  // Example items with prices
  const productList = [
    { name: "MAX PREP RAZORS 3 PACK -1 CTN(600)", price: 1440000 },
    { name: "MAX PREP RAZORS 6 PACK -1 CTN(300)", price: 1440000 },
    { name: "MAX PREP RAZORS 3 PACK -1 OUTER(100)", price: 240000 },
    { name: "MAX PREP RAZORS 6 PACK -1 OUTER(30)", price: 144000 },
    { name: "AFRICAN FARM DATES 360G", price: 4100 },
    { name: "AFRICAN FARM DATES 450G", price: 6150 },
    { name: "AFRICAN FARM DATES 630G", price: 10600 },
    { name: "AFRICAN FARM DATES 860G", price: 12300 },
    { name: "Salt", price: 2000 },
  ];
  const customersList = [
    "STANDARD SUPERMARKET LIMITED, APONYE BRANCH",
    "STANDARD SUPERMARKET LIMITED, GARDEN CITY BRANCH",
    "STANDARD SUPERMARKET LIMITED, BUGOLOBI BRANCH",
    "ECO - MART SUPERMARKET LIMITED, KIWATULE BRANCH",
    "ECO - MART SUPERMARKET LIMITED, KISAASI BRANCH",
    "ECO - MART SUPERMARKET LIMITED, KANSANGA BRANCH",
    "ECO - MART SUPERMARKET LIMITED, SEGUKU BRANCH",
    "Peter",
    "Peter",
    "Peter",
  ];
  // Search filtered items
  const filteredProducts = productList.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  const addItem = () => {
    setItems([...items, { name: "", qty: 1, price: 0 }]);
  };
  const updateItem = (index: number, field: "name" | "qty" | "price", value: any) => {
  setItems(prev => {
    const newItems = [...prev];
    if (field === "name") {
      const product = productList.find(p => p.name === value);
      newItems[index] = { ...newItems[index], name: value, price: product?.price || 0 };
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    return newItems;
  });
};
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  // Calculate total
  const total = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  // Save Order to Firebase
 const handleSubmit = async () => {
  console.log("Submitting order...");

  if (!customer || !orderNumber) {
    alert("Fill all required fields!");
    return;
  }

  const order = {
    customer,
    orderNumber,
    items,
    total,
    createdAt: serverTimestamp(),
  };

  console.log("Order object:", order);

  // Build WhatsApp message and URL
  const messageLines = [
    `Order for: ${customer}`,
    `Order No: ${orderNumber}`,
    "",
    "Items:",
    ...items.map((it) => `${it.name || "(no name)"} x${it.qty} = ${(it.qty * it.price).toLocaleString()} UGX`),
    "",
    `Total: ${total.toLocaleString()} UGX`,
    "",
    "Thank you for your order! Remember to attach clear order photos too here.",
  ];
  const whatsappURL = `https://wa.me/256709095815?text=${encodeURIComponent(messageLines.join("\n"))}`;

  // Open WhatsApp
  window.open(whatsappURL, "_blank");

  // SAVE ORDER
  try {
  const result = await addDoc(collection(db, "orders"), order);
  console.log("Order saved to Firestore:", result.id);
} catch (err) {
  console.error("🔥 Firestore SAVE ERROR:", err);
  const message = err instanceof Error ? err.message : String(err);
  alert("Error saving order: " + message);
  return;
}

  /*
  try {
    const result = await addDoc(collection(db, "orders"), order);
    console.log("Order saved to Firestore:", result.id);
  } catch (err) {
    console.error("ERROR saving order:", err);
    alert("Failed to save order.");
    return; // STOP HERE
  }*/

  // LOAD ORDERS
  try {
    console.log("Loading previous orders...");
    await loadPreviousOrders();
    console.log("Previous orders loaded.");
  } catch (err) {
    console.error("ERROR loading previous orders:", err);
    alert("Failed to load previous orders.");
    return; // STOP HERE
  }

  // CLEAR FIELDS (ONLY if all above succeeded)
  console.log("Clearing fields...");
  setCustomer("");
  setOrderNumber("");
  setItems([{ name: "", qty: 1, price: 0 }]);
  setSearch("");

  alert("Order Saved & Sent to WhatsApp!");
};


  // Load previous orders 
const loadPreviousOrders = async () => {
  try {
    const snapshot = await getDocs(collection(db, "orders"));
    const list: any[] = [];

    snapshot.forEach((doc) => {
      list.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || 0,
      });
    });

    list.sort(
      (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
    );

    setPreviousOrders(list);
    return true; // ⬅⬅⬅ important
  } catch (err) {
    console.error("loadPreviousOrders ERROR:", err);
    throw err; // ⬅⬅ ensures handleSubmit catches error
  }
};

  useEffect(() => {
    loadPreviousOrders();
  }, []);
  return (
    <div style={{ padding: "1rem", maxWidth: "600px", margin: "0 auto" }}>
      <h2>🛒 Create New Order</h2>

      {/* Customer select */}
      <label>Customer</label>
      <select
        value={customer}
        onChange={(e) => setCustomer(e.target.value)}
        style={styles.input}
        >
        <option value="">Select customer...</option>
        {customersList.map((c, idx) => (
        <option key={idx} value={c}>
        {c}
        </option>
        ))}
        </select>
      {/* Order number */}
      <label>Order Number</label>
      <input
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
        placeholder="Enter order number"
        style={styles.input}
      />
      <h3>Items</h3>
      {/* Search input */}
      <input
        type="text"
        placeholder="Search item..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={styles.input}
      />
      {/* Item rows */}
      {items.map((item, index) => (
  <div key={index} style={styles.row}>
    <select
      value={item.name}
      onChange={(e) => updateItem(index, "name", e.target.value)}
      style={styles.input}
    >
      <option value="">Select item...</option>
      {filteredProducts.map((p) => (
        <option key={p.name} value={p.name}>
          {p.name} - {p.price.toLocaleString()} UGX
        </option>
      ))}
    </select>

    <input
      type="number"
      min="1"
      value={item.qty}
      onChange={(e) => updateItem(index, "qty", Number(e.target.value))}
      style={{ ...styles.input, width: "80px" }}
    />

    <button onClick={() => removeItem(index)} style={styles.removeBtn}>
      ✖
    </button>
  </div>
    ))}

      {/* Add Item */}
      <button onClick={addItem} style={styles.addBtn}>
        ➕ Add Item
      </button>

      {/* Total */}
      <h3>Total: {total.toLocaleString()} UGX</h3>

      {/* Submit */}
      <button onClick={handleSubmit} style={styles.submitBtn}>
        ✅ Save Order
      </button>
      
<hr />
<h4>🛒 Previous Orders</h4>
{/* Previous Orders */}
      {previousOrders.map((order: any) => (
        <div key={order.id} style={styles.orderCard}>
          <strong>{order.customer}</strong> — #{order.orderNumber}
          <br />
          Total: {order.total.toLocaleString()} UGX
          <ul>
            {order.items?.map((i: any, idx: number) => (
              <li key={idx}>
                {i.name} : {i.price} * {i.qty} ={" "}
                {(i.qty * i.price).toLocaleString()} UGX
              </li>
            ))}
          </ul>
        </div>
      ))}        


<Link
  href="/"
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
    textDecoration: "none",
  }}
>
  Home Page
</Link>


    </div>
  );
}

const styles: any = {
  input: {
    padding: "10px",
    width: "100%",
    marginBottom: "12px",
    borderRadius: "6px",
    border: "1px solid #ccc",
  },
  row: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    alignItems: "center",
  },
  addBtn: {
    background: "#007bff",
    color: "white",
    padding: "10px",
    width: "100%",
    borderRadius: "6px",
    border: "none",
    marginBottom: "20px",
    cursor: "pointer",
  },
  submitBtn: {
    background: "green",
    color: "white",
    padding: "14px",
    width: "100%",
    borderRadius: "6px",
    border: "none",
    fontSize: "1rem",
    cursor: "pointer",
  },
  removeBtn: {
    background: "red",
    color: "white",
    padding: "6px",
    borderRadius: "5px",
    border: "none",
    cursor: "pointer",
  },
  orderCard: {
    background: "gray",
    padding: "10px",
    borderRadius: "8px",
    marginBottom: "10px",
  },
};
