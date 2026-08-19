"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface Product {
  id: string;
  productName: string;
  productQty: number;
  ProductPrice: number;
}

interface Transaction {
  id: string;
  status: string;
  payer: string;
  reference: string;
  amount: number;
  createdAt: any;
}

export default function SupervisorDashboard() {
  const router = useRouter();

  const [username, setUsername] = useState("User");
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [salesTransactionCount, setSalesTransactionCount] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [monthlySalary, setMonthlySalary] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [payerFilter, setPayerFilter] = useState("");

  // =====================================================
  // FIRESTORE REAL-TIME LISTENERS
  // =====================================================

  useEffect(() => {
    // -----------------------------------------------------
    // Products listener
    // -----------------------------------------------------

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
      },
      (error) => {
        console.error("Failed to load products:", error);
      }
    );

    // -----------------------------------------------------
    // Sales transactions listener
    // -----------------------------------------------------

    const transactionsQuery = query(
      collection(db, "transactions")
    );

    const unsubscribeTransactions = onSnapshot(
      transactionsQuery,
      (snapshot) => {
        const now = new Date();

        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let transactionCount = 0;
        let totalSales = 0;

        snapshot.docs.forEach((transactionDoc) => {
          const transaction = transactionDoc.data();

          // Only sales
          if (transaction.type !== "sale") {
            return;
          }

          if (!transaction.createdAt) {
            return;
          }

          let transactionDate: Date;

          if (transaction.createdAt?.toDate) {
            transactionDate = transaction.createdAt.toDate();
          } else {
            transactionDate = new Date(transaction.createdAt);
          }

          if (isNaN(transactionDate.getTime())) {
            return;
          }

          // Only current month
          if (
            transactionDate.getMonth() === currentMonth &&
            transactionDate.getFullYear() === currentYear
          ) {
            transactionCount += 1;
            totalSales += Number(transaction.amount || 0);
          }
        });

        const salary = totalSales * 0.01;

        setSalesTransactionCount(transactionCount);
        setMonthlySales(totalSales);
        setMonthlySalary(salary);
      },
      (error) => {
        console.error(
          "Failed to load sales transactions:",
          error
        );
      }
    );

    // -----------------------------------------------------
    // PENDING TRANSACTIONS REAL-TIME LISTENER
    // -----------------------------------------------------

    const pendingTransactionsQuery = query(
      collection(db, "transactions"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribePendingTransactions = onSnapshot(
      pendingTransactionsQuery,
      (snapshot) => {
        const pendingData: Transaction[] = snapshot.docs.map(
          (transactionDoc) => ({
            id: transactionDoc.id,
            ...transactionDoc.data(),
          } as Transaction)
        );

        setTransactions(pendingData);
      },
      (error) => {
        console.error(
          "Failed to load pending transactions:",
          error
        );
      }
    );

    // -----------------------------------------------------
    // Auth + Username
    // -----------------------------------------------------

    const unsubscribeAuth = auth.onAuthStateChanged(
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

    // -----------------------------------------------------
    // Cleanup
    // -----------------------------------------------------

    return () => {
      unsubscribeProducts();
      unsubscribeTransactions();
      unsubscribePendingTransactions();
      unsubscribeAuth();
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

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

  // =====================================================
  // FILTER PRODUCTS
  // =====================================================

  const filteredProducts = products.filter((product) =>
    product.productName
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  // =====================================================
  // PENDING TRANSACTION FILTER
  // =====================================================

  const filteredTransactions = transactions.filter(
    (transaction) => {
      if (!payerFilter) {
        return true;
      }

      return transaction.payer === payerFilter;
    }
  );

  // =====================================================
  // UNIQUE PAYERS
  // =====================================================

  const payers = Array.from(
    new Set(
      transactions
        .map((transaction) => transaction.payer)
        .filter(Boolean)
    )
  );

  // =====================================================
  // DISPLAYED TOTAL
  // =====================================================

  const displayedTransactionTotal =
    filteredTransactions.reduce(
      (total, transaction) =>
        total + Number(transaction.amount || 0),
      0
    );

  // =====================================================
  // DATE FORMATTER
  // =====================================================

  const formatDate = (createdAt: any) => {
    if (!createdAt) {
      return "-";
    }

    try {
      if (createdAt?.toDate) {
        return createdAt.toDate().toLocaleString();
      }

      return new Date(createdAt).toLocaleString();
    } catch {
      return "-";
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 p-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

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


      {/* =====================================================
          SUPERVISOR SALES STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">

        {/* Sales Transactions */}

        <div className="bg-white shadow rounded-xl p-6 hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm text-gray-400">
                Sales Transactions
              </h2>

              <p className="text-2xl font-bold text-blue-700 mt-1">
                {salesTransactionCount.toLocaleString()}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Completed this month
              </p>

            </div>

            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-xl">
              🧾
            </div>

          </div>

        </div>


        {/* Total Sales */}

        <div className="bg-white shadow rounded-xl p-6 hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm text-gray-400">
                Total Sales
              </h2>

              <p className="text-2xl font-bold text-green-600 mt-1">
                UGX{" "}
                {monthlySales.toLocaleString("en-UG")}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                Completed sales this month
              </p>

            </div>

            <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center text-xl">
              💰
            </div>

          </div>

        </div>


        {/* Monthly Salary */}

        <div className="bg-white shadow rounded-xl p-6 hover:shadow-md transition">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-sm text-gray-400">
                Accumulated Monthly Salary
              </h2>

              <p className="text-2xl font-bold text-purple-700 mt-1">
                UGX{" "}
                {monthlySalary.toLocaleString("en-UG")}
              </p>

              <p className="text-xs text-gray-400 mt-1">
                completed sales
              </p>

            </div>

            <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center text-xl">
              💵
            </div>

          </div>

        </div>

      </div>

      {/* =====================================================
          PENDING TRANSACTIONS
      ===================================================== */}

      <div className="bg-white shadow rounded-xl overflow-hidden mb-8">

        {/* Header */}

        <div className="p-6 border-b border-gray-200">

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

            <div>

              <h2 className="text-xl font-semibold text-blue-700">
                Pending UnPaid Transactions
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Transactions awaiting processing
              </p>

            </div>


            {/* Filters + Summary */}

            <div className="flex flex-col sm:flex-row gap-3">

              {/* Payer Filter */}

              <select
                value={payerFilter}
                onChange={(e) =>
                  setPayerFilter(e.target.value)
                }
                className="
                  border border-gray-300
                  rounded-lg
                  px-4 py-2
                  text-sm
                  text-gray-700
                  bg-white
                  focus:outline-none
                  focus:ring-2
                  focus:ring-blue-500
                "
              >

                <option value="">
                  All Payers
                </option>

                {payers.map((payer) => (

                  <option
                    key={payer}
                    value={payer}
                  >
                    {payer}
                  </option>

                ))}

              </select>


              {/* Displayed Total */}

              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg">

                <span className="text-xs block text-blue-500">
                  Displayed Total
                </span>

                <span className="font-bold text-lg">
                  UGX{" "}
                  {displayedTransactionTotal.toLocaleString(
                    "en-UG"
                  )}
                </span>

              </div>


              {/* Transaction Count */}

              <div className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg">

                <span className="text-xs block text-yellow-600">
                  Transactions
                </span>

                <span className="font-bold text-lg">
                  {filteredTransactions.length}
                </span>

              </div>

            </div>

          </div>

        </div>


        {/* Table */}

        {filteredTransactions.length === 0 ? (

          <div className="p-10 text-center text-gray-500">
            No pending UnPaid transactions found.
          </div>

        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-left">

              <thead className="bg-blue-50">

                <tr>

                  <th className="px-6 py-4 text-sm font-semibold text-blue-700">
                    Payer
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-blue-700">
                    Reference
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-blue-700">
                    Amount
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-blue-700">
                    Status
                  </th>

                  <th className="px-6 py-4 text-sm font-semibold text-blue-700">
                    Invoice Date
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-gray-100">

                {filteredTransactions.map(
                  (transaction) => (

                    <tr
                      key={transaction.id}
                      className="
                        hover:bg-blue-50
                        transition
                      "
                    >

                      <td className="px-6 py-4 text-gray-800 font-medium">
                        {transaction.payer || "-"}
                      </td>


                      <td className="px-6 py-4 text-gray-600 font-mono text-sm">
                        {transaction.reference || "-"}
                      </td>


                      <td className="px-6 py-4 text-gray-800 font-semibold">

                        UGX{" "}

                        {Number(
                          transaction.amount || 0
                        ).toLocaleString("en-UG")}

                      </td>


                      <td className="px-6 py-4">

                        <span className="
                          inline-flex
                          px-3 py-1
                          rounded-full
                          text-xs
                          font-semibold
                          bg-yellow-100
                          text-yellow-700
                        ">
                          {transaction.status}
                        </span>

                      </td>


                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {formatDate(
                          transaction.createdAt
                        )}
                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>


      {/* =====================================================
          INVENTORY SEARCH
      ===================================================== */}

      <div className="mb-4">

        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) =>
            setSearchTerm(e.target.value)
          }
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


      {/* =====================================================
          PRODUCT TABLE
      ===================================================== */}

      <div className="bg-white shadow rounded-xl p-6 mb-8">

        <div className="flex justify-between items-center mb-4">

          <div>

            <h2 className="text-xl font-semibold text-gray-700">
              Inventory that needs your attention
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


      

      {/* =====================================================
          QUICK ACTIONS
      ===================================================== */}

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