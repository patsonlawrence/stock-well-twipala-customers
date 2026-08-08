"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Product {
  id: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
}
export default function SupervisorDashboard() {

  const router = useRouter();
const [username, setUsername] = useState("User");
const [products, setProducts] = useState<Product[]>([]);  
  
  // -------------------------
    // Firestore real-time listener
    // -------------------------
    useEffect(() => {
  // -------------------------
  // Products listener
  // -------------------------

  const productsQuery = query(
    collection(db, "products"),
    orderBy("productName", "asc")
  );

  const unsubscribeProducts = onSnapshot(
    productsQuery,
    (snapshot) => {
      const productData = snapshot.docs.map((productDoc) => ({
        id: productDoc.id,
        ...productDoc.data(),
      })) as Product[];

      setProducts(productData);
    }
  );

  // -------------------------
  // Auth + Username
  // -------------------------

  const unsubscribeAuth = auth.onAuthStateChanged(
    async (user) => {
      if (!user) {
        setUsername("User");
        return;
      }

      console.log("Supervisor logged in:", user.email);
      console.log("Supervisor UID:", user.uid);

      try {
        const usersRef = collection(db, "users");

        const userQuery = query(
          usersRef,
          where("uid", "==", user.uid)
        );

        const userSnapshot = await getDocs(userQuery);

        if (!userSnapshot.empty) {
          const userData =
            userSnapshot.docs[0].data();

          console.log("Supervisor user data:", userData);

          setUsername(
            userData.username || "User"
          );
        } else {
          // Fallback if no users document is found
          setUsername(
            user.displayName ||
              user.email?.split("@")[0] ||
              "User"
          );
        }
      } catch (error) {
        console.error(
          "Failed to load supervisor username:",
          error
        );

        setUsername(
          user.displayName ||
            user.email?.split("@")[0] ||
            "User"
        );
      }
    }
  );

  return () => {
    unsubscribeProducts();
    unsubscribeAuth();
  };
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
  const handleLogout = async () => {
  try {
    await auth.signOut();

    localStorage.clear();

    router.push("/login");
  } catch (error) {
    console.error("Logout failed:", error);
    alert("Logout failed.");
  }
};
  const filteredProducts = products.filter((product) =>
  product.productName
    .toLowerCase()
    .includes(searchTerm.toLowerCase())
);

  return (
  <div className="min-h-screen bg-blue-50 p-8">

    {/* Header */}
    <header className="bg-white shadow rounded-xl p-6 mb-8 flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-blue-700">
          🛡️ Supervisor Dashboard
        </h1>

        <p className="text-gray-500 mt-1">
          Welcome, {username}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-gray-500">
          {new Date().toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          })}
        </span>

        <div className="w-10 h-10 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>


    {/* Team Stats Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">

      <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
        <h2 className="text-sm text-gray-400">
          Team Orders Completed
        </h2>

        <p className="text-2xl font-bold text-blue-700">
          37
        </p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
        <h2 className="text-sm text-gray-400">
          Total Targets
        </h2>

        <p className="text-2xl font-bold text-blue-700">
          53
        </p>
      </div>

      <div className="bg-white shadow rounded-xl p-6 hover:scale-105 transform transition">
        <h2 className="text-sm text-gray-400">
          Pending Tasks
        </h2>

        <p className="text-2xl font-bold text-blue-700">
          {pendingTasks.length}
        </p>
      </div>

    </div>


    {/* Search */}
    <div className="mb-4">
      <input
        type="text"
        placeholder="Search products..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="
          w-full md:w-80
          px-4 py-2
          border rounded-lg
          bg-white
          text-black
          border-gray-300
          focus:outline-none
          focus:ring-2
          focus:ring-blue-500
        "
      />
    </div>


    {/* Product Table */}
    <div className="bg-white shadow rounded-xl p-6 mb-8">

      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-700">
            Inventory
          </h2>

          <p className="text-sm text-gray-500">
            Showing {filteredProducts.length} of{" "}
            {products.length} products
          </p>
        </div>
      </div>


      {filteredProducts.length === 0 ? (

        <div className="text-center py-10 text-gray-500">
          No products found.
        </div>

      ) : (

        <div className="overflow-x-auto">

          <table className="min-w-full">

            <thead>
              <tr className="border-b">

                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Product
                </th>

                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">
                  Quantity
                </th>

                <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">
                  Price
                </th>

              </tr>
            </thead>

            <tbody>

              {filteredProducts.map((product) => (

                <tr
                  key={product.id}
                  className="
                    border-b
                    hover:bg-blue-50
                    transition
                  "
                >

                  <td className="px-4 py-3 font-medium text-gray-800">
                    {product.productName}
                  </td>

                  <td className="px-4 py-3 text-center text-gray-700">
                    {product.productQty}
                  </td>

                  <td className="px-4 py-3 text-right font-medium text-gray-800">
                    Ush{" "}
                    {Number(
                      product.ProductPrice
                    ).toLocaleString("en-UG", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      )}

    </div>


    {/* Team Performance */}
    <div className="bg-white shadow rounded-xl p-6 mb-8">

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Team Performance
      </h2>

      <div className="overflow-x-auto">

        <table className="min-w-full divide-y divide-gray-200">

          <thead>
            <tr>

              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Name
              </th>

              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Orders Completed
              </th>

              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Target
              </th>

              <th className="px-4 py-2 text-left text-sm font-medium text-gray-500">
                Progress
              </th>

            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">

            {teamPerformance.map((member) => {

              const progress = Math.min(
                (member.orders / member.target) * 100,
                100
              );

              return (
                <tr key={member.id}>

                  <td className="px-4 py-2">
                    {member.name}
                  </td>

                  <td className="px-4 py-2">
                    {member.orders}
                  </td>

                  <td className="px-4 py-2">
                    {member.target}
                  </td>

                  <td className="px-4 py-2">

                    <div className="w-full bg-gray-200 rounded-full h-2.5">

                      <div
                        className="bg-blue-500 h-2.5 rounded-full"
                        style={{
                          width: `${progress}%`,
                        }}
                      />

                    </div>

                  </td>

                </tr>
              );

            })}

          </tbody>

        </table>

      </div>

    </div>


    {/* Pending Tasks */}
    <div className="bg-white shadow rounded-xl p-6 mb-8">

      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Pending Tasks
      </h2>

      <ul className="space-y-3">

        {pendingTasks.map((task) => (

          <li
            key={task.id}
            className="
              flex justify-between
              bg-blue-50
              rounded-lg
              p-4
              shadow
              hover:bg-blue-100
              transition
            "
          >

            <span>
              {task.task}
            </span>

            <span className="text-gray-400 text-sm">
              {task.time}
            </span>

          </li>

        ))}

      </ul>

    </div>


    {/* Quick Actions */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

      <button
        type="button"
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition"
      >
        Assign Tasks
      </button>

      <button
        type="button"
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition"
      >
        Approve Orders
      </button>

      <button
        type="button"
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition"
      >
        View Reports
      </button>

      <button
        type="button"
        className="bg-blue-100 hover:bg-blue-200 text-blue-700 py-3 rounded-xl shadow transition"
      >
        Team Performance
      </button>

      <button
        type="button"
        onClick={handleLogout}
        className="bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl shadow"
      >
        Logout
      </button>

    </div>

  </div>
);
}