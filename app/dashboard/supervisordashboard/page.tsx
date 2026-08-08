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
import { auth, db } from "@/lib/firebase";
import { getAuth } from "firebase/auth";
import { orderBy } from "firebase/firestore";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

interface Product {
  id: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
}
export default function SupervisorDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const productsRef = collection(db, "products");

  // -------------------------
    // Firestore real-time listener
    // -------------------------
    useEffect(() => {
  const productsQuery = query(
  collection(db, "products"),
  where("productQty", ">", 0),
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
  
        
  
        return () => unsubscribeProducts();
      });
  
      return () => unsubscribeAuth();
    }, []);

  // Team performance summary
  const [teamPerformance, setTeamPerformance] = useState([
    { id: 1, name: "Alice", orders: 15, target: 20 },
    { id: 2, name: "Bob", orders: 12, target: 18 },
    { id: 3, name: "Charlie", orders: 10, target: 15 },
  ]);

  const weeklyOrdersData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders Completed by Team",
        data: [20, 25, 18, 30, 22, 28, 26],
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59,130,246,0.1)",
        tension: 0.3,
      },
    ],
  };

  const pendingTasks = [
    { id: 1, task: "Approve order #123", time: "2h ago" },
    { id: 2, task: "Review report Q4", time: "4h ago" },
    { id: 3, task: "Assign new leads", time: "6h ago" },
  ];
  

  // -------------------------
  // Logout
  // -------------------------
  const [searchTerm, setSearchTerm] = useState("");
  const handleLogout = () => {
    localStorage.clear();
    router.push("/");
  };
  const filteredProducts = products.filter((product) =>
  product.productName
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  return (
    <div className="min-h-screen bg-blue-50 font-sans p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-blue-700">🛡️ Supervisor Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-500">Nov 22, 2025</span>
          <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">P</div>
          
        </div>
      </header>

      {/* Team Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Team Orders Completed</h2>
          <p className="text-2xl font-bold text-blue-700">37</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Total Targets</h2>
          <p className="text-2xl font-bold text-blue-700">53</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Pending Tasks</h2>
          <p className="text-2xl font-bold text-blue-700">{pendingTasks.length}</p>
        </div>
      </div>

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


      {/* Team Performance Table */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Team Performance</h2>
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Orders Completed</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Target</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Progress</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {teamPerformance.map((member) => {
              const progress = Math.min((member.orders / member.target) * 100, 100);
              return (
                <tr key={member.id}>
                  <td className="px-4 py-2">{member.name}</td>
                  <td className="px-4 py-2">{member.orders}</td>
                  <td className="px-4 py-2">{member.target}</td>
                  <td className="px-4 py-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pending Tasks */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Pending Tasks</h2>
        <ul className="space-y-3">
          {pendingTasks.map((task) => (
            <li key={task.id} className="flex justify-between bg-blue-50 rounded-lg p-4 shadow hover:bg-blue-100 transition">
              <span>{task.task}</span>
              <span className="text-gray-400 text-sm">{task.time}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition">Assign Tasks</button>
        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition">Approve Orders</button>
        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition">View Reports</button>
        <button className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition">Team Performance</button>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow"
          >
            Logout
          </button>
      </div>
    </div>
  );
}
