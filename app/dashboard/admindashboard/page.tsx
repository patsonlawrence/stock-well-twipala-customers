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
  TooltipItem,
  Scale,
  Filler
} from "chart.js";

import { useRouter } from "next/navigation";

import {
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  orderBy,
  Timestamp,
} from "firebase/firestore";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { db } from "@/lib/firebase";

import ProtectedRoute from "@/app/components/ProtectedRoute";
import Link from "next/link";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);
type Transaction = {
  id: string;
  amount?: number;
  createdAt?: Timestamp;
  reference?: string;
  description?: string;
  type?: string;
  status?: string;
};
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const router = useRouter();

  const [productCount, setProductCount] = useState(0);
const [productsValue, setProductsValue] = useState(0);

const [currentMonthSales, setCurrentMonthSales] = useState(0);
const [previousMonthSales, setPreviousMonthSales] = useState(0);

const [currentYearSales, setCurrentYearSales] = useState(0);
const [previousYearSales, setPreviousYearSales] = useState(0);
  
  // ==========================================
  // GET ADMIN USER
  // ==========================================

  useEffect(() => {
    const auth = getAuth();

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
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
            const userData =
              userSnapshot.docs[0].data();

            setUsername(
              userData.username || "User"
            );
          } else {
            setUsername("User");
          }
        } catch (error) {
          console.error(
            "Failed to load admin username:",
            error
          );

          setUsername("User");
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
  const unsubscribeProducts = onSnapshot(
    collection(db, "products"),
    (snapshot) => {
      let totalValue = 0;

      snapshot.docs.forEach((productDoc) => {
        const product = productDoc.data();

        const price = Number(product.ProductPrice || 0);
        const quantity = Number(product.productQty || 0);

        totalValue += price * quantity;
      });

      setProductCount(snapshot.size);
      setProductsValue(totalValue);
    },
    (error) => {
      console.error("Failed to load products:", error);
    }
  );

  const unsubscribeTransactions = onSnapshot(
    collection(db, "transactions"),
    (snapshot) => {
      const now = new Date();

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const previousMonthDate = new Date(
        currentYear,
        currentMonth - 1,
        1
      );

      const previousMonth = previousMonthDate.getMonth();
      const previousMonthYear =
        previousMonthDate.getFullYear();

      let currentMonthTotal = 0;
      let previousMonthTotal = 0;
      let currentYearTotal = 0;
      let previousYearTotal = 0;

      snapshot.docs.forEach((transactionDoc) => {
        const transaction = transactionDoc.data();

        // Only completed sales count
        if (
          transaction.type !== "sale" 
        ) {
          return;
        }

        const amount = Number(transaction.amount || 0);

        if (!amount) {
          return;
        }

        let date: Date;

        if (transaction.createdAt instanceof Timestamp) {
          date = transaction.createdAt.toDate();
        } else if (transaction.createdAt) {
          date = new Date(transaction.createdAt);
        } else {
          return;
        }

        if (isNaN(date.getTime())) {
          return;
        }

        const transactionMonth = date.getMonth();
        const transactionYear = date.getFullYear();

        // Current month
        if (
          transactionMonth === currentMonth &&
          transactionYear === currentYear
        ) {
          currentMonthTotal += amount;
        }

        // Previous month
        if (
          transactionMonth === previousMonth &&
          transactionYear === previousMonthYear
        ) {
          previousMonthTotal += amount;
        }

        // Current year
        if (transactionYear === currentYear) {
          currentYearTotal += amount;
        }

        // Previous year
        if (transactionYear === currentYear - 1) {
          previousYearTotal += amount;
        }
      });

      setCurrentMonthSales(currentMonthTotal);
      setPreviousMonthSales(previousMonthTotal);

      setCurrentYearSales(currentYearTotal);
      setPreviousYearSales(previousYearTotal);
    },
    (error) => {
      console.error(
        "Failed to load transactions:",
        error
      );
    }
  );

  return () => {
    unsubscribeProducts();
    unsubscribeTransactions();
  };
}, []);

const formatAmount = (amount: number) => {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0,
  }).format(amount);
};

  // ==========================================
  // GET TRANSACTIONS
  // ==========================================

  useEffect(() => {
    const transactionsRef = collection(
      db,
      "transactions"
    );

    const q = query(
      transactionsRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log(
          "Transactions:",
          data
        );

        setTransactions(data);
      },
      (error) => {
        console.error(
          "Failed to load transactions:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // CONVERT FIRESTORE DATE
  // ==========================================

  const getTransactionDate = (
  createdAt?: Timestamp
): Date | null => {
  if (!createdAt) {
    return null;
  }

  return createdAt.toDate();
};

  // ==========================================
  // CREATE MONTHLY TOTALS
  // ==========================================

  const monthlyTotals = new Array(12).fill(0);

  transactions.forEach((transaction) => {
    const amount = Number(
      transaction.amount || 0
    );

    const date = getTransactionDate(
      transaction.createdAt
    );

    if (!date) {
      return;
    }

    const month = date.getMonth();

    monthlyTotals[month] += amount;
  });

  // ==========================================
  // CHART DATA
  // ==========================================

  const salesData = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],

    datasets: [
      {
        label: "Transactions",

        data: monthlyTotals,

        borderColor: "#7F3DFF",

        backgroundColor:
          "rgba(127, 61, 255, 0.1)",

        tension: 0.4,

        fill: true,

        pointBackgroundColor: "#7F3DFF",

        pointBorderColor: "#7F3DFF",

        pointRadius: 4,

        pointHoverRadius: 6,
      },
    ],
  };

  // ==========================================
  // CHART OPTIONS
  // ==========================================

  const chartOptions = {
  responsive: true,

  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: true,
    },

    tooltip: {
      callbacks: {
        label: (context: TooltipItem<"line">) => {
          const value = Number(
            context.raw || 0
          );

          return `UGX ${value.toLocaleString()}`;
        },
      },
    },
  },

  scales: {
    y: {
      beginAtZero: true,

      ticks: {
        callback: function (
          this: Scale,
          value: string | number
        ) {
          return `UGX ${Number(
            value
          ).toLocaleString()}`;
        },
      },
    },
  },
};

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = async () => {
    try {
      const auth = getAuth();

      await signOut(auth);

      localStorage.clear();

      router.push("/login");
    } catch (error) {
      console.error(
        "Logout failed:",
        error
      );

      alert("Logout failed.");
    }
  };

  // ==========================================
  // PAGE
  // ==========================================

  return (
  <ProtectedRoute
    allowedRoles={["admin", "superuser", "manager"]}
  >
    <div className="min-h-screen bg-gray-50 flex">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          w-64
          bg-purple-700
          text-white
          p-6
          transform
          ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }
          transition-transform duration-200
          md:static
          md:translate-x-0
          md:flex
          md:flex-col
        `}
      >
        {/* Mobile close button */}
        <button
          type="button"
          className="md:hidden mb-6 text-xl"
          onClick={() => setSidebarOpen(false)}
        >
          ✕
        </button>

        {/* Logo / title */}
        <h2 className="text-2xl font-bold mb-8">
          Admin Panel
        </h2>

        {/* Navigation */}
        <nav className="flex-1">
          <ul className="space-y-4">

            <li>
              <Link
                href="/admin/inventory"
                className="block hover:text-purple-200 transition"
              >
                📦 Inventory
              </Link>
            </li>

            <li>
              <Link
                href="/users"
                className="block hover:text-purple-200 transition"
              >
                👥 Users
              </Link>
            </li>

            <li>
              <Link
                href="/salesoutlets"
                className="block hover:text-purple-200 transition"
              >
                🏪 Outlets
              </Link>
            </li>

            <li>
              <Link
                href="/orderadmin"
                className="block hover:text-purple-200 transition"
              >
                🧾 Orders
              </Link>
            </li>

            <li>
              <Link
                href="/shipments"
                className="block hover:text-purple-200 transition"
              >
                📦 Shipments
              </Link>
            </li>

            <li>
              <Link
                href="/statements"
                className="block hover:text-purple-200 transition"
              >
                🧾 Statements
              </Link>
            </li>

            <li>
              <Link
                href="/locationMerchandiser"
                className="block hover:text-purple-200 transition"
              >
                📍 Locations
              </Link>
            </li>

            <li>
              <Link
                href="/expenses"
                className="block hover:text-purple-200 transition"
              >
                💸 Expenses
              </Link>
            </li>

          </ul>
        </nav>

        {/* Logout */}
        <button
          type="button"
          onClick={handleLogout}
          className="
            mt-6
            w-full
            bg-red-600
            hover:bg-red-700
            py-2.5
            rounded-md
            font-medium
            transition
          "
        >
          Logout
        </button>
      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main className="flex-1 min-w-0 p-4 md:p-8">

        {/* =====================================================
            MOBILE HEADER
        ===================================================== */}
        <div className="flex items-center justify-between mb-6 md:hidden">

          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-2xl text-gray-700"
          >
            ☰
          </button>

          <span className="font-semibold text-gray-700">
            Admin Dashboard
          </span>

        </div>


        {/* =====================================================
            PAGE HEADING
        ===================================================== */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-700">
            Admin Dashboard
          </h1>

          <p className="text-orange-600 font-medium mt-1">
            Welcome, {username}
          </p>
        </div>


        {/* =====================================================
            MONTHLY TRANSACTIONS CHART
        ===================================================== */}
        <div className="bg-white shadow-sm rounded-xl p-4 md:p-6 mb-8">

          <h2 className="text-lg md:text-xl font-semibold text-gray-700 mb-4">
            Monthly Transactions
          </h2>

          <div className="h-64">
            <Line
              data={salesData}
              options={chartOptions}
            />
          </div>

        </div>


        {/* =====================================================
            COMPANY STATISTICS
        ===================================================== */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 md:p-6">

          {/* Statistics heading */}
          <div className="mb-5">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Company Statistics
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Overview of your products and sales performance
            </p>
          </div>


          {/* =================================================
              STATISTICS CARDS
          ================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">


            {/* =================================================
                PRODUCTS
            ================================================= */}
            <div className="rounded-xl bg-blue-50 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Products
                  </p>

                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {productCount.toLocaleString()}
                  </p>

                  <p className="text-xs text-blue-500 mt-1">
                    Total products
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-blue-100
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  📦
                </div>

              </div>

            </div>


            {/* =================================================
                STOCK VALUE
            ================================================= */}
            <div className="rounded-xl bg-purple-50 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-purple-600 font-medium">
                    Stock Value
                  </p>

                  <p className="text-2xl font-bold text-purple-800 mt-1">
                    {formatAmount(productsValue)}
                  </p>

                  <p className="text-xs text-purple-500 mt-1">
                    Current inventory value
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-purple-100
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  💰
                </div>

              </div>

            </div>


            {/* =================================================
                CURRENT MONTH SALES
            ================================================= */}
            <div className="rounded-xl bg-green-50 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-green-600 font-medium">
                    This Month
                  </p>

                  <p className="text-2xl font-bold text-green-800 mt-1">
                    {formatAmount(currentMonthSales)}
                  </p>

                  <p className="text-xs text-green-500 mt-1">
                    Sales
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-green-100
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  📈
                </div>

              </div>

            </div>


            {/* =================================================
                PREVIOUS MONTH SALES
            ================================================= */}
            <div className="rounded-xl bg-orange-50 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-orange-600 font-medium">
                    Previous Month
                  </p>

                  <p className="text-2xl font-bold text-orange-800 mt-1">
                    {formatAmount(previousMonthSales)}
                  </p>

                  <p className="text-xs text-orange-500 mt-1">
                    Sales
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-orange-100
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  📊
                </div>

              </div>

            </div>


            {/* =================================================
                CURRENT YEAR SALES
            ================================================= */}
            <div className="rounded-xl bg-emerald-50 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-emerald-600 font-medium">
                    This Year
                  </p>

                  <p className="text-2xl font-bold text-emerald-800 mt-1">
                    {formatAmount(currentYearSales)}
                  </p>

                  <p className="text-xs text-emerald-500 mt-1">
                    Sales
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-emerald-100
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  🏆
                </div>

              </div>

            </div>


            {/* =================================================
                PREVIOUS YEAR SALES
            ================================================= */}
            <div className="rounded-xl bg-gray-100 p-5">

              <div className="flex items-center justify-between">

                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Previous Year
                  </p>

                  <p className="text-2xl font-bold text-gray-800 mt-1">
                    {formatAmount(previousYearSales)}
                  </p>

                  <p className="text-xs text-gray-500 mt-1">
                    Sales
                  </p>
                </div>

                <div className="
                  w-11
                  h-11
                  rounded-full
                  bg-gray-200
                  flex
                  items-center
                  justify-center
                  text-xl
                ">
                  📅
                </div>

              </div>

            </div>

          </div>
        </div>

      </main>

    </div>
  </ProtectedRoute>
);
};