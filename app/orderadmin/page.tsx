"use client";

import { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  doc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { runTransaction } from "firebase/firestore";

type Item = { productId: string; productName: string; productQty: number; ProductPrice: number };

type Order = {
  OrderId: string;
  customer: string;
  orderNumber: string;
  orderedItems: Item[];
  orderTotal: number;
  orderedBy?: string;
  createdAt?: any;
  resolved?: boolean;
};

export default function AdminOrderPage() {
  // --- STATES ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderedItems, setOrderedItems] = useState<Item[]>([{ productId: "", productName: "", productQty: 1, ProductPrice: 0 }]);
  const [searchItem, setSearchItem] = useState("");

  const [productList, setProductList] = useState<Item[]>([]);
  const [customersList, setCustomersList] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters
  const [searchCustomer, setSearchCustomer] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "resolved" | "pending">("all");

  // --- LOAD DATA ---
  const loadProducts = async () => {
    try {
      const snap = await getDocs(collection(db, "products"));
      const list = snap.docs.map((d) => ({ productId: d.id, ...(d.data() as any) }));
      setProductList(list);
    } catch (err) {
      console.error("Load products failed:", err);
    }
  };

  const loadCustomers = async () => {
    try {
      const snap = await getDocs(collection(db, "Outlets"));
      const list = snap.docs.map((d) => d.data().name);
      setCustomersList(list);
    } catch (err) {
      console.error("Load customers failed:", err);
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ OrderId: d.id, ...(d.data() as any) }));
      setOrders(list);
    } catch (err) {
      console.error(err);
      alert("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadOrders();
  }, []);

  // --- ITEMS HANDLERS ---
  const addItem = () => setOrderedItems([...orderedItems, { productId: "", productName: "", productQty: 1, ProductPrice: 0 }]);
  const removeItem = (index: number) => setOrderedItems(orderedItems.filter((_, i) => i !== index));
  const updateItem = (index: number, field: "productName" | "productQty" | "ProductPrice", value: any) => {
    setOrderedItems((prev) => {
  const newItems = [...prev];

  if (field === "productName") {
    const prod = productList.find((p) => p.productName === value);

    newItems[index] = {
      ...newItems[index],
      productId: prod?.productId || "",
      productName: value,
      ProductPrice: prod?.ProductPrice || 0,
    };
  } else {
    newItems[index] = {
      ...newItems[index],
      [field]: value,
    };
  }

  return newItems;
});
  };
  const orderTotal = orderedItems.reduce((sum, it) => sum + it.productQty * it.ProductPrice, 0);

  // --- FILTERS ---
  const filteredOrders = orders.filter((o) => {
    const customerMatch = o.customer.toLowerCase().includes(searchCustomer.toLowerCase());
    const statusMatch =
      statusFilter === "all" ? true : statusFilter === "resolved" ? o.resolved : !o.resolved;
    return customerMatch && statusMatch;
  });

  const monthlyTotal = filteredOrders.reduce((sum, o) => sum + (o.orderTotal || 0), 0);

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!customer || !orderNumber) return alert("Fill all required fields!");
    if (orderedItems.length === 0 || orderedItems.some((i) => !i.productName)) return alert("Add at least one item!");

    const orderedBy = localStorage.getItem("userName") || "Unknown";

    const orderData = {
      customer,
      orderNumber,
      orderedItems,
      orderTotal,
      orderedBy,
      resolved: false,
      createdAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "orders", editingId), orderData);
        alert("Order updated!");
        setEditingId(null);
      } else {
        await addDoc(collection(db, "orders"), orderData);
        alert("Order saved!");
      }
      loadOrders();
      setCustomer("");
      setOrderNumber("");
      setOrderedItems([{ productId: "", productName: "", productQty: 1, ProductPrice: 0 }]);
      setSearchItem("");
    } catch (err) {
      alert("Save failed");
    }
  };

  // --- EDIT ---
  const editOrder = (order: Order) => {
    setCustomer(order.customer);
    setOrderNumber(order.orderNumber);
    setOrderedItems(order.orderedItems);
    setEditingId(order.OrderId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // --- DELETE ---
  const deleteOrder = async (OrderId: string) => {
    if (!confirm("Delete this order?")) return;
    await deleteDoc(doc(db, "orders", OrderId));
    loadOrders();
  };

  // --- RESOLVE ---  

const toggleResolved = async (order: Order) => {
  if (!confirm(order.resolved ? "Mark as unresolved?" : "Mark as resolved?")) return;

  const orderRef = doc(db, "orders", order.OrderId);

  try {
    await runTransaction(db, async (transaction) => {
      const orderSnap = await transaction.get(orderRef);

      if (!orderSnap.exists()) {
        throw new Error("Order not found");
      }

      const currentResolved = orderSnap.data().resolved;
      const newResolved = !currentResolved;

      for (const item of order.orderedItems) {
        if (!item.productId) {
          console.warn("Skipping item with no productId:", item);
          continue;
        }

        const productRef = doc(db, "products", item.productId);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists()) continue;

        const data = productSnap.data();
        const currentStock = Number(data.productQty ?? 0);
        const qty = Number(item.productQty ?? 0);

        if (qty <= 0) continue;

        let updatedStock: number;

if (newResolved) {
  if (currentStock < qty) {
    throw new Error(
      `Not enough stock for ${item.productName}. Available: ${currentStock}, Required: ${qty}`
    );
  }

  updatedStock = currentStock - qty;
} else {
  updatedStock = currentStock + qty;
}

transaction.update(productRef, {
  productQty: updatedStock,
});
      }

      transaction.update(orderRef, {
        resolved: newResolved,
        updatedAt: new Date(),
      });
    });

    await loadOrders();
  } catch (error) {
    console.error("Toggle resolved failed:", error);

  if (error instanceof Error) {
    alert(error.message);
  } else {
    alert("Failed to update order. Please try again.");
  }
  }
};

  // --- CSV EXPORT ---
  const exportCSV = () => {
    if (!filteredOrders.length) return alert("No orders to export");
    const header = ["OrderNumber", "Customer", "Total", "Resolved", "OrderedBy", "Date", "Items"];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      o.customer,
      o.orderTotal,
      o.resolved ? "Yes" : "No",
      o.orderedBy,
      o.createdAt?.toDate?.()?.toLocaleString() || "",
      o.orderedItems.map((i) => `${i.productName} x${i.productQty} = ${i.ProductPrice}`).join("; "),
    ]);
    const csvContent = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "orders.csv");
    link.click();
  };

  // --- SEND TO WHATSAPP ---
  const sendToWhatsApp = (order: Order) => {
    const now = order.createdAt?.toDate?.()?.toLocaleString() || new Date().toLocaleString();
    const lines = [
      `Order Date: ${now}`,
      `Customer: ${order.customer}`,
      `Order No: ${order.orderNumber}`,
      `Ordered By: ${order.orderedBy || "Unknown"}`,
      "",
      "Items:",
      ...order.orderedItems.map((i) => `${i.productName} x${i.productQty} = ${i.productQty * i.ProductPrice} UGX`),
      "",
      `Total: ${order.orderTotal.toLocaleString()} UGX`,
      "",
      "Thank you for your order!",
    ];
    const waURL = `https://wa.me/256709095815?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(waURL, "_blank");
  };

  // --- UI ---
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>🛒 {editingId ? "Edit Order" : "Create New Order"}</h2>

      <select value={customer} onChange={(e) => setCustomer(e.target.value)} style={styles.input}>
        <option value="">Select Outlet...</option>
        {customersList.map((c, idx) => (
          <option key={idx} value={c}>
            {c}
          </option>
        ))}
      </select>

      <input
        style={styles.input}
        placeholder="Order Number"
        value={orderNumber}
        onChange={(e) => setOrderNumber(e.target.value)}
      />

      <input
        style={styles.input}
        placeholder="Search item..."
        value={searchItem}
        onChange={(e) => setSearchItem(e.target.value)}
      />

      {orderedItems.map((it, idx) => (
        <div key={idx} style={styles.row}>
          <select
            style={styles.input}
            value={it.productName}
            onChange={(e) => updateItem(idx, "productName", e.target.value)}
          >
            <option value="">Select item...</option>
            {productList
              .filter((p) => p.productName.toLowerCase().includes(searchItem.toLowerCase()))
              .map((p) => (
                <option key={p.productId} value={p.productName}>
                  {p.productName} - {p.productName} - {(Number(p.ProductPrice) || 0).toLocaleString()} UGX {p.productQty > 0 ? "(In stock)" : "(Out of stock)"}
                </option>
              ))}
          </select>
          <input
            type="number"
            min={1}
            style={{ ...styles.input, width: 80 }}
            value={it.productQty}
            onChange={(e) => updateItem(idx, "productQty", Number(e.target.value))}
          />
          <button style={styles.removeBtn} onClick={() => removeItem(idx)}>
            ✖
          </button>
        </div>
      ))}

      <button style={styles.addBtn} onClick={addItem}>
        ➕ Add Item
      </button>

      <h3>Total: {orderTotal.toLocaleString()} UGX</h3>

      <button style={styles.submitBtn} onClick={handleSubmit}>
        {editingId ? "Update Order" : "Save Order"}
      </button>

      <div style={{ margin: "20px 0", display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          placeholder="Search customer..."
          value={searchCustomer}
          onChange={(e) => setSearchCustomer(e.target.value)}
          style={{ ...styles.input, flex: 1 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}>
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
        <button style={styles.exportBtn} onClick={exportCSV}>
          Export CSV
        </button>
      </div>

      <h3>💰 Total of displayed orders: {monthlyTotal.toLocaleString()} UGX</h3>

      {loading && <p>Loading...</p>}
      {filteredOrders.map((o) => {
        const createdAt = o.createdAt?.toDate?.()?.toLocaleString() || "N/A";
        return (
          <div
            key={o.OrderId}
            style={{ ...styles.card, background: o.resolved ? "#e6fffa" : "#f3f3f3" }}
          >
            <div style={styles.header}>
              <strong>{o.customer}</strong>
              <span>#{o.orderNumber}</span>
            </div>
            <p>Total: {o.orderTotal?.toLocaleString()} UGX</p>
            <p>Status: {o.resolved ? "✅ Resolved" : "⏳ Pending"}</p>
            <p>Ordered By: {o.orderedBy}</p>
            <p>Date: {createdAt}</p>
            <details>
              <summary>Items</summary>
              <ul>
                {o.orderedItems.map((i, idx) => (
                  <li key={idx}>
                    {i.productName} × {i.productQty} = {(i.productQty * i.ProductPrice).toLocaleString()} UGX
                  </li>
                ))}
              </ul>
            </details>
            <div style={styles.actions}>
              <button
                style={{ ...styles.btn, background: o.resolved ? "#999" : "green" }}
                onClick={() => toggleResolved(o)}
              >
                {o.resolved ? "Unresolve" : "Resolve"}
              </button>
              <button style={{ ...styles.btn, background: "blue" }} onClick={() => editOrder(o)}>
                Edit
              </button>
              <button style={{ ...styles.btn, background: "red" }} onClick={() => deleteOrder(o.OrderId)}>
                Delete
              </button>
              <button style={{ ...styles.btn, background: "darkgreen" }} onClick={() => sendToWhatsApp(o)}>
                📲 WhatsApp
              </button>
            </div>
          </div>
        );
      })}

      <Link href="/dashboard/admindashboard" style={styles.backBtn}>
        Back to Dashboard
      </Link>
    </div>
  );
}

const styles: any = {
  input: { padding: 10, marginBottom: 10, borderRadius: 6, border: "1px solid #ccc", width: "100%" },
  row: { display: "flex", gap: 10, alignItems: "center", marginBottom: 10 },
  addBtn: { padding: 10, width: "100%", borderRadius: 6, border: "none", background: "#007bff", color: "white", cursor: "pointer", marginBottom: 10 },
  removeBtn: { background: "red", color: "white", border: "none", padding: 6, borderRadius: 5, cursor: "pointer" },
  submitBtn: { background: "green", color: "white", width: "100%", padding: 14, borderRadius: 6, border: "none", cursor: "pointer", marginBottom: 20 },
  card: { padding: 14, borderRadius: 8, marginBottom: 12 },
  header: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  actions: { display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" },
  btn: { padding: "6px 12px", borderRadius: 6, border: "none", color: "white", cursor: "pointer" },
  exportBtn: { background: "green", color: "white", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" },
  backBtn: { display: "block", marginTop: 20, textAlign: "center", background: "white", padding: 12, borderRadius: 20, textDecoration: "none", fontWeight: 500 },
};
