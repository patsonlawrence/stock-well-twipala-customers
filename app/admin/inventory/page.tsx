"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";

interface Product {
  productId: string;
  productName: string;
  ProductPrice: number;
  productQty: number;
}

type SortField = "productName" | "ProductPrice" | "productQty";

export default function AdminInventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState("");
  const [ProductPrice, setProductPrice] = useState<number | "">("");
  const [productQty, setProductQty] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [sortField, setSortField] = useState<SortField>("productName");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // --------------------------------------------------
  // Load products
  // --------------------------------------------------

  const loadProducts = async () => {
    setLoading(true);

    try {
      const snap = await getDocs(collection(db, "products"));

      const list: Product[] = snap.docs.map((d) => ({
        productId: d.id,
        ...(d.data() as Omit<Product, "productId">),
      }));

      setProducts(list);
    } catch (err) {
      console.error("Failed to load products:", err);
      alert("Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // --------------------------------------------------
  // Filter + sort
  // --------------------------------------------------

  const filteredProducts = useMemo(() => {
    return [...products]
      .filter((p) =>
        p.productName.toLowerCase().includes(search.toLowerCase())
      )
      .sort((a, b) => {
        let comparison = 0;

        switch (sortField) {
          case "ProductPrice":
            comparison = a.ProductPrice - b.ProductPrice;
            break;

          case "productQty":
            comparison = a.productQty - b.productQty;
            break;

          case "productName":
          default:
            comparison = a.productName.localeCompare(b.productName);
            break;
        }

        return sortDirection === "asc" ? comparison : -comparison;
      });
  }, [products, search, sortField, sortDirection]);

  // --------------------------------------------------
  // Sort
  // --------------------------------------------------

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection((current) =>
        current === "asc" ? "desc" : "asc"
      );
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // --------------------------------------------------
  // Save product
  // --------------------------------------------------

  const saveProduct = async () => {
    if (
      !productName.trim() ||
      ProductPrice === "" ||
      ProductPrice <= 0 ||
      productQty === "" ||
      productQty <= 0
    ) {
      alert("Please enter a valid name, price, and quantity.");
      return;
    }

    setLoading(true);

    try {
      const data = {
        productName: productName.trim(),
        ProductPrice: Number(ProductPrice),
        productQty: Number(productQty),
      };

      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
        alert("Product updated!");
      } else {
        await addDoc(collection(db, "products"), data);
        alert("Product added!");
      }

      resetForm();
      await loadProducts();
    } catch (err: any) {
      console.error("SAVE ERROR:", err);
      alert("Error saving product: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Reset form
  // --------------------------------------------------

  const resetForm = () => {
    setProductName("");
    setProductPrice("");
    setProductQty("");
    setEditingId(null);
  };

  // --------------------------------------------------
  // Delete product
  // --------------------------------------------------

  const removeProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    setLoading(true);

    try {
      await deleteDoc(doc(db, "products", productId));

      alert("Product deleted!");

      await loadProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Edit product
  // --------------------------------------------------

  const editProduct = (product: Product) => {
    setProductName(product.productName);
    setProductPrice(product.ProductPrice);
    setProductQty(product.productQty);
    setEditingId(product.productId);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      alert("Logout failed");
    }
  };

  // --------------------------------------------------
  // Statistics
  // --------------------------------------------------

  const totalStock = products.reduce(
    (sum, product) => sum + product.productQty,
    0
  );

  const inventoryValue = products.reduce(
    (sum, product) =>
      sum + product.ProductPrice * product.productQty,
    0
  );

  return (
    <ProtectedRoute allowedRoles={["admin", "superuser", "manager"]}>
      <div className="min-h-screen bg-slate-100 text-slate-900">

        {/* ================= HEADER ================= */}

        <header className="bg-white border-b-2 border-slate-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

              <div>
                <h1 className="text-3xl font-extrabold text-slate-900">
                  Inventory Management
                </h1>

                <p className="mt-1 text-base text-slate-600">
                  Manage your products, prices and stock levels
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() =>
                    router.push("/dashboard/admindashboard")
                  }
                  className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold shadow-sm transition"
                >
                  Dashboard
                </button>

                <button
                  onClick={handleLogout}
                  className="px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold shadow-sm transition"
                >
                  Logout
                </button>
              </div>

            </div>
          </div>
        </header>

        {/* ================= MAIN ================= */}

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ================= STATISTICS ================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Products
              </p>

              <h2 className="text-4xl font-extrabold text-slate-900 mt-2">
                {products.length}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total products
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Total Stock
              </p>

              <h2 className="text-4xl font-extrabold text-slate-900 mt-2">
                {totalStock.toLocaleString()}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Units currently available
              </p>
            </div>

            <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Inventory Value
              </p>

              <h2 className="text-3xl font-extrabold text-green-700 mt-2">
                UGX {inventoryValue.toLocaleString()}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Total stock value
              </p>
            </div>

          </div>

          {/* ================= MAIN GRID ================= */}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* ================= FORM ================= */}

            <section className="bg-white rounded-2xl border-2 border-slate-200 shadow-lg p-6 lg:sticky lg:top-6 h-fit">

              <div className="mb-6">
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {editingId ? "Edit Product" : "Add Product"}
                </h2>

                <p className="mt-1 text-sm text-slate-600">
                  {editingId
                    ? "Update the product information below."
                    : "Enter the details below to add a product."}
                </p>
              </div>

              {/* Product Name */}

              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Product Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Coca Cola"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  disabled={loading}
                  className="
                    w-full
                    rounded-xl
                    border-2
                    border-slate-300
                    bg-white
                    text-slate-900
                    placeholder:text-slate-400
                    px-4
                    py-3.5
                    font-medium
                    outline-none
                    shadow-sm
                    focus:border-green-600
                    focus:ring-4
                    focus:ring-green-100
                    transition
                  "
                />
              </div>

              {/* Price */}

              <div className="mb-5">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Price (UGX)
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={ProductPrice}
                  onChange={(e) =>
                    setProductPrice(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                  disabled={loading}
                  className="
                    w-full
                    rounded-xl
                    border-2
                    border-slate-300
                    bg-white
                    text-slate-900
                    placeholder:text-slate-400
                    px-4
                    py-3.5
                    font-medium
                    outline-none
                    shadow-sm
                    focus:border-green-600
                    focus:ring-4
                    focus:ring-green-100
                    transition
                  "
                />
              </div>

              {/* Quantity */}

              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-800 mb-2">
                  Quantity
                </label>

                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={productQty}
                  onChange={(e) =>
                    setProductQty(
                      e.target.value === ""
                        ? ""
                        : Number(e.target.value)
                    )
                  }
                  disabled={loading}
                  className="
                    w-full
                    rounded-xl
                    border-2
                    border-slate-300
                    bg-white
                    text-slate-900
                    placeholder:text-slate-400
                    px-4
                    py-3.5
                    font-medium
                    outline-none
                    shadow-sm
                    focus:border-green-600
                    focus:ring-4
                    focus:ring-green-100
                    transition
                  "
                />
              </div>

              {/* Save */}

              <button
                onClick={saveProduct}
                disabled={loading}
                className="
                  w-full
                  bg-green-600
                  hover:bg-green-700
                  active:bg-green-800
                  text-white
                  font-bold
                  py-3.5
                  rounded-xl
                  shadow-sm
                  transition
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
              >
                {loading
                  ? "Saving..."
                  : editingId
                  ? "Update Product"
                  : "Add Product"}
              </button>

              {/* Cancel */}

              {editingId && (
                <button
                  onClick={resetForm}
                  disabled={loading}
                  className="
                    w-full
                    mt-3
                    border-2
                    border-slate-300
                    bg-white
                    text-slate-800
                    hover:bg-slate-100
                    font-bold
                    py-3.5
                    rounded-xl
                    transition
                  "
                >
                  Cancel Edit
                </button>
              )}

            </section>

            {/* ================= INVENTORY ================= */}

            <section className="lg:col-span-2 bg-white rounded-2xl border-2 border-slate-200 shadow-lg overflow-hidden">

              {/* Inventory Header */}

              <div className="p-6 border-b-2 border-slate-200">

                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">

                  <div>
                    <h2 className="text-2xl font-extrabold text-slate-900">
                      Inventory
                    </h2>

                    <p className="mt-1 text-slate-600">
                      Showing{" "}
                      <span className="font-bold text-slate-900">
                        {filteredProducts.length}
                      </span>{" "}
                      products
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">

                    {/* Search */}

                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="
                          w-full
                          sm:w-64
                          rounded-xl
                          border-2
                          border-slate-300
                          bg-white
                          text-slate-900
                          placeholder:text-slate-400
                          px-4
                          py-3
                          font-medium
                          outline-none
                          focus:border-green-600
                          focus:ring-4
                          focus:ring-green-100
                        "
                      />
                    </div>

                    {/* Sort */}

                    <select
                      value={`${sortField}-${sortDirection}`}
                      onChange={(e) => {
                        const [field, direction] =
                          e.target.value.split("-");

                        setSortField(field as SortField);
                        setSortDirection(
                          direction as "asc" | "desc"
                        );
                      }}
                      className="
                        rounded-xl
                        border-2
                        border-slate-300
                        bg-white
                        text-slate-900
                        px-4
                        py-3
                        font-semibold
                        outline-none
                        cursor-pointer
                        focus:border-green-600
                        focus:ring-4
                        focus:ring-green-100
                      "
                    >
                      <option value="productName-asc">
                        Name ↑
                      </option>

                      <option value="productName-desc">
                        Name ↓
                      </option>

                      <option value="ProductPrice-asc">
                        Price ↑
                      </option>

                      <option value="ProductPrice-desc">
                        Price ↓
                      </option>

                      <option value="productQty-asc">
                        Quantity ↑
                      </option>

                      <option value="productQty-desc">
                        Quantity ↓
                      </option>
                    </select>

                  </div>

                </div>
              </div>

              {/* ================= TABLE ================= */}

              <div className="overflow-x-auto">

                <table className="min-w-[900px] w-full">

                  <thead>
                    <tr className="bg-slate-800 text-white">

                      <th className="px-5 py-4 text-left text-sm font-bold">
                        #
                      </th>

                      <th
                        onClick={() =>
                          handleSort("productName")
                        }
                        className="
                          px-5
                          py-4
                          text-left
                          text-sm
                          font-bold
                          cursor-pointer
                          hover:bg-slate-700
                          whitespace-nowrap
                        "
                      >
                        Product{" "}
                        {sortField === "productName" &&
                          (sortDirection === "asc"
                            ? "▲"
                            : "▼")}
                      </th>

                      <th
                        onClick={() =>
                          handleSort("ProductPrice")
                        }
                        className="
                          px-5
                          py-4
                          text-right
                          text-sm
                          font-bold
                          cursor-pointer
                          hover:bg-slate-700
                          whitespace-nowrap
                        "
                      >
                        Price{" "}
                        {sortField === "ProductPrice" &&
                          (sortDirection === "asc"
                            ? "▲"
                            : "▼")}
                      </th>

                      <th
                        onClick={() =>
                          handleSort("productQty")
                        }
                        className="
                          px-5
                          py-4
                          text-center
                          text-sm
                          font-bold
                          cursor-pointer
                          hover:bg-slate-700
                          whitespace-nowrap
                        "
                      >
                        Quantity{" "}
                        {sortField === "productQty" &&
                          (sortDirection === "asc"
                            ? "▲"
                            : "▼")}
                      </th>

                      <th className="px-5 py-4 text-right text-sm font-bold">
                        Value
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold">
                        Status
                      </th>

                      <th className="px-5 py-4 text-center text-sm font-bold">
                        Actions
                      </th>

                    </tr>
                  </thead>

                  <tbody>

                    {filteredProducts.length === 0 && (
                      <tr>
                        <td
                          colSpan={7}
                          className="
                            px-5
                            py-16
                            text-center
                            text-slate-600
                            font-medium
                          "
                        >
                          No products found.
                        </td>
                      </tr>
                    )}

                    {filteredProducts.map((product, index) => {

                      const stockStatus =
                        product.productQty < 5
                          ? "Low Stock"
                          : product.productQty < 15
                          ? "Medium Stock"
                          : "In Stock";

                      const statusClasses =
                        product.productQty < 5
                          ? "bg-red-100 text-red-800 border-red-200"
                          : product.productQty < 15
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-green-100 text-green-800 border-green-200";

                      return (
                        <tr
                          key={product.productId}
                          className="
                            border-b
                            border-slate-200
                            odd:bg-white
                            even:bg-slate-50
                            hover:bg-green-50
                            transition
                          "
                        >

                          {/* Number */}

                          <td className="px-5 py-5 text-slate-500 font-semibold">
                            {index + 1}
                          </td>

                          {/* Product */}

                          <td className="px-5 py-5">
                            <span className="font-bold text-slate-900">
                              {product.productName}
                            </span>
                          </td>

                          {/* Price */}

                          <td className="px-5 py-5 text-right">
                            <span className="font-semibold text-slate-900 whitespace-nowrap">
                              UGX{" "}
                              {product.ProductPrice.toLocaleString()}
                            </span>
                          </td>

                          {/* Quantity */}

                          <td className="px-5 py-5 text-center">
                            <span
                              className={`
                                inline-flex
                                min-w-12
                                justify-center
                                px-3
                                py-1.5
                                rounded-full
                                text-sm
                                font-extrabold
                                border
                                ${statusClasses}
                              `}
                            >
                              {product.productQty}
                            </span>
                          </td>

                          {/* Value */}

                          <td className="px-5 py-5 text-right">
                            <span className="font-bold text-slate-900 whitespace-nowrap">
                              UGX{" "}
                              {(
                                product.ProductPrice *
                                product.productQty
                              ).toLocaleString()}
                            </span>
                          </td>

                          {/* Status */}

                          <td className="px-5 py-5 text-center">
                            <span
                              className={`
                                inline-flex
                                px-3
                                py-1.5
                                rounded-full
                                text-xs
                                font-bold
                                border
                                whitespace-nowrap
                                ${statusClasses}
                              `}
                            >
                              {stockStatus}
                            </span>
                          </td>

                          {/* Actions */}

                          <td className="px-5 py-5">
                            <div className="flex justify-center gap-2">

                              <button
                                onClick={() =>
                                  editProduct(product)
                                }
                                disabled={loading}
                                className="
                                  rounded-lg
                                  bg-blue-600
                                  hover:bg-blue-700
                                  text-white
                                  px-4
                                  py-2
                                  text-sm
                                  font-bold
                                  shadow-sm
                                  transition
                                  disabled:opacity-50
                                "
                              >
                                ✏ Edit
                              </button>

                              <button
                                onClick={() =>
                                  removeProduct(
                                    product.productId
                                  )
                                }
                                disabled={loading}
                                className="
                                  rounded-lg
                                  bg-red-600
                                  hover:bg-red-700
                                  text-white
                                  px-4
                                  py-2
                                  text-sm
                                  font-bold
                                  shadow-sm
                                  transition
                                  disabled:opacity-50
                                "
                              >
                                🗑 Delete
                              </button>

                            </div>
                          </td>

                        </tr>
                      );
                    })}

                  </tbody>

                </table>

              </div>

              {/* ================= TABLE FOOTER ================= */}

              <div className="border-t-2 border-slate-200 bg-slate-50 px-6 py-5">

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                  <p className="text-sm font-semibold text-slate-600">
                    Showing{" "}
                    <span className="text-slate-900 font-extrabold">
                      {filteredProducts.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-slate-900 font-extrabold">
                      {products.length}
                    </span>{" "}
                    products
                  </p>

                  <p className="text-sm font-semibold text-slate-600">
                    Total Inventory Value:{" "}
                    <span className="text-green-700 font-extrabold">
                      UGX{" "}
                      {filteredProducts
                        .reduce(
                          (sum, product) =>
                            sum +
                            product.ProductPrice *
                              product.productQty,
                          0
                        )
                        .toLocaleString()}
                    </span>
                  </p>

                </div>

              </div>

            </section>

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}