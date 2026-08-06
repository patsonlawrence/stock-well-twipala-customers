"use client";

import { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { useRouter } from "next/navigation";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);
import ProtectedRoute from "@/app/components/ProtectedRoute";
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const router = useRouter();

  const users = [
    { id: 1, name: "Alice Johnson", role: "manager", lastLogin: "2025-11-22" },
    { id: 2, name: "Bob Smith", role: "superuser", lastLogin: "2025-11-21" },
    { id: 3, name: "Charlie Lee", role: "sales", lastLogin: "2025-11-20" },
  ];

  const salesData = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        label: "Orders",
        data: [12, 19, 15, 22, 18, 25, 20],
        borderColor: "#7F3DFF",
        backgroundColor: "rgba(127,61,255,0.1)",
        tension: 0.4,
      },
    ],
  };

  useEffect(() => {
    setUsername(localStorage.getItem("userName") || "User");
  }, []);

  const handleLogout = () => {
    router.push("/");
  };

  return (
    <ProtectedRoute allowedRoles={["admin","superuser"]}>
    <div className="min-h-screen bg-gray-100 font-sans md:flex">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-purple-700 text-white p-6 transform
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        transition-transform duration-200
        md:static md:translate-x-0 md:flex md:flex-col`}
      >
        {/* Mobile close */}
        <button
          className="md:hidden mb-6 text-xl"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>

        <nav className="flex-1">
          <ul className="space-y-4">
            <li><a href="/admin/inventory" className="hover:text-purple-200">📦 Inventory</a></li>
            <li><a href="/users" className="hover:text-purple-200">👥 Users</a></li>
            <li><a href="/salesoutlets" className="hover:text-purple-200">🏪 Outlets</a></li>
            <li><a href="/orderadmin" className="hover:text-purple-200">🧾 Orders</a></li>
            <li><a href="/locationMerchandiser" className="hover:text-purple-200">🧾 Locations</a></li>
          </ul>
        </nav>

        <button
          onClick={handleLogout}
          className="mt-6 w-full bg-red-600 hover:bg-purple-500 py-2 rounded-md"
        >
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8">
        {/* Mobile header */}
        <div className="flex items-center justify-between mb-6 md:hidden">
          <button onClick={() => setSidebarOpen(true)} className="text-2xl">
            ☰
          </button>
          <span className="font-semibold text-gray-700">Admin Dashboard</span>
        </div>

        <h1 className="text-3xl font-bold text-gray-700 mb-1">
          Admin Dashboard
        </h1>
        <p className="text-orange-600 font-medium mb-6">
          Welcome, {username}
        </p>

        {/* Chart */}
        <div className="bg-white shadow rounded-xl p-4 md:p-6 mb-8">
          <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">
            Weekly Orders
          </h2>
          <div className="h-64">
            <Line
              data={salesData}
              options={{ responsive: true, maintainAspectRatio: false }}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-xl p-4 overflow-x-auto">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">
            Recent Users
          </h2>
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-gray-500">Name</th>
                <th className="px-3 py-2 text-left text-gray-500">Role</th>
                <th className="px-3 py-2 text-left text-gray-500">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-3 py-2 whitespace-nowrap">{user.name}</td>
                  <td className="px-3 py-2">{user.role}</td>
                  <td className="px-3 py-2">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
    </ProtectedRoute>
  );
}
