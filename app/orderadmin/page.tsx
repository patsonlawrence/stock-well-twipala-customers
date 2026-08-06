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

import ProtectedRoute from "@/app/components/ProtectedRoute";

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
  const [orderSearch, setOrderSearch] = useState("");
  const pendingOrders = orders.filter((o) => !o.resolved).length;

const resolvedOrders = orders.filter((o) => o.resolved).length;

const totalRevenue = orders
  .filter((o) => o.resolved)
  .reduce((sum, o) => sum + (o.orderTotal || 0), 0);
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

  const customerMatch =
    o.customer
      .toLowerCase()
      .includes(orderSearch.toLowerCase());

  const statusMatch =
    statusFilter === "all"
      ? true
      : statusFilter === "resolved"
      ? o.resolved
      : !o.resolved;


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
    alert("Failed to update order. Please try again.");
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
    <ProtectedRoute allowedRoles={["admin","superuser"]}>
<div className="min-h-screen bg-slate-100">

    {/* HEADER */}

    <header className="bg-white border-b shadow-sm">

        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-bold text-slate-800">
                    Order Management
                </h1>
                <p className="text-slate-500 mt-1">
                    Create, track and resolve customer orders
                </p>
            </div>

            <div className="flex gap-3">

                <Link
                    href="/dashboard/admindashboard"
                    className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition"
                >
                    Dashboard
                </Link>
                <Link
                    href="/dashboard/admininventory"
                    className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white transition"
                >
                    Inventory
                </Link>
            </div>
        </div>
    </header>    

    <main className="max-w-7xl mx-auto px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="text-slate-500">Total Orders</p>
            <h2 className="text-4xl font-bold mt-2">
            {orders.length}
            </h2>
        </div>
            <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-500">Pending Orders</p>  
            <h2 className="text-4xl font-bold text-orange-500 mt-2">{pendingOrders}</h2>
            </div>
            <div className="bg-white rounded-2xl shadow p-6">
            <p className="text-slate-500">Resolved Orders</p>          
            <h2 className="text-4xl font-bold text-green-600 mt-2">{resolvedOrders}</h2>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <p className="text-slate-500">
            Revenue
        </p>
        <h2 className="text-3xl font-bold text-green-700 mt-2">
            UGX {totalRevenue.toLocaleString()}
        </h2>
      </div>

</div>
<div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
      <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-800">
              {editingId ? "Edit Order" : "Create New Order"}
          </h2>
          <p className="text-slate-500 mt-2">
            Create customer orders and manage inventory allocation.
          </p>
      </div>
      <label className="block text-sm font-semibold text-slate-700 mb-2">
        Customer Outlet
      </label>

    <select
    value={customer}
    onChange={(e) => setCustomer(e.target.value)}
    className="
flex-1
rounded-xl
border
border-slate-300
px-4
py-3
outline-none
focus:ring-2
focus:ring-green-500
    "
>
        <option value="">Select Outlet...</option>
        {customersList.map((c, idx) => (
          <option key={idx} value={c}>
            {c}
          </option>
        ))}
      </select>

      <label className="block text-sm font-semibold text-slate-700 mb-2">
    Order Number
</label>

<input

placeholder="Example: ORD-001"

value={orderNumber}

onChange={(e)=>setOrderNumber(e.target.value)}

className="
w-full
rounded-xl
border
border-slate-300
px-4
py-3
mb-5
outline-none
focus:ring-2
focus:ring-green-500
"

/>

      <input
        style={styles.input}
        placeholder="Search item..."
        value={searchItem}
        onChange={(e) => setSearchItem(e.target.value)}
      />

      {orderedItems.map((it, idx) => (

<div
key={idx}
className="
flex
gap-3
items-center
bg-slate-50
p-4
rounded-xl
mb-3
border
"
>
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
    {p.productName} - 
    {(Number(p.ProductPrice) || 0).toLocaleString()} UGX
    {p.productQty > 0 ? " (In stock)" : " (Out of stock)"}
</option>
              ))}
          </select>
          <input
            type="number"
            min={1}
            className="
w-24
rounded-xl
border
border-slate-300
px-3
py-3
text-center
"
            value={it.productQty}
            onChange={(e) => updateItem(idx, "productQty", Number(e.target.value))}
          />
          <button

className="
bg-red-500
hover:bg-red-600
text-white
rounded-xl
px-4
py-3
transition
"
 onClick={() => removeItem(idx)}>
            ✖
          </button>
        </div>
        
      ))}

      <button

onClick={addItem}

className="
w-full
bg-blue-600
hover:bg-blue-700
text-white
font-semibold
py-3
rounded-xl
transition
mb-6
"

>
        ➕ Add Item
      </button>

      <div className="
bg-green-50
border
border-green-200
rounded-xl
p-5
mb-5
">

<p className="text-slate-500">
Order Total
</p>

<h3 className="
text-3xl
font-bold
text-green-700
">

UGX {orderTotal.toLocaleString()}

</h3>

</div>

      <button

onClick={handleSubmit}

className="
w-full
bg-green-600
hover:bg-green-700
text-white
font-bold
py-4
rounded-xl
transition
"

>
        {editingId ? "Update Order" : "Save Order"}
      </button>

      <div className="
bg-white
rounded-2xl
shadow
border
p-6
mb-6
">
</div>

<div className="
flex
flex-col
md:flex-row
gap-4
justify-between
items-center
">


<input

placeholder="Search customer..."

value={orderSearch}

onChange={(e)=>setOrderSearch(e.target.value)}

className="
w-full
md:w-80
rounded-xl
border
px-4
py-3
outline-none
focus:ring-2
focus:ring-green-500
"

/>


<select

value={statusFilter}

onChange={(e)=>setStatusFilter(e.target.value as any)}

className="
rounded-xl
border
px-4
py-3
"

>

<option value="all">
All Orders
</option>

<option value="pending">
Pending
</option>

<option value="resolved">
Resolved
</option>

</select>


<button

onClick={exportCSV}

className="
bg-green-600
hover:bg-green-700
text-white
px-5
py-3
rounded-xl
transition
"

>

Export CSV

</button>


</div>


</div>

      <h3>💰 Total of displayed orders: {monthlyTotal.toLocaleString()} UGX</h3>

      {loading && <p>Loading...</p>}
      <div
className="
bg-white
rounded-2xl
shadow
border
overflow-hidden
"
>
            <div className="
bg-white
rounded-2xl
shadow
border
overflow-hidden
">


<table className="w-full">

<thead className="bg-slate-50">

<tr>

<th className="p-4 text-left">
#
</th>

<th className="p-4 text-left">
Customer
</th>

<th className="p-4 text-left">
Order No
</th>

<th className="p-4 text-right">
Total
</th>

<th className="p-4 text-center">
Status
</th>

<th className="p-4 text-left">
Date
</th>

<th className="p-4 text-center">
Actions
</th>

</tr>

</thead>


<tbody>


{filteredOrders.map((o,index)=>{


const createdAt =
o.createdAt?.toDate?.()?.toLocaleDateString()
|| "N/A";


return (

<tr

key={o.OrderId}

className="
border-t
hover:bg-slate-50
transition
"


>


<td className="p-4">
{index+1}
</td>


<td className="p-4 font-semibold">

{o.customer}

</td>


<td className="p-4">

#{o.orderNumber}

</td>


<td className="p-4 text-right font-semibold">

UGX {o.orderTotal?.toLocaleString()}

</td>


<td className="p-4 text-center">


{o.resolved ? (

<span className="
bg-green-100
text-green-700
px-3
py-1
rounded-full
text-sm
font-semibold
">

Resolved

</span>

):(


<span className="
bg-orange-100
text-orange-700
px-3
py-1
rounded-full
text-sm
font-semibold
">

Pending

</span>


)}


</td>


<td className="p-4">

{createdAt}

</td>



<td className="p-4">


<div className="
flex
justify-center
gap-2
">


<button

onClick={()=>toggleResolved(o)}

className="
bg-green-600
hover:bg-green-700
text-white
px-3
py-2
rounded-lg
"

>

✓

</button>



<button

onClick={()=>editOrder(o)}

className="
bg-blue-600
hover:bg-blue-700
text-white
px-3
py-2
rounded-lg
"

>

✏

</button>



<button

onClick={()=>deleteOrder(o.OrderId)}

className="
bg-red-600
hover:bg-red-700
text-white
px-3
py-2
rounded-lg
"

>

🗑

</button>

<button
onClick={()=>sendToWhatsApp(o)}
className="
bg-green-800
hover:bg-green-900
text-white
px-3
py-2
rounded-lg
"

>

📲

</button>
</div>
</td>
</tr>
)
})}

</tbody>
</table>
</div>
      <Link href="/dashboard/admindashboard" style={styles.backBtn}>
        Back to Dashboard
      </Link>
        </div>     
        
        
</main>
</div>
</ProtectedRoute>
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
