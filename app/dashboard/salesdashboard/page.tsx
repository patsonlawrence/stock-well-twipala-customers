"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { orderBy } from "firebase/firestore";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// -------------------------
// Types
// -------------------------
interface Item {
  name: string;
  qty: number;
  price: number;
}

interface Order {
  id?: string;
  createdAt?: any;
  customer?: string;
  items?: Item[];
  orderNumber?: string;
  orderedBy?: string;
  total?: number;
  username?: string;
}

interface Client {
  id: string;
  name: string;
  orders: number;
}
interface ChartDataType {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}
interface Product {
  id: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
}


export default function SalesDashboard() {
  const router = useRouter();
  const auth = getAuth();

  // -------------------------
  // States
  // -------------------------
  const [username, setUsername] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const [weeklyOrders, setWeeklyOrders] = useState(0);
  const [monthlyOrders, setMonthlyOrders] = useState(0);
  const [yearlyOrders, setYearlyOrders] = useState(0);

  const [revenueTotals, setRevenueTotals] = useState({
    week: 0,
    month: 0,
    year: 0,
    lifetime: 0,
  });

  const [topClients, setTopClients] = useState<Client[]>([]);
  const [topProducts, setTopProducts] = useState<Record<string, number>>({});

  
const [products, setProducts] = useState<Product[]>([]);
const productsRef = collection(db, "products");




  // -------------------------
  // Load username & dark mode
  // -------------------------
  useEffect(() => {
    setUsername(localStorage.getItem("userName") || "User");
    setDarkMode(localStorage.getItem("darkMode") === "true");
  }, []);

  const toggleDarkMode = () => {
    const updated = !darkMode;
    setDarkMode(updated);
    localStorage.setItem("darkMode", updated.toString());
  };

  // -------------------------
  // Firestore real-time listener
  // -------------------------
  useEffect(() => {
const productsQuery = query(
  collection(db, "products"),
  //where("productQty", ">", 0),
  orderBy("productName", "asc")
);
const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
  const productData = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];

  setProducts(productData);
});

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) return;

      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("orderedBy", "==", user.email));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: Order[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        calculateStats(orders);
        calculateTopClients(orders);
        calculateTopProducts(orders);        
      });

      return () => unsubscribe(); unsubscribeProducts();
    });

    return () => unsubscribeAuth();
  }, []);

  // -------------------------
  // FIXED STAT CALCULATOR
  // -------------------------
  const calculateStats = (orders: Order[]) => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());

    let week = 0,
      month = 0,
      year = 0;

    let revenueWeek = 0,
      revenueMonth = 0,
      revenueYear = 0,
      revenueLifetime = 0;

    orders.forEach((order) => {
      const date = order.createdAt?.toDate
        ? order.createdAt.toDate()
        : new Date(order.createdAt || 0);

      const total = order.total || 0;

      if (date >= startOfWeek) {
        week++;
        revenueWeek += total;
      }
      if (date >= startOfMonth) {
        month++;
        revenueMonth += total;
      }
      if (date >= startOfYear) {
        year++;
        revenueYear += total;
      }

      revenueLifetime += total;
    });

    setWeeklyOrders(week);
    setMonthlyOrders(month);
    setYearlyOrders(year);
    setRevenueTotals({
      week: revenueWeek,
      month: revenueMonth,
      year: revenueYear,
      lifetime: revenueLifetime,
    });
  };

  // -------------------------
  // Top Clients
  // -------------------------
  const calculateTopClients = (orders: Order[]) => {
    const clientMap: Record<string, number> = {};

    orders.forEach((order) => {
      const name = order.customer || "Unknown";
      clientMap[name] = (clientMap[name] || 0) + 1;
    });

    const cleaned = Object.entries(clientMap)
      .map(([name, count]) => ({ id: name, name, orders: count }))
      .sort((a, b) => b.orders - a.orders)
      .slice(0, 5);

    setTopClients(cleaned);
  };

  // -------------------------
  // Top Products
  // -------------------------
  const calculateTopProducts = (orders: Order[]) => {
    const map: Record<string, number> = {};

    orders.forEach((order) => {
      order.items?.forEach((item) => {
        map[item.name] = (map[item.name] || 0) + item.qty;
      });
    });

    const sorted = Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const results: Record<string, number> = {};
    sorted.forEach(([name, qty]) => (results[name] = qty));

    setTopProducts(results);
  };
 

  

  // -------------------------
  // Logout
  // -------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };

  // -------------------------
  // UI
  // -------------------------
  const filteredProducts = products.filter((product) =>
  product.productName
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);
  return (
    <div
      className={
        darkMode
          ? "min-h-screen bg-gray-900 text-white p-8"
          : "min-h-screen bg-green-50 p-8"
      }
    >
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-green-700 dark:text-green-400">
            💼 Sales Dashboard
          </h1>
          <p className="text-blue-600 dark:text-blue-400 mt-1">
            Welcome, {username}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={toggleDarkMode}
            className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded"
          >
            {darkMode ? "Light Mode" : "Dark Mode"}
          </button>

          <span className="text-gray-600 dark:text-gray-300">
  {new Date()
    .toLocaleDateString("en-US", {
      month: "short",   // Nov
      day: "2-digit",   // 28
      year: "numeric",  // 2025
    })
    .replace(" ", ", ")}
</span>


          <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center">
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: "This Week's Orders",
            count: weeklyOrders,
            revenue: revenueTotals.week,
          },
          {
            title: "This Month's Orders",
            count: monthlyOrders,
            revenue: revenueTotals.month,
          },
          {
            title: "This Year's Orders",
            count: yearlyOrders,
            revenue: revenueTotals.year,
          },
        ].map((s) => (
          <div
            key={s.title}
            className="bg-white dark:bg-gray-800 shadow rounded-xl p-6"
          >
            <h2 className="text-sm text-gray-400 dark:text-gray-300">
              {s.title}
            </h2>
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">
              {s.count} Orders
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Revenue: ${s.revenue.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-4">
  <input
    type="text"
    placeholder="Search products..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    className="w-full md:w-80 px-4 py-2 border rounded-lg
               bg-white dark:bg-gray-700
               text-black dark:text-white
               border-gray-300 dark:border-gray-600
               focus:outline-none focus:ring-2 focus:ring-green-500"
  />
</div>

      {/* Product Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Inventory</h2>
  <p className="mt-1 text-slate-600">
                      Showing{" "}
                      <span className="font-bold text-slate-900">
                        {filteredProducts.length}
                      </span>{" "}
                      products
                    </p>

  {filteredProducts.length === 0 ? (
  <p className="text-gray-500">
    No matching products found.
  </p>
) : (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="text-left py-3">Product Name</th>
            <th className="text-center py-3">Stock</th>
            <th className="text-right py-3">Price</th>
          </tr>
        </thead>

        <tbody>
          {filteredProducts.map((product) => (
            <tr
              key={product.id}
              className="border-b dark:border-gray-700 hover:bg-green-50 dark:hover:bg-gray-700"
            >
              <td className="py-3">{product.productName}</td>
              <td className="text-center">{product.productQty}</td>
              <td className="text-right">
  Ush {Number(product.ProductPrice).toLocaleString("en-UG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}
</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm font-semibold text-slate-600">
                    Showing{" "}
                    <span className="text-slate-900 font-extrabold">
                      {filteredProducts.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-900 font-extrabold">
                      {products.length}
                    </span>{" "}
                    products
                  </p>
    </div>
  )}
</div>

      {/* Top Clients */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Clients</h2>
        {topClients.length === 0 ? (
          <p className="text-gray-500">No clients yet.</p>
        ) : (
          <ul className="space-y-3">
            {topClients.map((client) => (
              <li
                key={client.id}
                className="flex justify-between bg-green-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <span>{client.name}</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  {client.orders} orders
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Top Products</h2>
        {Object.keys(topProducts).length === 0 ? (
          <p className="text-gray-500">No products yet.</p>
        ) : (
          <ul className="space-y-3">
            {Object.entries(topProducts).map(([name, qty]) => (
              <li
                key={name}
                className="flex justify-between bg-green-50 dark:bg-gray-700 rounded-lg p-4"
              >
                <span>{name}</span>
                <span className="font-bold text-green-700 dark:text-green-400">
                  {qty} sold
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link href="/order" className="block">
          <button className="w-full bg-green-100 dark:bg-gray-700 py-3 rounded-xl shadow">
            Add Order
          </button>
        </Link>

        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
