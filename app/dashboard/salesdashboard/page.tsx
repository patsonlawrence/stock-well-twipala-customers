"use client";

import { useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { useRouter } from "next/navigation";
import Link from "next/link";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function SalesDashboard() {
  const router = useRouter();

  const [salesData, setSalesData] = useState({
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders Completed",
        data: [5, 7, 3, 8, 6, 10, 4],
        borderColor: "#10B981",
        backgroundColor: "rgba(16,185,129,0.1)",
        tension: 0.3,
      },
    ],
  });

  const [topClients, setTopClients] = useState([
    { id: 1, name: "Acme Corp", orders: 12 },
    { id: 2, name: "Beta LLC", orders: 8 },
    { id: 3, name: "Gamma Inc", orders: 5 },
  ]);

  const handleLogout = () => {
    console.log("User logged out");
    router.push("/"); // redirect to home or login page
  };

  return (
    <div className="min-h-screen bg-green-50 font-sans p-8">
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-green-700">💼 Sales Dashboard</h1>
        <div className="flex items-center space-x-4">
          <span className="text-gray-500">
  {new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}
</span>

          <div className="w-10 h-10 rounded-full bg-green-700 text-white flex items-center justify-center font-bold">S</div>
          
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">This Week's Target</h2>
          <p className="text-2xl font-bold text-green-700">50 Orders</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Orders Completed</h2>
          <p className="text-2xl font-bold text-green-700">43</p>
        </div>
        <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Pending Orders</h2>
          <p className="text-2xl font-bold text-green-700">7</p>
        </div>
      </div>

      {/* Orders Chart */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Daily Orders</h2>
        <Line data={salesData} />
      </div>

      {/* Top Clients */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Top Clients</h2>
        <ul className="space-y-3">
          {topClients.map((client) => (
            <li key={client.id} className="flex justify-between bg-green-50 rounded-lg p-4 shadow hover:bg-green-100 transition">
              <span>{client.name}</span>
              <span className="text-green-700 font-medium">{client.orders} Orders</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/admin/orders" className="block">
  <button className="w-full bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-xl shadow transition">
    Add Order
  </button>
</Link>

        <button className="bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-xl shadow transition">View Reports</button>
        <button className="bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-xl shadow transition">Top Products</button>
        <button className="bg-green-100 hover:bg-green-200 text-green-700 py-3 rounded-xl shadow transition">Team Performance</button>
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
