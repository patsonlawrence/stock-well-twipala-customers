"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

import { Line, Bar, Doughnut } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

import { db } from "@/lib/firebase";
import ProtectedRoute from "@/app/components/ProtectedRoute";

// ============================================================
// TYPES
// ============================================================

interface Expense {
  id: string;

  title: string;
  description: string;

  amount: number;
  currency: string;

  categoryId: string;
  categoryName: string;

  locationId: string;
  locationName: string;

  paymentMethod: string;

  expenseDate: string;

  recurring: boolean;
  recurringPeriod: string;

  createdBy: string;

  createdAt?: Timestamp | null;
}

interface ExpenseCategory {
  id: string;

  name: string;
  description: string;

  active: boolean;

  createdAt?: Timestamp | null;
}

interface ExpenseLocation {
  id: string;

  name: string;
  description: string;

  active: boolean;

  createdAt?: Timestamp | null;
}
type ExpensePeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "lastYear";


// ============================================================
// DEFAULT CATEGORIES
// ============================================================

const DEFAULT_CATEGORIES = [
  {
    name: "Rent",
    description: "Office, shop, warehouse and premises rent",
  },
  {
    name: "Salaries & Wages",
    description: "Employee salaries, wages and allowances",
  },
  {
    name: "Transport",
    description: "Fuel, transport, deliveries and logistics",
  },
  {
    name: "Utilities",
    description: "Electricity, water, internet and other utilities",
  },
  {
    name: "Marketing",
    description: "Advertising, promotions and marketing",
  },
  {
    name: "Stock / Inventory",
    description: "Purchasing products and inventory",
  },
  {
    name: "Repairs & Maintenance",
    description: "Equipment, vehicles and premises maintenance",
  },
  {
    name: "Office Expenses",
    description: "Stationery, printing and office supplies",
  },
  {
    name: "Bank & Financial Charges",
    description: "Bank charges, transaction fees and financial costs",
  },
  {
    name: "Taxes & Licenses",
    description: "Taxes, permits, licenses and government charges",
  },
  {
    name: "Equipment",
    description: "Computers, machines, furniture and equipment",
  },
  {
    name: "Professional Services",
    description: "Accounting, legal, consulting and professional services",
  },
  {
    name: "Staff Welfare",
    description: "Meals, welfare and staff-related expenses",
  },
  {
    name: "Other",
    description: "Expenses that do not fit another category",
  },
];


// ============================================================
// DEFAULT LOCATIONS
// ============================================================

const DEFAULT_LOCATIONS = [
  {
    name: "Head Office",
    description: "Main company office",
  },
  {
    name: "Warehouse",
    description: "Warehouse and storage operations",
  },
  {
    name: "Main Outlet",
    description: "Main sales outlet",
  },
];


// ============================================================
// PAYMENT METHODS
// ============================================================

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "Mobile Money",
  "Card",
  "Cheque",
  "Credit",
  "Other",
];


// ============================================================
// HELPER
// ============================================================

function formatAmount(amount: number, currency = "UGX") {
  return new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function startOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfDay(date: Date) {
  const result = new Date(date);

  result.setHours(23, 59, 59, 999);

  return result;
}

function startOfWeek(date: Date) {
  const result = new Date(date);

  const day = result.getDay();

  // Monday = first day of week
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);

  return result;
}

function endOfWeek(date: Date) {
  const result = startOfWeek(date);

  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);

  return result;
}

function startOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function endOfMonth(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function startOfYear(date: Date) {
  return new Date(
    date.getFullYear(),
    0,
    1,
    0,
    0,
    0,
    0
  );
}

function endOfYear(date: Date) {
  return new Date(
    date.getFullYear(),
    11,
    31,
    23,
    59,
    59,
    999
  );
}
function isSameDay(date: Date, target: Date) {
  return (
    date.getFullYear() === target.getFullYear() &&
    date.getMonth() === target.getMonth() &&
    date.getDate() === target.getDate()
  );
}

function isThisWeek(date: Date, now: Date) {
  const start = new Date(now);

  const day = start.getDay();

  // Monday = first day
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return date >= start && date <= end;
}

function isThisMonth(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth()
  );
}

function isThisYear(date: Date, now: Date) {
  return (
    date.getFullYear() === now.getFullYear()
  );
}

type AnalysisPeriod =
  | "today"
  | "week"
  | "month"
  | "year"
  | "lastYear";

type Expenses = {
  id: string;

  title?: string;

  description?: string;

  amount: number;

  currency?: string;

  categoryId?: string;

  categoryName?: string;

  locationId?: string;

  locationName?: string;

  paymentMethod?: string;

  expenseDate: string;

  recurring?: boolean;

  recurringPeriod?: string;

  createdBy?: string;

  createdAt?: any;
};


// ============================================================
// PAGE
// ============================================================

export default function ExpensesPage() {
  // ==========================================================
  // AUTH / USER
  // ==========================================================

  const [username, setUsername] = useState("Director");


  // ==========================================================
  // DATA
  // ==========================================================

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [locations, setLocations] = useState<ExpenseLocation[]>([]);
  const [expensePeriod, setExpensePeriod] =
  useState<ExpensePeriod>("month");

  const periodRange = useMemo(() => {
  const now = new Date();

  switch (expensePeriod) {
    case "today":
      return {
        start: startOfDay(now),
        end: endOfDay(now),
      };

    case "week":
      return {
        start: startOfWeek(now),
        end: endOfWeek(now),
      };

    case "month":
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };

    case "year":
      return {
        start: startOfYear(now),
        end: endOfYear(now),
      };

    case "lastYear": {
      const lastYear = new Date(
        now.getFullYear() - 1,
        0,
        1
      );

      return {
        start: startOfYear(lastYear),
        end: endOfYear(lastYear),
      };
    }

    default:
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
  }
}, [expensePeriod]);


const filteredExpenses = useMemo(() => {
  return expenses.filter((expense) => {
    if (!expense.expenseDate) {
      return false;
    }

    const expenseDate = new Date(
      expense.expenseDate
    );

    return (
      expenseDate >= periodRange.start &&
      expenseDate <= periodRange.end
    );
  });
}, [expenses, periodRange]);

const selectedPeriodTotal = useMemo(() => {
  return filteredExpenses.reduce(
    (total, expense) =>
      total + Number(expense.amount || 0),
    0
  );
}, [filteredExpenses]);

const categoryTotals = useMemo(() => {
  const totals: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    const category =
      expense.categoryName || "Other";

    totals[category] =
      (totals[category] || 0) +
      Number(expense.amount || 0);
  });

  return Object.entries(totals)
    .map(([name, amount]) => ({
      name,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}, [filteredExpenses]);

const locationTotals = useMemo(() => {
  const totals: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    const location =
      expense.locationName || "Unassigned";

    totals[location] =
      (totals[location] || 0) +
      Number(expense.amount || 0);
  });

  return Object.entries(totals)
    .map(([name, amount]) => ({
      name,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);
}, [filteredExpenses]);

const trendData = useMemo(() => {
  const totals: Record<string, number> = {};

  filteredExpenses.forEach((expense) => {
    if (!expense.expenseDate) return;

    const date = new Date(
      expense.expenseDate
    );

    let key = "";

    if (expensePeriod === "today") {
      key = date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (expensePeriod === "week") {
      key = date.toLocaleDateString([], {
        weekday: "short",
      });
    } else if (expensePeriod === "month") {
      key = date.toLocaleDateString([], {
        day: "numeric",
      });
    } else {
      key = date.toLocaleDateString([], {
        month: "short",
      });
    }

    totals[key] =
      (totals[key] || 0) +
      Number(expense.amount || 0);
  });

  return Object.entries(totals).map(
    ([date, amount]) => ({
      date,
      amount,
    })
  );
}, [filteredExpenses, expensePeriod]);

const expenseSummary = useMemo(() => {
  const now = new Date();

  let today = 0;
  let week = 0;
  let month = 0;
  let year = 0;

  expenses.forEach((expense) => {
    if (!expense.expenseDate) return;

    const expenseDate = new Date(
      expense.expenseDate
    );

    const amount = Number(
      expense.amount || 0
    );

    if (isSameDay(expenseDate, now)) {
      today += amount;
    }

    if (isThisWeek(expenseDate, now)) {
      week += amount;
    }

    if (isThisMonth(expenseDate, now)) {
      month += amount;
    }

    if (isThisYear(expenseDate, now)) {
      year += amount;
    }
  });

  return {
    today,
    week,
    month,
    year,
  };
}, [expenses]);




  // ==========================================================
  // LOADING
  // ==========================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  // ==========================================================
  // UI
  // ==========================================================

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showLocationForm, setShowLocationForm] = useState(false);


  // ==========================================================
  // FILTERS
  // ==========================================================

  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  // ==========================================================
  // EXPENSE FORM
  // ==========================================================

  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");

  const [expenseCategoryId, setExpenseCategoryId] = useState("");

  const [expenseLocationId, setExpenseLocationId] = useState("");

  const [paymentMethod, setPaymentMethod] = useState("Cash");

  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [recurring, setRecurring] = useState(false);

  const [recurringPeriod, setRecurringPeriod] = useState("Monthly");


  // ==========================================================
  // CATEGORY FORM
  // ==========================================================

  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");


  // ==========================================================
  // LOCATION FORM
  // ==========================================================

  const [locationName, setLocationName] = useState("");
  const [locationDescription, setLocationDescription] = useState("");


  // ==========================================================
  // LOAD FIREBASE DATA
  // ==========================================================

  useEffect(() => {
    loadData();
  }, []);


  async function loadData() {
    try {
      setLoading(true);

      // ------------------------------------------------------
      // EXPENSES
      // ------------------------------------------------------

      const expenseRef = collection(db, "expenses");

      const expenseQuery = query(
        expenseRef,
        orderBy("expenseDate", "desc")
      );

      const expenseSnapshot = await getDocs(expenseQuery);

      const expenseData: Expense[] = expenseSnapshot.docs.map(
        (item) => {
          const data = item.data();

          return {
            id: item.id,

            title: data.title || "",
            description: data.description || "",

            amount: Number(data.amount || 0),
            currency: data.currency || "UGX",

            categoryId: data.categoryId || "",
            categoryName: data.categoryName || "Other",

            locationId: data.locationId || "",
            locationName: data.locationName || "Unassigned",

            paymentMethod: data.paymentMethod || "Cash",

            expenseDate: data.expenseDate || "",

            recurring: data.recurring === true,
            recurringPeriod: data.recurringPeriod || "",

            createdBy: data.createdBy || "",

            createdAt: data.createdAt || null,
          };
        }
      );

      setExpenses(expenseData);


      // ------------------------------------------------------
      // CATEGORIES
      // ------------------------------------------------------

      const categorySnapshot = await getDocs(
        collection(db, "expenseCategories")
      );

      let categoryData: ExpenseCategory[] =
        categorySnapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,

            name: data.name || "",
            description: data.description || "",

            active: data.active !== false,

            createdAt: data.createdAt || null,
          };
        });


      // ------------------------------------------------------
      // CREATE DEFAULT CATEGORIES IF NONE EXIST
      // ------------------------------------------------------

      if (categoryData.length === 0) {
        const createdCategories: ExpenseCategory[] = [];

        for (const category of DEFAULT_CATEGORIES) {
          const newCategory = await addDoc(
            collection(db, "expenseCategories"),
            {
              name: category.name,
              description: category.description,

              active: true,

              createdAt: serverTimestamp(),
            }
          );

          createdCategories.push({
            id: newCategory.id,

            name: category.name,
            description: category.description,

            active: true,
          });
        }

        categoryData = createdCategories;
      }

      setCategories(categoryData);


      // ------------------------------------------------------
      // LOCATIONS
      // ------------------------------------------------------

      const locationSnapshot = await getDocs(
        collection(db, "expenseLocations")
      );

      let locationData: ExpenseLocation[] =
        locationSnapshot.docs.map((item) => {
          const data = item.data();

          return {
            id: item.id,

            name: data.name || "",
            description: data.description || "",

            active: data.active !== false,

            createdAt: data.createdAt || null,
          };
        });


      // ------------------------------------------------------
      // CREATE DEFAULT LOCATIONS IF NONE EXIST
      // ------------------------------------------------------

      if (locationData.length === 0) {
        const createdLocations: ExpenseLocation[] = [];

        for (const location of DEFAULT_LOCATIONS) {
          const newLocation = await addDoc(
            collection(db, "expenseLocations"),
            {
              name: location.name,
              description: location.description,

              active: true,

              createdAt: serverTimestamp(),
            }
          );

          createdLocations.push({
            id: newLocation.id,

            name: location.name,
            description: location.description,

            active: true,
          });
        }

        locationData = createdLocations;
      }

      setLocations(locationData);


      // ------------------------------------------------------
      // USERNAME
      // ------------------------------------------------------

      if (typeof window !== "undefined") {
        const storedUsername =
          localStorage.getItem("username");

        if (storedUsername) {
          setUsername(storedUsername);
        }
      }

    } catch (error) {
      console.error("Error loading expense data:", error);

      alert(
        "Could not load expense data. Check your Firebase configuration and Firestore rules."
      );
    } finally {
      setLoading(false);
    }
  }


  // ==========================================================
  // ACTIVE CATEGORIES
  // ==========================================================

  const activeCategories = useMemo(() => {
    return categories.filter(
      (category) => category.active !== false
    );
  }, [categories]);


  // ==========================================================
  // ACTIVE LOCATIONS
  // ==========================================================

  const activeLocations = useMemo(() => {
    return locations.filter(
      (location) => location.active !== false
    );
  }, [locations]);


  // ==========================================================
  // FILTER EXPENSES
  // ==========================================================

  


  // ==========================================================
  // TOTAL EXPENSES
  // ==========================================================

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce(
      (total, expense) =>
        total + Number(expense.amount || 0),
      0
    );
  }, [filteredExpenses]);


  // ==========================================================
  // EXPENSE BY CATEGORY
  // ==========================================================

  const expensesByCategory = useMemo(() => {
    const result: Record<string, number> = {};

    filteredExpenses.forEach((expense) => {
      const category =
        expense.categoryName || "Other";

      result[category] =
        (result[category] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(result)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);


  // ==========================================================
  // EXPENSE BY LOCATION
  // ==========================================================

  const expensesByLocation = useMemo(() => {
    const result: Record<string, number> = {};

    filteredExpenses.forEach((expense) => {
      const location =
        expense.locationName || "Unassigned";

      result[location] =
        (result[location] || 0) +
        Number(expense.amount || 0);
    });

    return Object.entries(result)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage:
          totalExpenses > 0
            ? (amount / totalExpenses) * 100
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses, totalExpenses]);


  // ==========================================================
  // ADD EXPENSE
  // ==========================================================

  async function handleAddExpense(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!expenseTitle.trim()) {
      alert("Please enter an expense title.");
      return;
    }

    if (!expenseAmount || Number(expenseAmount) <= 0) {
      alert("Please enter a valid expense amount.");
      return;
    }

    if (!expenseCategoryId) {
      alert("Please select an expense category.");
      return;
    }

    if (!expenseLocationId) {
      alert("Please select a location.");
      return;
    }

    try {
      setSaving(true);

      const category = categories.find(
        (item) =>
          item.id === expenseCategoryId
      );

      const location = locations.find(
        (item) =>
          item.id === expenseLocationId
      );


      const newExpense = {
        title: expenseTitle.trim(),

        description:
          expenseDescription.trim(),

        amount: Number(expenseAmount),

        currency: "UGX",

        categoryId: expenseCategoryId,

        categoryName:
          category?.name || "Other",

        locationId: expenseLocationId,

        locationName:
          location?.name || "Unassigned",

        paymentMethod,

        expenseDate,

        recurring,

        recurringPeriod:
          recurring
            ? recurringPeriod
            : "",

        createdBy: username,

        createdAt:
          serverTimestamp(),
      };


      const docRef = await addDoc(
        collection(db, "expenses"),
        newExpense
      );


      // ------------------------------------------------------
      // ADD LOCALLY
      // ------------------------------------------------------

      const localExpense: Expense = {
        id: docRef.id,

        title: newExpense.title,

        description:
          newExpense.description,

        amount: newExpense.amount,

        currency: newExpense.currency,

        categoryId:
          newExpense.categoryId,

        categoryName:
          newExpense.categoryName,

        locationId:
          newExpense.locationId,

        locationName:
          newExpense.locationName,

        paymentMethod:
          newExpense.paymentMethod,

        expenseDate:
          newExpense.expenseDate,

        recurring:
          newExpense.recurring,

        recurringPeriod:
          newExpense.recurringPeriod,

        createdBy:
          newExpense.createdBy,

        createdAt: null,
      };


      setExpenses((previous) => [
        localExpense,
        ...previous,
      ]);


      // ------------------------------------------------------
      // RESET FORM
      // ------------------------------------------------------

      setExpenseTitle("");
      setExpenseDescription("");
      setExpenseAmount("");

      setPaymentMethod("Cash");

      setRecurring(false);

      setRecurringPeriod("Monthly");

      setShowExpenseForm(false);

      alert("Expense saved successfully.");

    } catch (error) {
      console.error(
        "Error saving expense:",
        error
      );

      alert(
        "Could not save expense."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // ADD CATEGORY
  // ==========================================================

  async function handleAddCategory(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!categoryName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    try {
      setSaving(true);

      const newCategory = await addDoc(
        collection(db, "expenseCategories"),
        {
          name: categoryName.trim(),

          description:
            categoryDescription.trim(),

          active: true,

          createdAt:
            serverTimestamp(),
        }
      );


      setCategories((previous) => [
        ...previous,

        {
          id: newCategory.id,

          name: categoryName.trim(),

          description:
            categoryDescription.trim(),

          active: true,

          createdAt: null,
        },
      ]);


      setCategoryName("");
      setCategoryDescription("");

      setShowCategoryForm(false);

      alert("Category created.");

    } catch (error) {
      console.error(
        "Error creating category:",
        error
      );

      alert(
        "Could not create category."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // ADD LOCATION
  // ==========================================================

  async function handleAddLocation(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!locationName.trim()) {
      alert("Please enter a location name.");
      return;
    }

    try {
      setSaving(true);

      const newLocation = await addDoc(
        collection(db, "expenseLocations"),
        {
          name: locationName.trim(),

          description:
            locationDescription.trim(),

          active: true,

          createdAt:
            serverTimestamp(),
        }
      );


      setLocations((previous) => [
        ...previous,

        {
          id: newLocation.id,

          name: locationName.trim(),

          description:
            locationDescription.trim(),

          active: true,

          createdAt: null,
        },
      ]);


      setLocationName("");
      setLocationDescription("");

      setShowLocationForm(false);

      alert("Location created.");

    } catch (error) {
      console.error(
        "Error creating location:",
        error
      );

      alert(
        "Could not create location."
      );
    } finally {
      setSaving(false);
    }
  }


  // ==========================================================
  // DELETE EXPENSE
  // ==========================================================

  async function handleDeleteExpense(
    expenseId: string
  ) {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this expense?"
      );

    if (!confirmed) return;

    try {
      await deleteDoc(
        doc(db, "expenses", expenseId)
      );

      setExpenses((previous) =>
        previous.filter(
          (expense) =>
            expense.id !== expenseId
        )
      );

    } catch (error) {
      console.error(
        "Error deleting expense:",
        error
      );

      alert(
        "Could not delete expense."
      );
    }
  }


  // ==========================================================
  // RESET FILTERS
  // ==========================================================

  function resetFilters() {
    setSelectedCategory("all");
    setSelectedLocation("all");
    setStartDate("");
    setEndDate("");
  }


  // ==========================================================
  // LOADING SCREEN
  // ==========================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

        <div className="text-center">

          <div className="text-4xl mb-4">
            💰
          </div>

          <p className="text-gray-600">
            Preparing your expense dashboard...
          </p>

        </div>

      </div>
    );
  }


  // ==========================================================
  // PAGE
  // ==========================================================

  return (
    <ProtectedRoute allowedRoles={["admin", "superuser", "manager"]}>
    <div className="min-h-screen bg-gray-50">


      {/* ======================================================
          HEADER
      ====================================================== */}

      <header className="bg-purple-700 text-white shadow">

        <div className="max-w-7xl mx-auto px-4 md:px-8 py-5">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>

              <div className="flex items-center gap-3">

                <Link
                  href="/admin"
                  className="text-purple-200 hover:text-white"
                >
                  ← Dashboard
                </Link>

                <span className="text-purple-300">
                  /
                </span>

                <span>
                  Expenses
                </span>

              </div>

              <h1 className="text-2xl md:text-3xl font-bold mt-3">
                💰 Expense Management
              </h1>

              <p className="text-purple-200 mt-1">
                Understand exactly where company money is going.
              </p>

            </div>


            <div className="text-right">

              <p className="text-sm text-purple-200">
                Director View
              </p>

              <p className="font-semibold">
                {username}
              </p>

            </div>

          </div>

        </div>

      </header>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="max-w-7xl mx-auto p-4 md:p-8">


        {/* ====================================================
            ACTION BUTTONS
        ==================================================== */}

        <div className="flex flex-wrap gap-3 mb-6">

          <button
            type="button"
            onClick={() =>
              setShowExpenseForm(true)
            }
            className="
              bg-purple-700
              hover:bg-purple-800
              text-white
              px-5
              py-3
              rounded-lg
              font-semibold
              shadow-sm
            "
          >
            + Add Expense
          </button>


          <button
            type="button"
            onClick={() =>
              setShowCategoryForm(true)
            }
            className="
              bg-white
              border
              border-gray-200
              hover:bg-gray-50
              text-gray-700
              px-5
              py-3
              rounded-lg
              font-medium
            "
          >
            + Category
          </button>


          <button
            type="button"
            onClick={() =>
              setShowLocationForm(true)
            }
            className="
              bg-white
              border
              border-gray-200
              hover:bg-gray-50
              text-gray-700
              px-5
              py-3
              rounded-lg
              font-medium
            "
          >
            + Allocation
          </button>

        </div>


        {/* ====================================================
            SUMMARY CARDS
        ==================================================== */}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

  {/* TODAY */}
  <div className="rounded-xl bg-blue-50 border border-blue-100 p-5">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-blue-600 font-medium">
          Today
        </p>

        <p className="text-2xl font-bold text-blue-800 mt-1">
          {formatAmount(expenseSummary.today)}
        </p>

        <p className="text-xs text-blue-500 mt-1">
          Expenses today
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
        📅
      </div>

    </div>

  </div>


  {/* THIS WEEK */}
  <div className="rounded-xl bg-purple-50 border border-purple-100 p-5">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-purple-600 font-medium">
          This Week
        </p>

        <p className="text-2xl font-bold text-purple-800 mt-1">
          {formatAmount(expenseSummary.week)}
        </p>

        <p className="text-xs text-purple-500 mt-1">
          Monday to today
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
        📊
      </div>

    </div>

  </div>


  {/* THIS MONTH */}
  <div className="rounded-xl bg-orange-50 border border-orange-100 p-5">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-orange-600 font-medium">
          This Month
        </p>

        <p className="text-2xl font-bold text-orange-800 mt-1">
          {formatAmount(expenseSummary.month)}
        </p>

        <p className="text-xs text-orange-500 mt-1">
          Current month
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
        💰
      </div>

    </div>

  </div>


  {/* THIS YEAR */}
  <div className="rounded-xl bg-red-50 border border-red-100 p-5">

    <div className="flex items-center justify-between">

      <div>
        <p className="text-sm text-red-600 font-medium">
          This Year
        </p>

        <p className="text-2xl font-bold text-red-800 mt-1">
          {formatAmount(expenseSummary.year)}
        </p>

        <p className="text-xs text-red-500 mt-1">
          Current year
        </p>
      </div>

      <div className="
        w-11
        h-11
        rounded-full
        bg-red-100
        flex
        items-center
        justify-center
        text-xl
      ">
        📈
      </div>

    </div>

  </div>

</div>


        {/* ====================================================
            FILTERS
        ==================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-8">

          <div className="flex items-center justify-between mb-4">

            <div>

              <h2 className="font-semibold text-gray-800">
                Expense Filters
              </h2>

              <p className="text-sm text-gray-500">
                Analyze where your money is being consumed.
              </p>

            </div>


            <button
              type="button"
              onClick={resetFilters}
              className="text-sm text-purple-700 hover:underline"
            >
              Reset
            </button>

          </div>


          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">


            {/* CATEGORY */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>

              <select
                value={selectedCategory}
                onChange={(event) =>
                  setSelectedCategory(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >

                <option value="all">
                  All Categories
                </option>

                {activeCategories.map(
                  (category) => (
                    <option
                      key={category.id}
                      value={category.id}
                    >
                      {category.name}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* LOCATION */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                Allocation
              </label>

              <select
                value={selectedLocation}
                onChange={(event) =>
                  setSelectedLocation(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >

                <option value="all">
                  Allocation
                </option>

                {activeLocations.map(
                  (location) => (
                    <option
                      key={location.id}
                      value={location.id}
                    >
                      {location.name}
                    </option>
                  )
                )}

              </select>

            </div>


            {/* START DATE */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                From
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

            </div>


            {/* END DATE */}

            <div>

              <label className="block text-sm font-medium text-gray-700 mb-1">
                To
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(event) =>
                  setEndDate(
                    event.target.value
                  )
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

            </div>

          </div>

        </div>


        {/* ====================================================
            ANALYTICS
        ==================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">


          {/* CATEGORY ANALYSIS */}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

            <h2 className="text-lg font-semibold text-gray-800">
              💸 Where Is The Money Going?
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              Expense consumption by category.
            </p>


            {expensesByCategory.length === 0 ? (

              <div className="py-10 text-center text-gray-400">
                No expense data yet.
              </div>

            ) : (

              <div className="space-y-5">

                {expensesByCategory.map(
                  (item) => (

                    <div key={item.name}>

                      <div className="flex justify-between mb-1">

                        <span className="text-sm font-medium text-gray-700">
                          {item.name}
                        </span>

                        <span className="text-sm font-semibold text-gray-800">
                          {formatAmount(item.amount)}
                        </span>

                      </div>


                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{
                            width: `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>


                      <p className="text-xs text-gray-400 mt-1">
                        {item.percentage.toFixed(1)}%
                        {" "}of total expenses
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          </div>


          {/* LOCATION ANALYSIS */}

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

            <h2 className="text-lg font-semibold text-gray-800">
              📍 Which Allocation Consumes The Most?
            </h2>

            <p className="text-sm text-gray-500 mb-5">
              Expense consumption by location.
            </p>


            {expensesByLocation.length === 0 ? (

              <div className="py-10 text-center text-gray-400">
                No expense data yet.
              </div>

            ) : (

              <div className="space-y-5">

                {expensesByLocation.map(
                  (item) => (

                    <div key={item.name}>

                      <div className="flex justify-between mb-1">

                        <span className="text-sm font-medium text-gray-700">
                          {item.name}
                        </span>

                        <span className="text-sm font-semibold text-gray-800">
                          {formatAmount(item.amount)}
                        </span>

                      </div>


                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">

                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{
                            width: `${Math.min(
                              item.percentage,
                              100
                            )}%`,
                          }}
                        />

                      </div>


                      <p className="text-xs text-gray-400 mt-1">
                        {item.percentage.toFixed(1)}%
                        {" "}of total expenses
                      </p>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

        </div>


        {/* ====================================================
            EXPENSE TABLE
        ==================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">

          <div className="p-6 border-b border-gray-100">

            <h2 className="text-lg font-semibold text-gray-800">
              Expense Transactions
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              Every expense entered into the company system.
            </p>

          </div>


          {filteredExpenses.length === 0 ? (

            <div className="py-16 text-center px-6">

              <div className="text-5xl mb-4">
                📊
              </div>

              <h3 className="text-lg font-semibold text-gray-700">
                No expenses recorded yet
              </h3>

              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Start entering company expenses and this
                dashboard will automatically show you where
                the money is going.
              </p>

              <button
                type="button"
                onClick={() =>
                  setShowExpenseForm(true)
                }
                className="mt-5 bg-purple-700 text-white px-5 py-2.5 rounded-lg"
              >
                + Enter First Expense
              </button>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full text-sm">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left px-5 py-3 font-semibold text-gray-600">
                      Date
                    </th>

                    <th className="text-left px-5 py-3 font-semibold text-gray-600">
                      Expense
                    </th>

                    <th className="text-left px-5 py-3 font-semibold text-gray-600">
                      Category
                    </th>

                    <th className="text-left px-5 py-3 font-semibold text-gray-600">
                      Allocation
                    </th>

                    <th className="text-left px-5 py-3 font-semibold text-gray-600">
                      Payment
                    </th>

                    <th className="text-right px-5 py-3 font-semibold text-gray-600">
                      Amount
                    </th>

                    <th className="text-right px-5 py-3 font-semibold text-gray-600">
                      Action
                    </th>

                  </tr>

                </thead>


                <tbody className="divide-y divide-gray-100">

                  {filteredExpenses.map(
                    (expense) => (

                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-5 py-4 text-gray-600">
                          {expense.expenseDate}
                        </td>


                        <td className="px-5 py-4">

                          <p className="font-medium text-gray-800">
                            {expense.title}
                          </p>

                          {expense.description && (
                            <p className="text-xs text-gray-400 mt-1">
                              {expense.description}
                            </p>
                          )}

                        </td>


                        <td className="px-5 py-4">

                          <span className="inline-flex bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-xs font-medium">
                            {expense.categoryName}
                          </span>

                        </td>


                        <td className="px-5 py-4 text-gray-600">
                          {expense.locationName}
                        </td>


                        <td className="px-5 py-4 text-gray-600">
                          {expense.paymentMethod}
                        </td>


                        <td className="px-5 py-4 text-right font-bold text-red-700">
                          {formatAmount(
                            expense.amount
                          )}
                        </td>


                        <td className="px-5 py-4 text-right">

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteExpense(
                                expense.id
                              )
                            }
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>


      {/* ======================================================
          EXPENSE MODAL
      ====================================================== */}

      {showExpenseForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

            <div className="p-6 border-b">

              <div className="flex items-center justify-between">

                <div>

                  <h2 className="text-xl font-bold text-gray-800">
                    Enter Company Expense
                  </h2>

                  <p className="text-sm text-gray-500 mt-1">
                    Record where company money was spent.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowExpenseForm(false)
                  }
                  className="text-gray-500 text-xl"
                >
                  ✕
                </button>

              </div>

            </div>


            <form
              onSubmit={handleAddExpense}
              className="p-6 space-y-5"
            >


              {/* TITLE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expense Name *
                </label>

                <input
                  type="text"
                  value={expenseTitle}
                  onChange={(event) =>
                    setExpenseTitle(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Electricity bill"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                />

              </div>


              {/* DESCRIPTION */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>

                <textarea
                  value={expenseDescription}
                  onChange={(event) =>
                    setExpenseDescription(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="Optional details..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                />

              </div>


              {/* AMOUNT */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (UGX) *
                </label>

                <input
                  type="number"
                  min="0"
                  step="1"
                  value={expenseAmount}
                  onChange={(event) =>
                    setExpenseAmount(
                      event.target.value
                    )
                  }
                  placeholder="0"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                />

              </div>


              {/* CATEGORY + LOCATION */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category *
                  </label>

                  <select
                    value={expenseCategoryId}
                    onChange={(event) =>
                      setExpenseCategoryId(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  >

                    <option value="">
                      Select category
                    </option>

                    {activeCategories.map(
                      (category) => (
                        <option
                          key={category.id}
                          value={category.id}
                        >
                          {category.name}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocation *
                  </label>

                  <select
                    value={expenseLocationId}
                    onChange={(event) =>
                      setExpenseLocationId(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  >

                    <option value="">
                      Select Allocation
                    </option>

                    {activeLocations.map(
                      (location) => (
                        <option
                          key={location.id}
                          value={location.id}
                        >
                          {location.name}
                        </option>
                      )
                    )}

                  </select>

                </div>

                <div className="flex flex-wrap gap-2 mb-6">

  {[
    ["today", "Today"],
    ["week", "This Week"],
    ["month", "This Month"],
    ["year", "This Year"],
    ["lastYear", "Last Year"],
  ].map(([value, label]) => (
    <button
      key={value}
      type="button"
      onClick={() =>
        setExpensePeriod(
          value as ExpensePeriod
        )
      }
      className={`
        px-4
        py-2
        rounded-lg
        text-sm
        font-medium
        transition
        ${
          expensePeriod === value
            ? "bg-purple-700 text-white shadow"
            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }
      `}
    >
      {label}
    </button>
  ))}

</div>

              </div>


              {/* PAYMENT + DATE */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Method
                  </label>

                  <select
                    value={paymentMethod}
                    onChange={(event) =>
                      setPaymentMethod(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  >

                    {PAYMENT_METHODS.map(
                      (method) => (
                        <option
                          key={method}
                          value={method}
                        >
                          {method}
                        </option>
                      )
                    )}

                  </select>

                </div>


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expense Date
                  </label>

                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(event) =>
                      setExpenseDate(
                        event.target.value
                      )
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  />

                </div>

              </div>


              {/* RECURRING */}

              <div className="border rounded-lg p-4 bg-gray-50">

                <label className="flex items-center gap-3">

                  <input
                    type="checkbox"
                    checked={recurring}
                    onChange={(event) =>
                      setRecurring(
                        event.target.checked
                      )
                    }
                    className="w-4 h-4"
                  />

                  <span className="font-medium text-gray-700">
                    This is a recurring expense
                  </span>

                </label>


                {recurring && (

                  <div className="mt-3">

                    <label className="block text-sm text-gray-600 mb-1">
                      Recurring Period
                    </label>

                    <select
                      value={recurringPeriod}
                      onChange={(event) =>
                        setRecurringPeriod(
                          event.target.value
                        )
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >

                      <option value="Weekly">
                        Weekly
                      </option>

                      <option value="Monthly">
                        Monthly
                      </option>

                      <option value="Quarterly">
                        Quarterly
                      </option>

                      <option value="Yearly">
                        Yearly
                      </option>

                    </select>

                  </div>

                )}

              </div>


              {/* BUTTONS */}

              <div className="flex justify-end gap-3 pt-3">

                <button
                  type="button"
                  onClick={() =>
                    setShowExpenseForm(false)
                  }
                  className="px-5 py-2.5 border rounded-lg text-gray-700"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg font-semibold disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Expense"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================
          CATEGORY MODAL
      ====================================================== */}

      {showCategoryForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

            <form
              onSubmit={handleAddCategory}
              className="p-6"
            >

              <div className="flex justify-between items-center mb-5">

                <h2 className="text-xl font-bold text-gray-800">
                  New Expense Category
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowCategoryForm(false)
                  }
                >
                  ✕
                </button>

              </div>


              <div className="space-y-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name
                  </label>

                  <input
                    type="text"
                    value={categoryName}
                    onChange={(event) =>
                      setCategoryName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Security"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    value={categoryDescription}
                    onChange={(event) =>
                      setCategoryDescription(
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={() =>
                    setShowCategoryForm(false)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg"
                >
                  {saving
                    ? "Saving..."
                    : "Create Category"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}


      {/* ======================================================
          LOCATION MODAL
      ====================================================== */}

      {showLocationForm && (

        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">

          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">

            <form
              onSubmit={handleAddLocation}
              className="p-6"
            >

              <div className="flex justify-between items-center mb-5">

                <h2 className="text-xl font-bold text-gray-800">
                  New Expense Allocation
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setShowLocationForm(false)
                  }
                >
                  ✕
                </button>

              </div>


              <div className="space-y-4">

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Allocation Name
                  </label>

                  <input
                    type="text"
                    value={locationName}
                    onChange={(event) =>
                      setLocationName(
                        event.target.value
                      )
                    }
                    placeholder="e.g. Kampala Branch"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  />

                </div>


                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>

                  <textarea
                    value={locationDescription}
                    onChange={(event) =>
                      setLocationDescription(
                        event.target.value
                      )
                    }
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5"
                  />

                </div>

              </div>


              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={() =>
                    setShowLocationForm(false)
                  }
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-purple-700 text-white rounded-lg"
                >
                  {saving
                    ? "Saving..."
                    : "Create Location"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
    </ProtectedRoute>
  );
}