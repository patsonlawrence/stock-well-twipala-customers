"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import ProtectedRoute from "@/app/components/ProtectedRoute";

type Transaction = {
  id: string;
  reference?: string;
  description?: string;
  type?: string;
  status?: string;
  amount?: number;
  payer?: string;
  createdAt?: Timestamp | Date | string | number | null;
};

type Outlet = {
  id: string;
  name?: string;
};

type FormData = {
  reference: string;
  description: string;
  payer: string;
  type: string;
  status: string;
  amount: string;
  transactionDate: string;
};

const emptyForm: FormData = {
  reference: "",
  description: "",
  payer: "",
  type: "payment",
  status: "pending",
  amount: "",
  transactionDate: "",
};

const Statements = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>(emptyForm);

  // =========================
  // LOAD TRANSACTIONS
  // =========================
  useEffect(() => {
    const q = query(
      collection(db, "transactions"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: Transaction[] = snapshot.docs.map((transactionDoc) => ({
          id: transactionDoc.id,
          ...transactionDoc.data(),
        })) as Transaction[];

        setTransactions(data);
        setLoading(false);
      },
      (error) => {
        console.error("Failed to load transactions:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // =========================
  // LOAD OUTLETS
  // =========================
  useEffect(() => {
  const unsubscribe = onSnapshot(
    collection(db, "Outlets"),
    (snapshot) => {
      const data: Outlet[] = snapshot.docs.map<Outlet>((outletDoc) => {
        const outletData = outletDoc.data();

        return {
          id: outletDoc.id,
          name: outletData.name as string,
        };
      });

      setOutlets(data);
    },
    (error) => {
      console.error("Failed to load outlets:", error);
    }
  );

  return () => unsubscribe();
}, []);
  // =========================
  // FORM INPUT
  // =========================
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDateForInput = (
  timestamp?: Timestamp | Date | string | number | null
) => {
  if (!timestamp) {
    return "";
  }

  let date: Date;

  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    date = new Date(timestamp);
  }

  if (isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

  // =========================
  // OPEN NEW TRANSACTION FORM
  // =========================
  const handleNewTransaction = () => {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  setEditingId(null);

  setFormData({
    ...emptyForm,
    status: "pending",
    transactionDate: `${year}-${month}-${day}`,
  });

  setShowForm(true);
};

  // =========================
  // OPEN EDIT FORM
  // =========================
  const handleEdit = (transaction: Transaction) => {
  setEditingId(transaction.id);

  setFormData({
    reference: transaction.reference || "",
    description: transaction.description || "",
    payer: transaction.payer || "",
    type: transaction.type || "payment",
    status: transaction.status || "pending",
    amount:
      transaction.amount !== undefined
        ? String(transaction.amount)
        : "",
    transactionDate: formatDateForInput(
      transaction.createdAt
    ),
  });

  setShowForm(true);

  setTimeout(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, 100);
};

  // =========================
  // CLOSE FORM
  // =========================
  const handleCloseForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyForm);
  };

  // =========================
  // CREATE / UPDATE TRANSACTION
  // =========================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || Number(formData.amount) <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!formData.payer) {
      alert("Please select a payer.");
      return;
    }

    try {
      setSaving(true);

      // =========================
      // EDIT EXISTING TRANSACTION
      // =========================
      if (editingId) {
        const transactionRef = doc(db, "transactions", editingId);

        await updateDoc(transactionRef, {
  reference:
    formData.reference || `TXN-${Date.now()}`,

  description:
    formData.description || "Transaction",

  payer: formData.payer,

  type: formData.type,

  status: formData.status,

  amount: Number(formData.amount),

  createdAt: Timestamp.fromDate(
    new Date(`${formData.transactionDate}T12:00:00`)
  ),
});
      }

      // =========================
      // CREATE NEW TRANSACTION
      // =========================
      else {
        await addDoc(collection(db, "transactions"), {
  reference:
    formData.reference || `TXN-${Date.now()}`,

  description:
    formData.description || "Transaction",

  payer: formData.payer,

  type: formData.type,

  status: formData.status,

  amount: Number(formData.amount),

  createdAt: formData.transactionDate
    ? Timestamp.fromDate(
        new Date(`${formData.transactionDate}T12:00:00`)
      )
    : serverTimestamp(),
});
      }

      handleCloseForm();
    } catch (error) {
      console.error(
        editingId
          ? "Failed to update transaction:"
          : "Failed to create transaction:",
        error
      );

      alert(
        editingId
          ? "Failed to update transaction."
          : "Failed to save transaction."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================
  // FORMAT DATE
  // =========================
  const formatDate = (
    timestamp?: Timestamp | Date | string | number | null
  ) => {
    if (!timestamp) {
      return "Just now";
    }

    let date: Date;

    if (timestamp instanceof Timestamp) {
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // =========================
  // FORMAT MONEY
  // =========================
  const formatAmount = (amount?: number) => {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency: "UGX",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  };

  // =========================
  // SUMMARY
  // =========================
  const totalAmount = transactions.reduce(
  (total, transaction) => {
    const amount = Number(transaction.amount || 0);

    if (
      transaction.type === "refund" ||
      transaction.type === "expense"
    ) {
      return total - amount;
    }

    return total + amount;
  },
  0
);

  const completedTransactions = transactions.filter(
    (transaction) => transaction.status === "completed"
  ).length;

  // =========================
  // STATUS STYLING
  // =========================
  const getTypeClass = (type?: string) => {
  switch (type) {
    case "payment":
      return "bg-green-100 text-green-700";

    case "sale":
      return "bg-blue-100 text-blue-700";

    case "order":
      return "bg-purple-100 text-purple-700";

    case "refund":
      return "bg-orange-100 text-orange-700";

    case "expense":
      return "bg-red-100 text-red-700";

    default:
      return "bg-gray-100 text-gray-700";
  }
};

  const getStatusClass = (status?: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      case "failed":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (      
      <div className="flex items-center justify-center min-h-[300px]">
        <p className="text-gray-500">
          Loading statements...
        </p>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["admin","superuser","manager"]}>
    <div className="p-4 md:p-6">
      {/* ================= HEADER ================= */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
  <div>
    <h1 className="text-2xl font-bold text-gray-800">
      Statements
    </h1>

    <p className="text-gray-500 mt-1">
      View and manage all transactions
    </p>
  </div>

  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={() => router.back()}
      className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 font-medium transition"
    >
      ← Back to Dashboard
    </button>

    <button
      type="button"
      onClick={handleNewTransaction}
      className="bg-[#7F3DFF] hover:bg-[#6d2fe0] text-white px-5 py-2.5 rounded-lg font-medium transition"
    >
      + New Transaction
    </button>
  </div>
</div>

      {/* ================= SUMMARY ================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">
            Total Transactions
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {transactions.length}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">
            Total Amount
          </p>

          <p className="text-2xl font-bold text-gray-800 mt-1">
            {formatAmount(totalAmount)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-sm text-gray-500">
            Completed
          </p>

          <p className="text-2xl font-bold text-green-600 mt-1">
            {completedTransactions}
          </p>
        </div>
      </div>

      {/* ================= TRANSACTION FORM ================= */}
      {showForm && (
        <div className="bg-white rounded-xl shadow p-5 md:p-6 mb-6">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {editingId
                  ? "Edit Transaction"
                  : "New Transaction"}
              </h2>

              {editingId && (
                <p className="text-sm text-gray-500 mt-1">
                  Update the transaction details below.
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleCloseForm}
              className="text-gray-400 hover:text-gray-700 text-xl"
              aria-label="Close form"
            >
              ✕
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {/* Transaction Date */}
<div>
  <label className="block text-sm font-medium text-gray-600 mb-1">
    Transaction Date
  </label>

  <input
    type="date"
    name="transactionDate"
    value={formData.transactionDate}
    onChange={handleChange}
    required
    className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
  />
</div>

            {/* Reference */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Reference
              </label>

              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                placeholder="TXN-1001"
                className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Amount
              </label>

              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="50000"
                min="0"
                step="1"
                required
                className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Description
              </label>

              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Order payment"
                className="w-full border rounded-lg px-3 py-2.5 outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Payer */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Payer
              </label>

              <select
                name="payer"
                value={formData.payer}
                onChange={handleChange}
                required
                className="w-full border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">
                  Select payer
                </option>

                {outlets.map((outlet) => (
                  <option
                    key={outlet.id}
                    value={outlet.name}
                  >
                    {outlet.name}
                  </option>
                ))}
              </select>

              {outlets.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  No outlets found in the Outlets collection.
                </p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="payment">
                  Payment
                </option>

                <option value="order">
                  Order
                </option>

                <option value="sale">
                  Sale
                </option>

                <option value="return">
                  Return
                </option>

                <option value="expense">
                  Expense
                </option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2.5 bg-white outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="completed">
                  Completed
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="failed">
                  Failed
                </option>
              </select>
            </div>

            {/* Buttons */}
            <div className="md:col-span-2 flex items-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseForm}
                className="px-5 py-2.5 rounded-lg border text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-lg bg-[#7F3DFF] text-white hover:bg-[#6d2fe0] disabled:opacity-50"
              >
                {saving
                  ? editingId
                    ? "Updating..."
                    : "Saving..."
                  : editingId
                  ? "Update Transaction"
                  : "Save Transaction"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= STATEMENT TABLE ================= */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-5 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Transaction Statement
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Date
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Reference
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Payer
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Description
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Type
                </th>

                <th className="px-5 py-4 text-left text-sm font-semibold text-gray-600">
                  Status
                </th>

                <th className="px-5 py-4 text-right text-sm font-semibold text-gray-600">
                  Amount
                </th>

                <th className="px-5 py-4 text-center text-sm font-semibold text-gray-600">
                  Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {transactions.map((transaction) => (
                <tr
                  key={transaction.id}
                  className="hover:bg-gray-50"
                >
                  {/* Date */}
                  <td className="px-5 py-4 whitespace-nowrap">
                    {formatDate(transaction.createdAt)}
                  </td>

                  {/* Reference */}
                  <td className="px-5 py-4 font-mono text-sm">
                    {transaction.reference ||
                      transaction.id}
                  </td>

                  {/* Payer */}
                  <td className="px-5 py-4 font-medium text-gray-800">
                    {transaction.payer || (
                      <span className="text-gray-400">
                        Not selected
                      </span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-5 py-4">
                    {transaction.description ||
                      "Transaction"}
                  </td>

                  {/* Type */}
                  <td className="px-5 py-4">
  <span
    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getTypeClass(
      transaction.type
    )}`}
  >
    {transaction.type || "payment"}
  </span>
</td>

                  {/* Status */}
                  <td className="px-5 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusClass(
                        transaction.status
                      )}`}
                    >
                      {transaction.status || "unknown"}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-5 py-4 text-right font-semibold whitespace-nowrap">
                    {formatAmount(transaction.amount)}
                  </td>

                  {/* Action */}
                  <td className="px-5 py-4 text-center">
                    <button
                      type="button"
                      onClick={() =>
                        handleEdit(transaction)
                      }
                      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#7F3DFF] bg-purple-50 hover:bg-purple-100"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}

              {transactions.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-10 text-gray-500"
                  >
                    No transactions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    </ProtectedRoute>
  );
};

export default Statements;