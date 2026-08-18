"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function ManagerDashboard() {
  const router = useRouter();

const [username, setUsername] = useState("User");
  const [tasks, setTasks] = useState([
    { id: 1, title: "Approve Orders", completed: false },
    { id: 2, title: "Review Inventory Report", completed: true },
    { id: 3, title: "Team Meeting at 3 PM", completed: false },
  ]);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) {
      setUsername("User");
      return;
    }

    try {
      const usersRef = collection(db, "users");

      const userQuery = query(
        usersRef,
        where("uid", "==", user.uid)
      );

      const userSnapshot = await getDocs(userQuery);

      if (!userSnapshot.empty) {
        const userData = userSnapshot.docs[0].data();

        setUsername(userData.username || "User");
      } else {
        setUsername(
          user.displayName ||
            user.email?.split("@")[0] ||
            "User"
        );
      }
    } catch (error) {
      console.error("Failed to load username:", error);

      setUsername(
        user.displayName ||
          user.email?.split("@")[0] ||
          "User"
      );
    }
  });

  return () => unsubscribe();
}, []);

  const handleLogout = async () => {
  try {
    await signOut(auth);

    localStorage.clear();

    router.push("/login");
  } catch (error) {
    console.error(error);
    alert("Logout failed.");
  }
};

  const toggleTask = (id: number) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  return (
    <div className="p-8 bg-gradient-to-b from-purple-50 to-white min-h-screen font-sans">
      {/* Header */}
      <header className="bg-white shadow-lg rounded-xl p-6 mb-8 flex justify-between items-center">
  <div>
    <h1 className="text-3xl font-bold text-purple-700">
      Manager Dashboard
    </h1>

    <p className="text-gray-500 mt-1">
      Welcome, {username}
    </p>
  </div>

  <div className="flex items-center gap-4">
    <div className="w-10 h-10 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold">
      {username.charAt(0).toUpperCase()}
    </div>

    <button
      onClick={handleLogout}
      className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg shadow"
    >
      Logout
    </button>
  </div>
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
          <a href="/admin/mgrInventory" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
            Inventory
          </a>
          <a href="/orderadmin" className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition">
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
