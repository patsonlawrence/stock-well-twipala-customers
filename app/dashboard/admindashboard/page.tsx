"use client";

import { useState } from "react";
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([
    { id: 1, name: "Alice Johnson", role: "manager", lastLogin: "2025-11-22" },
    { id: 2, name: "Bob Smith", role: "superuser", lastLogin: "2025-11-21" },
    { id: 3, name: "Charlie Lee", role: "sales", lastLogin: "2025-11-20" },
  ]);

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

  const handleLogout = () => {
    // If using Firebase Auth, you would call signOut(auth) here
    console.log("User logged out");
    router.push("/"); // redirect to home page
  };

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-purple-700 text-white flex flex-col p-6">
        <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
        <nav className="flex-1">
          <ul className="space-y-4">
            <li>
              <a href="/admin/inventory" className="hover:text-purple-200">📦 Inventory</a>
            </li>
            <li>
              <a href="/admin/users" className="hover:text-purple-200">👥 Users</a>
            </li>
          </ul>
        </nav>
        {/* Logout Button */}
        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full bg-purple-600 hover:bg-purple-500 py-2 rounded-md"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <h1 className="text-3xl font-bold text-gray-700 mb-6">Admin Dashboard</h1>

        {/* Chart */}
        <div className="bg-white shadow rounded-xl p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Weekly Orders</h2>
          <Line data={salesData} />
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Recent Users</h2>
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Role</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">Last Login</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2">{user.name}</td>
                  <td className="px-4 py-2">{user.role}</td>
                  <td className="px-4 py-2">{user.lastLogin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
