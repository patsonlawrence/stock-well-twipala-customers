"use client";

import { useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from "chart.js";
import { useRouter } from "next/navigation";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend);

export default function SupervisorDashboard() {
  const router = useRouter();

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

  const handleLogout = () => {
    console.log("Supervisor logged out");
    router.push("/"); // redirect to home or login page
  };

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

      {/* Weekly Team Orders Chart */}
      <div className="bg-white shadow rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Weekly Team Orders</h2>
        <Line data={weeklyOrdersData} />
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
