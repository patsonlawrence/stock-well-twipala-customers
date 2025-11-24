"use client";

import { useState } from "react";

export default function ManagerDashboard() {
  const [tasks, setTasks] = useState([
    { id: 1, title: "Approve Orders", completed: false },
    { id: 2, title: "Review Inventory Report", completed: true },
    { id: 3, title: "Team Meeting at 3 PM", completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="p-8 bg-gradient-to-b from-purple-50 to-white min-h-screen font-sans">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-purple-700 mb-2">👋 Welcome, Manager!</h1>
        <p className="text-purple-400">Here's what's happening today.</p>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white shadow-lg rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Total Orders</h2>
          <p className="text-2xl font-bold text-purple-700">124</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Pending Tasks</h2>
          <p className="text-2xl font-bold text-purple-700">5</p>
        </div>
        <div className="bg-white shadow-lg rounded-xl p-6 hover:scale-105 transform transition">
          <h2 className="text-sm text-gray-400">Team Members</h2>
          <p className="text-2xl font-bold text-purple-700">8</p>
        </div>
      </div>

      {/* Tasks */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-purple-700 mb-4">📝 Tasks</h2>
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between bg-white p-4 rounded-xl shadow hover:bg-purple-50 transition`}
            >
              <span className={`${task.completed ? "line-through text-gray-400" : ""}`}>
                {task.title}
              </span>
              <button
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  task.completed
                    ? "bg-green-100 text-green-700"
                    : "bg-purple-100 text-purple-700"
                }`}
                onClick={() => toggleTask(task.id)}
              >
                {task.completed ? "Done ✅" : "Mark Done"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-xl font-semibold text-purple-700 mb-4">🔗 Quick Links</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a href="/admin/inventory" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
            Inventory
          </a>
          <a href="/order" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
            Orders
          </a>
          <a href="/reports" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
            Reports
          </a>
          <a href="/team" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
            Team
          </a>
        </div>
      </section>
    </div>
  );
}
