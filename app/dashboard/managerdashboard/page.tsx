"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, onAuthStateChanged } from "firebase/auth";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

type Transaction = {
  id: string;
  status: string;
  payer: string;
  reference: string;
  amount: number;
  createdAt: any;
};

export default function ManagerDashboard() {
  const router = useRouter();

  const [username, setUsername] = useState("User");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [payerFilter, setPayerFilter] = useState("");

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

  // Load pending transactions
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        setLoadingTransactions(true);

        const transactionsRef = collection(db, "transactions");

        const transactionsQuery = query(
          transactionsRef,
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(transactionsQuery);

        const transactionData: Transaction[] = snapshot.docs.map(
          (doc) => ({
            id: doc.id,
            ...doc.data(),
          } as Transaction)
        );

        setTransactions(transactionData);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setLoadingTransactions(false);
      }
    };

    loadTransactions();
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

  const formatDate = (createdAt: any) => {
    if (!createdAt) return "-";

    try {
      if (createdAt?.toDate) {
        return createdAt.toDate().toLocaleString();
      }

      return new Date(createdAt).toLocaleString();
    } catch {
      return "-";
    }
  };

  const filteredTransactions = transactions.filter((transaction) => {
  if (!payerFilter) return true;

  return transaction.payer === payerFilter;
});

const totalAmount = filteredTransactions.reduce(
  (total, transaction) => total + Number(transaction.amount || 0),
  0
);

const payers = Array.from(
  new Set(
    transactions
      .map((transaction) => transaction.payer)
      .filter(Boolean)
  )
);

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

      {/* Pending Transactions */}
      <section className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
  <div className="p-6 border-b border-gray-200">
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

      <div>
        <h2 className="text-xl font-semibold text-purple-700">
          Pending UnPaid Transactions
        </h2>

        <p className="text-sm text-gray-500 mt-1">
          Transactions awaiting processing
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">

        {/* Payer Filter */}
        <select
          value={payerFilter}
          onChange={(e) => setPayerFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">All Payers</option>

          {payers.map((payer) => (
            <option key={payer} value={payer}>
              {payer}
            </option>
          ))}
        </select>

        {/* Total Amount */}
        <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-lg">
          <span className="text-xs block text-purple-500">
            Displayed Total
          </span>

          <span className="font-bold text-lg">
            {totalAmount.toLocaleString()}
          </span>
        </div>

        {/* Pending Count */}
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

        {loadingTransactions ? (
          <div className="p-8 text-center text-gray-500">
            Loading transactions...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No pending Unpaid transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto">
  <table className="w-full text-left">
    <thead className="bg-purple-50">
      <tr>
        <th className="px-6 py-4 text-sm font-semibold text-purple-700">
          Payer
        </th>

        <th className="px-6 py-4 text-sm font-semibold text-purple-700">
          Reference
        </th>

        <th className="px-6 py-4 text-sm font-semibold text-purple-700">
          Amount
        </th>

        <th className="px-6 py-4 text-sm font-semibold text-purple-700">
          Status
        </th>

        <th className="px-6 py-4 text-sm font-semibold text-purple-700">
          Invoice Date
        </th>
      </tr>
    </thead>

    <tbody className="divide-y divide-gray-100">
      {filteredTransactions.map((transaction) => (
        <tr
          key={transaction.id}
          className="hover:bg-purple-50 transition"
        >
          <td className="px-6 py-4 text-gray-800 font-medium">
            {transaction.payer || "-"}
          </td>

          <td className="px-6 py-4 text-gray-600 font-mono text-sm">
            {transaction.reference || "-"}
          </td>

          <td className="px-6 py-4 text-gray-800 font-semibold">
            {Number(transaction.amount || 0).toLocaleString()}
          </td>

          <td className="px-6 py-4">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
              {transaction.status}
            </span>
          </td>

          <td className="px-6 py-4 text-gray-600 text-sm">
            {formatDate(transaction.createdAt)}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
        )}
      </section>

      {/* Quick Links */}
      <section>
        <h2 className="text-xl font-semibold text-purple-700 mb-4">
          🔗 Quick Links
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <a
            href="/admin/mgrInventory"
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition"
          >
            Inventory
          </a>

          <a            
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition"
          >
            Orders
          </a>

          <a
            href="/reports"
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition"
          >
            Reports
          </a>

          <a
            href="/team"
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 p-4 rounded-xl text-center shadow transition"
          >
            Team
          </a>
        </div>
      </section>
    </div>
  );
}