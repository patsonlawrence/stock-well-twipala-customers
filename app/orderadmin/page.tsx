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

type Item = {
  productId: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
};

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

function WhatsAppIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="w-5 h-5"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.53 0 .2 5.33.2 11.88c0 2.09.55 4.13 1.6 5.93L.1 24l6.35-1.66a11.9 11.9 0 0 0 5.63 1.43h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.24-6.16-3.45-8.41ZM12.09 21.75h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.77.99 1.01-3.68-.23-.38a9.84 9.84 0 0 1-1.51-5.21C2.19 6.46 6.62 2.03 12.09 2.03c2.65 0 5.14 1.03 7.01 2.9a9.85 9.85 0 0 1 2.9 7.02c0 5.47-4.43 9.8-9.91 9.8Zm5.41-7.35c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.79-1.67-2.09-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.08 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z" />
    </svg>
  );
}

export default function AdminOrderPage() {

  // --- STATES ---
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const [customer, setCustomer] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [orderedItems, setOrderedItems] = useState<Item[]>([{ productId: "", productName: "", productQty: 1, ProductPrice: 0 }]);
  
  const [productList, setProductList] = useState<Item[]>([]);
  const [customersList, setCustomersList] = useState<string[]>([]);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [activeItemSearch, setActiveItemSearch] = useState<number | null>(null);
const [itemSearches, setItemSearches] = useState<Record<number, string>>({});


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

  

const selectProduct = (index: number, product: Item) => {
  setOrderedItems((prev) => {
    const newItems = [...prev];

    newItems[index] = {
      ...newItems[index],
      productId: product.productId,
      productName: product.productName,
      ProductPrice: Number(product.ProductPrice) || 0,
    };

    return newItems;
  });

  setItemSearch(index, product.productName);
  setActiveItemSearch(null);
};

  const getItemSearch = (index: number) =>
  itemSearches[index] ?? "";

const setItemSearch = (index: number, value: string) => {
  setItemSearches((prev) => ({
    ...prev,
    [index]: value,
  }));
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
  const addItem = () => {
  setOrderedItems((prev) => [
    ...prev,
    {
      productId: "",
      productName: "",
      productQty: 1,
      ProductPrice: 0,
    },
  ]);
};
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
      setOrderedItems([
  {
    productId: "",
    productName: "",
    productQty: 1,
    ProductPrice: 0
  }
]);

setItemSearches({});
setActiveItemSearch(null);
      
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

  const searches: Record<number, string> = {};

  order.orderedItems.forEach((item, index) => {
    searches[index] = item.productName;
  });

  setItemSearches(searches);

  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
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
    const waURL = `https://wa.me/?text=${encodeURIComponent(
  lines.join("\n")
)}`;
    window.open(waURL, "_blank");
  };

  // --- NEW UI ---
return (
  <ProtectedRoute allowedRoles={["admin", "superuser", "manager"]}>
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">

        {/* =========================================================
            PAGE HEADER
        ========================================================= */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
              <Link
                href="/dashboard/admindashboard"
                className="transition hover:text-green-600"
              >
                Dashboard
              </Link>

              <span>/</span>

              <span className="text-slate-700">
                Orders
              </span>
            </div>

            <div className="flex items-center gap-4">

              <div className="
                flex h-14 w-14 shrink-0 items-center justify-center
                rounded-2xl
                bg-green-600
                text-white
                shadow-lg
                shadow-green-600/20
              ">
                <span className="text-2xl">🛒</span>
              </div>

              <div>
                <h1 className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                ">
                  Orders
                </h1>

                <p className="mt-1 text-sm text-slate-500 sm:text-base">
                  Create customer orders, allocate inventory and track fulfilment.
                </p>
              </div>

            </div>
          </div>


          {/* SUMMARY */}
          <div className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-white
            px-4
            py-3
            shadow-sm
          ">

            <div className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              bg-green-50
              text-green-600
            ">
              ✓
            </div>

            <div>
              <p className="text-xs font-medium text-slate-400">
                Displayed orders
              </p>

              <p className="font-bold text-slate-800">
                {filteredOrders.length}
              </p>
            </div>

          </div>

        </div>


        {/* =========================================================
            CREATE ORDER WORKSPACE
        ========================================================= */}
        <section className="
          overflow-hidden
          rounded-3xl
          border
          border-slate-200
          bg-white
          shadow-sm
        ">

          {/* FORM HEADER */}
          <div className="
            border-b
            border-slate-200
            bg-gradient-to-r
            from-slate-950
            via-slate-900
            to-slate-800
            px-5
            py-6
            text-white
            sm:px-8
          ">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-4">

                <div className="
                  flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-xl
                  bg-white/10
                  ring-1
                  ring-white/10
                ">
                  +
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">

                    <h2 className="text-xl font-bold sm:text-2xl">
                      {editingId
                        ? "Edit Order"
                        : "Create New Order"}
                    </h2>

                    <span className="
                      rounded-full
                      bg-green-500/15
                      px-3
                      py-1
                      text-[11px]
                      font-bold
                      uppercase
                      tracking-wider
                      text-green-300
                      ring-1
                      ring-green-400/20
                    ">
                      {editingId ? "Editing" : "New Order"}
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-slate-400">
                    Build the order and allocate products from available stock.
                  </p>
                </div>

              </div>

              <div className="hidden text-right sm:block">
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Items
                </p>

                <p className="text-xl font-bold">
                  {orderedItems.length}
                </p>
              </div>

            </div>

          </div>


          {/* FORM CONTENT */}
          <div className="p-5 sm:p-8">

            {/* =====================================================
                ORDER DETAILS
            ===================================================== */}
            <div className="mb-8">

              <div className="mb-4">
                <h3 className="font-bold text-slate-900">
                  Order Details
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Select the customer and enter their order reference.
                </p>
              </div>


              <div className="grid gap-5 lg:grid-cols-2">

                {/* CUSTOMER */}
                <div>
                  <label className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                  ">
                    Customer Outlet
                  </label>

                  <div className="relative">

                    <div className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      left-0
                      flex
                      w-12
                      items-center
                      justify-center
                      text-slate-400
                    ">
                      🏪
                    </div>

                    <select
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      className="
                        w-full
                        appearance-none
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-11
                        text-sm
                        font-semibold
                        text-slate-800
                        outline-none
                        transition
                        hover:border-slate-300
                        focus:border-green-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-green-500/10
                      "
                    >
                      <option value="">
                        Select customer outlet...
                      </option>

                      {customersList.map((c, idx) => (
                        <option key={idx} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>

                    <div className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      right-0
                      flex
                      w-12
                      items-center
                      justify-center
                      text-slate-400
                    ">
                      ▼
                    </div>

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    The outlet receiving this order.
                  </p>
                </div>


                {/* ORDER NUMBER */}
                <div>
                  <label className="
                    mb-2
                    block
                    text-sm
                    font-semibold
                    text-slate-700
                  ">
                    Order Number
                  </label>

                  <div className="relative">

                    <div className="
                      pointer-events-none
                      absolute
                      inset-y-0
                      left-0
                      flex
                      w-12
                      items-center
                      justify-center
                      text-slate-400
                    ">
                      #
                    </div>

                    <input
                      value={orderNumber}
                      onChange={(e) => setOrderNumber(e.target.value)}
                      placeholder="ORD-001"
                      className="
                        w-full
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50
                        py-3.5
                        pl-12
                        pr-4
                        text-sm
                        font-semibold
                        text-slate-800
                        outline-none
                        transition
                        placeholder:text-slate-400
                        hover:border-slate-300
                        focus:border-green-500
                        focus:bg-white
                        focus:ring-4
                        focus:ring-green-500/10
                      "
                    />

                  </div>

                  <p className="mt-2 text-xs text-slate-400">
                    Customer's purchase/order reference.
                  </p>
                </div>

              </div>
            </div>


            {/* =====================================================
                PRODUCTS
            ===================================================== */}
            <div>

              <div className="
                mb-4
                flex
                flex-col
                gap-3
                sm:flex-row
                sm:items-end
                sm:justify-between
              ">

                <div>
                  <h3 className="font-bold text-slate-900">
                    Products
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Search inventory and add products to the order.
                  </p>
                </div>

                <div className="
                  inline-flex
                  w-fit
                  items-center
                  gap-2
                  rounded-full
                  bg-slate-100
                  px-3
                  py-1.5
                  text-xs
                  font-bold
                  text-slate-600
                ">
                  <span className="h-2 w-2 rounded-full bg-green-500" />
                  {orderedItems.length}{" "}
                  {orderedItems.length === 1
                    ? "product"
                    : "products"}
                </div>

              </div>


              {/* PRODUCT LIST */}
              <div className="space-y-3">

                {orderedItems.map((it, idx) => {

                  const searchValue =
                    itemSearches[idx] ?? "";

                  const matchingProducts =
                    productList
                      .filter((p) =>
                        p.productName
                          .toLowerCase()
                          .includes(searchValue.toLowerCase())
                      )
                      .slice(0, 30);

                  const subtotal =
                    (Number(it.productQty) || 0) *
                    (Number(it.ProductPrice) || 0);

                  return (
                    <div
                      key={idx}
                      className="
                        rounded-2xl
                        border
                        border-slate-200
                        bg-slate-50/60
                        p-4
                        transition
                        hover:border-slate-300
                        sm:p-5
                      "
                    >

                      {/* ITEM TOP */}
                      <div className="
                        mb-4
                        flex
                        items-center
                        justify-between
                      ">

                        <div className="flex items-center gap-3">

                          <div className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-lg
                            bg-slate-900
                            text-xs
                            font-bold
                            text-white
                          ">
                            {idx + 1}
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-800">
                              Order Item
                            </p>

                            <p className="text-xs text-slate-400">
                              Select product and quantity
                            </p>
                          </div>

                        </div>

                        {orderedItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeItem(idx)}
                            className="
                              rounded-lg
                              px-3
                              py-2
                              text-xs
                              font-bold
                              text-red-500
                              transition
                              hover:bg-red-50
                              hover:text-red-600
                            "
                          >
                            Remove
                          </button>
                        )}

                      </div>


                      {/* PRODUCT + QUANTITY */}
                      <div className="
                        grid
                        gap-4
                        lg:grid-cols-[minmax(0,1fr)_150px_180px]
                        lg:items-end
                      ">

                        {/* PRODUCT */}
                        <div className="relative">

                          <label className="
                            mb-2
                            block
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Product
                          </label>

                          <div className="relative">

                            <span className="
                              pointer-events-none
                              absolute
                              inset-y-0
                              left-0
                              flex
                              w-11
                              items-center
                              justify-center
                              text-slate-400
                            ">
                              🔎
                            </span>

                            <input
                              type="text"
                              value={searchValue}
                              placeholder="Search product..."
                              onFocus={() =>
                                setActiveItemSearch(idx)
                              }
                              onChange={(e) => {
                                setItemSearch(
                                  idx,
                                  e.target.value
                                );

                                setActiveItemSearch(idx);
                              }}
                              className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                py-3
                                pl-11
                                pr-4
                                text-sm
                                font-medium
                                outline-none
                                transition
                                focus:border-green-500
                                focus:ring-4
                                focus:ring-green-500/10
                              "
                            />

                          </div>


                          {/* SEARCH DROPDOWN */}
                          {activeItemSearch === idx && (
                            <div className="
                              absolute
                              left-0
                              right-0
                              top-full
                              z-50
                              mt-2
                              max-h-72
                              overflow-y-auto
                              rounded-2xl
                              border
                              border-slate-200
                              bg-white
                              shadow-2xl
                              ring-1
                              ring-black/5
                            ">

                              {matchingProducts.map((p) => {

                                const stock =
                                  Number(p.productQty) || 0;

                                const price =
                                  Number(p.ProductPrice) || 0;

                                return (
                                  <button
                                    type="button"
                                    key={p.productId}
                                    onClick={() =>
                                      selectProduct(idx, p)
                                    }
                                    className="
                                      w-full
                                      border-b
                                      border-slate-100
                                      px-4
                                      py-3.5
                                      text-left
                                      transition
                                      last:border-0
                                      hover:bg-green-50
                                    "
                                  >

                                    <div className="
                                      flex
                                      items-start
                                      justify-between
                                      gap-4
                                    ">

                                      <div className="min-w-0">

                                        <p className="
                                          truncate
                                          text-sm
                                          font-bold
                                          text-slate-800
                                        ">
                                          {p.productName}
                                        </p>

                                        <p className="
                                          mt-1
                                          text-xs
                                          text-slate-400
                                        ">
                                          UGX {price.toLocaleString()}
                                        </p>

                                      </div>

                                      <span
                                        className={`
                                          shrink-0
                                          rounded-full
                                          px-2.5
                                          py-1
                                          text-[11px]
                                          font-bold
                                          ${
                                            stock > 0
                                              ? "bg-green-50 text-green-700"
                                              : "bg-red-50 text-red-600"
                                          }
                                        `}
                                      >
                                        {stock > 0
                                          ? `${stock} available`
                                          : "Out of stock"}
                                      </span>

                                    </div>

                                  </button>
                                );
                              })}


                              {matchingProducts.length === 0 && (
                                <div className="px-5 py-8 text-center">
                                  <div className="text-2xl">
                                    🔎
                                  </div>

                                  <p className="
                                    mt-2
                                    text-sm
                                    font-semibold
                                    text-slate-700
                                  ">
                                    No products found
                                  </p>

                                  <p className="
                                    mt-1
                                    text-xs
                                    text-slate-400
                                  ">
                                    Try another product name.
                                  </p>
                                </div>
                              )}

                            </div>
                          )}


                          {/* SELECTED PRODUCT */}
                          {it.productName && (
                            <div className="
                              mt-2
                              flex
                              items-center
                              justify-between
                              gap-3
                              rounded-xl
                              border
                              border-green-100
                              bg-green-50
                              px-3
                              py-2.5
                            ">

                              <div className="min-w-0">
                                <p className="
                                  truncate
                                  text-xs
                                  font-bold
                                  text-green-800
                                ">
                                  {it.productName}
                                </p>

                                <p className="
                                  mt-0.5
                                  text-[11px]
                                  text-green-600
                                ">
                                  Selected product
                                </p>
                              </div>

                              <span className="
                                shrink-0
                                text-xs
                                font-black
                                text-green-700
                              ">
                                UGX{" "}
                                {Number(
                                  it.ProductPrice || 0
                                ).toLocaleString()}
                              </span>

                            </div>
                          )}

                        </div>


                        {/* QUANTITY */}
                        <div>

                          <label className="
                            mb-2
                            block
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Quantity
                          </label>

                          <input
                            type="number"
                            min={1}
                            value={it.productQty}
                            onChange={(e) =>
                              updateItem(
                                idx,
                                "productQty",
                                Math.max(
                                  1,
                                  Number(e.target.value)
                                )
                              )
                            }
                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              px-4
                              py-3
                              text-center
                              text-sm
                              font-black
                              text-slate-800
                              outline-none
                              focus:border-green-500
                              focus:ring-4
                              focus:ring-green-500/10
                            "
                          />

                        </div>


                        {/* SUBTOTAL */}
                        <div>

                          <label className="
                            mb-2
                            block
                            text-xs
                            font-bold
                            uppercase
                            tracking-wide
                            text-slate-500
                          ">
                            Subtotal
                          </label>

                          <div className="
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-3
                            text-right
                          ">
                            <p className="
                              text-sm
                              font-black
                              text-slate-900
                            ">
                              UGX {subtotal.toLocaleString()}
                            </p>
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>


              {/* ADD ITEM */}
              <button
                type="button"
                onClick={addItem}
                className="
                  mt-4
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-2xl
                  border
                  border-dashed
                  border-green-300
                  bg-green-50
                  py-3.5
                  text-sm
                  font-bold
                  text-green-700
                  transition
                  hover:border-green-400
                  hover:bg-green-100
                "
              >
                <span className="text-lg">
                  +
                </span>

                Add Another Product
              </button>

            </div>


            {/* =====================================================
                ORDER SUMMARY
            ===================================================== */}
            <div className="
              mt-8
              grid
              gap-5
              lg:grid-cols-[1fr_380px]
              lg:items-end
            ">

              <div className="
                hidden
                rounded-2xl
                border
                border-slate-200
                bg-slate-50
                p-5
                lg:block
              ">
                <p className="text-sm font-bold text-slate-800">
                  Order ready?
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Review the customer, products and quantities before saving.
                </p>
              </div>


              <div className="
                rounded-2xl
                border
                border-green-200
                bg-gradient-to-br
                from-green-50
                to-emerald-50
                p-5
              ">

                <div className="
                  flex
                  items-center
                  justify-between
                  gap-4
                ">

                  <div>
                    <p className="text-sm font-semibold text-slate-500">
                      Order Total
                    </p>

                    <p className="
                      mt-1
                      text-xs
                      text-slate-400
                    ">
                      {orderedItems.length}{" "}
                      {orderedItems.length === 1
                        ? "product"
                        : "products"}
                    </p>
                  </div>

                  <p className="
                    text-2xl
                    font-black
                    tracking-tight
                    text-green-700
                    sm:text-3xl
                  ">
                    UGX {orderTotal.toLocaleString()}
                  </p>

                </div>

              </div>

            </div>


            {/* SAVE */}
            <button
              type="button"
              onClick={handleSubmit}
              className="
                mt-4
                flex
                w-full
                items-center
                justify-center
                gap-2
                rounded-2xl
                bg-green-600
                py-4
                text-sm
                font-black
                text-white
                shadow-lg
                shadow-green-600/20
                transition
                hover:bg-green-700
                hover:shadow-xl
                active:scale-[0.99]
              "
            >
              <span>
                {editingId ? "✓" : "+"}
              </span>

              {editingId
                ? "Update Order"
                : "Save Order"}
            </button>

          </div>
        </section>


        {/* =========================================================
            ORDER HISTORY HEADER
        ========================================================= */}
        <section className="mt-10">

          <div className="
            mb-5
            flex
            flex-col
            gap-4
            lg:flex-row
            lg:items-end
            lg:justify-between
          ">

            <div>
              <p className="
                text-xs
                font-bold
                uppercase
                tracking-widest
                text-green-600
              ">
                Order Management
              </p>

              <h2 className="
                mt-1
                text-2xl
                font-black
                tracking-tight
                text-slate-900
              ">
                Order History
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Review, manage and export customer orders.
              </p>
            </div>


            {/* TOTAL */}
            <div className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              px-5
              py-3
              shadow-sm
            ">
              <p className="text-xs font-medium text-slate-400">
                Displayed order value
              </p>

              <p className="
                mt-0.5
                text-lg
                font-black
                text-slate-900
              ">
                UGX {monthlyTotal.toLocaleString()}
              </p>
            </div>

          </div>


          {/* =======================================================
              FILTER TOOLBAR
          ======================================================= */}
          <div className="
            mb-5
            flex
            flex-col
            gap-3
            rounded-2xl
            border
            border-slate-200
            bg-white
            p-3
            shadow-sm
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div className="flex flex-wrap gap-2">

              {[
                ["all", "All Orders"],
                ["pending", "Pending"],
                ["resolved", "Resolved"],
              ].map(([value, label]) => {

                const active =
                  statusFilter === value;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(value as any)
                    }
                    className={`
                      rounded-xl
                      px-4
                      py-2.5
                      text-sm
                      font-bold
                      transition
                      ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}

            </div>


            <button
              type="button"
              onClick={exportCSV}
              className="
                flex
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-green-600
                px-5
                py-2.5
                text-sm
                font-bold
                text-white
                transition
                hover:bg-green-700
              "
            >
              ↓
              Export CSV
            </button>

          </div>


          {/* =======================================================
              LOADING
          ======================================================= */}
       {loading && (
  <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
    <div
      className="
        mx-auto
        mb-4
        h-9
        w-9
        animate-spin
        rounded-full
        border-4
        border-slate-200
        border-t-green-600
      "
      aria-label="Loading"
    />

    <p className="text-sm font-semibold text-slate-700">
      Loading orders...
    </p>

    <p className="mt-1 text-xs text-slate-400">
      Please wait while your orders are being loaded.
    </p>
  </div>
)}

          {/* =======================================================
              MOBILE ORDERS
          ======================================================= */}
          {!loading && (
            <div className="md:hidden space-y-3">

              {filteredOrders.map((o, index) => {

                const createdAt =
                  o.createdAt
                    ?.toDate?.()
                    ?.toLocaleDateString() || "N/A";

                return (
                  <article
                    key={o.OrderId}
                    className="
                      overflow-hidden
                      rounded-2xl
                      border
                      border-slate-200
                      bg-white
                      shadow-sm
                    "
                  >

                    <div className="p-4">

                      <div className="
                        flex
                        items-start
                        justify-between
                        gap-3
                      ">

                        <div className="min-w-0">

                          <p className="
                            text-[11px]
                            font-bold
                            uppercase
                            tracking-wider
                            text-slate-400
                          ">
                            Order #{index + 1}
                          </p>

                          <h3 className="
                            mt-1
                            truncate
                            text-base
                            font-black
                            text-slate-900
                          ">
                            {o.customer}
                          </h3>

                          <p className="
                            mt-0.5
                            text-sm
                            text-slate-500
                          ">
                            #{o.orderNumber}
                          </p>

                        </div>


                        <span className={`
                          shrink-0
                          rounded-full
                          px-3
                          py-1.5
                          text-[11px]
                          font-bold
                          ${
                            o.resolved
                              ? "bg-green-50 text-green-700"
                              : "bg-orange-50 text-orange-700"
                          }
                        `}>
                          {o.resolved
                            ? "Resolved"
                            : "Pending"}
                        </span>

                      </div>


                      {/* TOTAL + DATE */}
                      <div className="
                        mt-4
                        grid
                        grid-cols-2
                        gap-2
                      ">

                        <div className="
                          rounded-xl
                          bg-green-50
                          p-3
                        ">
                          <p className="
                            text-[11px]
                            font-medium
                            text-green-600
                          ">
                            Total
                          </p>

                          <p className="
                            mt-1
                            text-sm
                            font-black
                            text-green-700
                          ">
                            UGX{" "}
                            {o.orderTotal?.toLocaleString()}
                          </p>
                        </div>

                        <div className="
                          rounded-xl
                          bg-slate-50
                          p-3
                        ">
                          <p className="
                            text-[11px]
                            font-medium
                            text-slate-400
                          ">
                            Date
                          </p>

                          <p className="
                            mt-1
                            text-sm
                            font-bold
                            text-slate-700
                          ">
                            {createdAt}
                          </p>
                        </div>

                      </div>


                      {/* ITEMS */}
                      <div className="mt-4">

                        <p className="
                          mb-2
                          text-xs
                          font-bold
                          uppercase
                          tracking-wide
                          text-slate-400
                        ">
                          Items
                        </p>

                        <div className="divide-y divide-slate-100">

                          {o.orderedItems.map(
                            (item, itemIndex) => (
                              <div
                                key={itemIndex}
                                className="
                                  flex
                                  items-center
                                  justify-between
                                  gap-3
                                  py-2.5
                                  text-sm
                                "
                              >

                                <span className="
                                  min-w-0
                                  truncate
                                  text-slate-700
                                ">
                                  {item.productName}
                                  {" × "}
                                  {item.productQty}
                                </span>

                                <span className="
                                  shrink-0
                                  font-bold
                                  text-slate-800
                                ">
                                  UGX{" "}
                                  {(
                                    item.productQty *
                                    item.ProductPrice
                                  ).toLocaleString()}
                                </span>

                              </div>
                            )
                          )}

                        </div>
                      </div>

                    </div>


                    {/* ACTIONS */}
                    <div className="
                      grid
                      grid-cols-4
                      gap-px
                      border-t
                      border-slate-200
                      bg-slate-200
                    ">

                      <button
                        type="button"
                        onClick={() => toggleResolved(o)}
                        title={
                          o.resolved
                            ? "Mark unresolved"
                            : "Mark resolved"
                        }
                        className="
                          bg-white
                          py-3
                          text-sm
                          font-bold
                          text-green-600
                          transition
                          hover:bg-green-50
                        "
                      >
                        ✓
                      </button>

                      <button
                        type="button"
                        onClick={() => editOrder(o)}
                        title="Edit order"
                        className="
                          bg-white
                          py-3
                          text-sm
                          font-bold
                          text-blue-600
                          transition
                          hover:bg-blue-50
                        "
                      >
                        ✏
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteOrder(o.OrderId)
                        }
                        title="Delete order"
                        className="
                          bg-white
                          py-3
                          text-sm
                          font-bold
                          text-red-600
                          transition
                          hover:bg-red-50
                        "
                      >
                        🗑
                      </button>

                      <button
                        type="button"
                        onClick={() => sendToWhatsApp(o)}
                        title="Send order to WhatsApp"
                        aria-label={`Send order ${o.orderNumber} to WhatsApp`}
                        className="
                          flex
                          items-center
                          justify-center
                          bg-white
                          py-3
                          text-green-700
                          transition
                          hover:bg-green-50
                        "
                      >
                        <WhatsAppIcon />
                      </button>

                    </div>

                  </article>
                );
              })}

            </div>
          )}


          {/* =======================================================
              DESKTOP TABLE
          ======================================================= */}
          {!loading && (
            <div className="
              hidden
              overflow-hidden
              rounded-2xl
              border
              border-slate-200
              bg-white
              shadow-sm
              md:block
            ">

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>
                    <tr className="
                      border-b
                      border-slate-200
                      bg-slate-50
                    ">

                      <th className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        #
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Customer
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Order
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-right
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Total
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Status
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-left
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Date
                      </th>

                      <th className="
                        px-5
                        py-4
                        text-center
                        text-xs
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                      ">
                        Actions
                      </th>

                    </tr>
                  </thead>


                  <tbody className="divide-y divide-slate-100">

                    {filteredOrders.map((o, index) => {

                      const createdAt =
                        o.createdAt
                          ?.toDate?.()
                          ?.toLocaleDateString() || "N/A";

                      return (
                        <tr
                          key={o.OrderId}
                          className="
                            group
                            transition
                            hover:bg-slate-50
                          "
                        >

                          <td className="
                            whitespace-nowrap
                            px-5
                            py-4
                            text-sm
                            font-semibold
                            text-slate-400
                          ">
                            {index + 1}
                          </td>


                          <td className="px-5 py-4">

                            <div>
                              <p className="
                                font-bold
                                text-slate-800
                              ">
                                {o.customer}
                              </p>

                              <p className="
                                mt-0.5
                                text-xs
                                text-slate-400
                              ">
                                {o.orderedItems?.length || 0}{" "}
                                items
                              </p>
                            </div>

                          </td>


                          <td className="px-5 py-4">

                            <span className="
                              rounded-lg
                              bg-slate-100
                              px-2.5
                              py-1.5
                              text-xs
                              font-bold
                              text-slate-600
                            ">
                              #{o.orderNumber}
                            </span>

                          </td>


                          <td className="
                            whitespace-nowrap
                            px-5
                            py-4
                            text-right
                          ">
                            <span className="
                              font-black
                              text-slate-900
                            ">
                              UGX{" "}
                              {o.orderTotal?.toLocaleString()}
                            </span>
                          </td>


                          <td className="
                            px-5
                            py-4
                            text-center
                          ">

                            <span className={`
                              inline-flex
                              items-center
                              gap-2
                              rounded-full
                              px-3
                              py-1.5
                              text-xs
                              font-bold
                              ${
                                o.resolved
                                  ? "bg-green-50 text-green-700"
                                  : "bg-orange-50 text-orange-700"
                              }
                            `}>

                              <span className={`
                                h-1.5
                                w-1.5
                                rounded-full
                                ${
                                  o.resolved
                                    ? "bg-green-500"
                                    : "bg-orange-500"
                                }
                              `} />

                              {o.resolved
                                ? "Resolved"
                                : "Pending"}

                            </span>

                          </td>


                          <td className="
                            whitespace-nowrap
                            px-5
                            py-4
                            text-sm
                            font-medium
                            text-slate-500
                          ">
                            {createdAt}
                          </td>


                          <td className="px-5 py-4">

                            <div className="
                              flex
                              justify-center
                              gap-1.5
                            ">

                              <button
                                type="button"
                                onClick={() =>
                                  toggleResolved(o)
                                }
                                title={
                                  o.resolved
                                    ? "Mark unresolved"
                                    : "Mark resolved"
                                }
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-green-50
                                  text-green-600
                                  transition
                                  hover:bg-green-100
                                "
                              >
                                ✓
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  editOrder(o)
                                }
                                title="Edit order"
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-blue-50
                                  text-blue-600
                                  transition
                                  hover:bg-blue-100
                                "
                              >
                                ✏
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  deleteOrder(o.OrderId)
                                }
                                title="Delete order"
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-red-50
                                  text-red-600
                                  transition
                                  hover:bg-red-100
                                "
                              >
                                🗑
                              </button>


                              <button
                                type="button"
                                onClick={() =>
                                  sendToWhatsApp(o)
                                }
                                title="Send order to WhatsApp"
                                aria-label={`Send order ${o.orderNumber} to WhatsApp`}
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-lg
                                  bg-green-50
                                  text-green-700
                                  transition
                                  hover:bg-green-100
                                "
                              >
                                <WhatsAppIcon />
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>


                {/* EMPTY STATE */}
                {filteredOrders.length === 0 && (
                  <div className="px-6 py-16 text-center">

                    <div className="
                      mx-auto
                      flex
                      h-14
                      w-14
                      items-center
                      justify-center
                      rounded-2xl
                      bg-slate-100
                      text-2xl
                    ">
                      📦
                    </div>

                    <h3 className="
                      mt-4
                      font-bold
                      text-slate-800
                    ">
                      No orders found
                    </h3>

                    <p className="
                      mx-auto
                      mt-1
                      max-w-sm
                      text-sm
                      text-slate-400
                    ">
                      There are no orders matching the current filter.
                    </p>

                  </div>
                )}

              </div>

            </div>
          )}

        </section>


        {/* BACK */}
        <div className="mt-8 flex justify-center">

          <Link
            href="/dashboard/admindashboard"
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-5
              py-3
              text-sm
              font-bold
              text-slate-600
              shadow-sm
              transition
              hover:border-slate-300
              hover:bg-slate-50
              hover:text-slate-900
            "
          >
            ← Back to Dashboard
          </Link>

        </div>

      </div>
      </main>      
    </ProtectedRoute>
  );
}