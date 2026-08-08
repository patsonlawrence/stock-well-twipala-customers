"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/app/components/ProtectedRoute";
// ----- Product Type -----
interface Product {
  productId: string;
  productName: string;
  ProductPrice: number;
  productQty: number;
}

export default function AdminInventoryPage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [productName, setProductName] = useState("");
  const [ProductPrice, setProductPrice] = useState<number | "">("");
  const [productQty, setProductQty] = useState<number | "">("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
const [sortBy, setSortBy] = useState("name");
const [sortField, setSortField] = useState<
  "productName" | "ProductPrice" | "productQty"
>("productName");

const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Load products
  const loadProducts = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "products"));
      const list: Product[] = snap.docs.map((d) => ({ productId: d.id, ...(d.data() as any) }));
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

  const filteredProducts = [...products]
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

      default:
        comparison = a.productName.localeCompare(b.productName);
    }

    return sortDirection === "asc"
      ? comparison
      : -comparison;
  });

  const handleSort = (
  field: "productName" | "ProductPrice" | "productQty"
) => {
  if (field === sortField) {
    setSortDirection(sortDirection === "asc" ? "desc" : "asc");
  } else {
    setSortField(field);
    setSortDirection("asc");
  }
};

  // Add/Edit product
  const saveProduct = async () => {
    if (!productName.trim() || ProductPrice === "" || ProductPrice <= 0 || productQty === "" || productQty <= 0) {
      alert("Please enter a valid name, price, and quantity.");
      return;
    }

    setLoading(true);
    try {
      const data = { productName: productName.trim(), ProductPrice: Number(ProductPrice), productQty: Number(productQty) };
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), data);
        alert("Product updated!");
      } else {
        await addDoc(collection(db, "products"), data);
        alert("Product added!");
      }

      // Reset form
      setProductName("");
      setProductPrice("");
      setProductQty("");
      setEditingId(null);
      loadProducts();
    } catch (err: any) {
      console.error("SAVE ERROR:", err);
      alert("Error saving product: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Delete product
  const removeProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "products", productId));
      alert("Product deleted!");
      loadProducts();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    } finally {
      setLoading(false);
    }
  };

  // Edit product
  const editProduct = (p: Product) => {
    setProductName(p.productName);
    setProductPrice(p.ProductPrice);
    setProductQty(p.productQty);
    setEditingId(p.productId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
    } catch (err: any) {
      console.error("Logout failed:", err.message);
      alert("Logout failed");
    }
  }; 

  return (
    <ProtectedRoute allowedRoles={["admin","superuser","manager"]}>
<div className="min-h-screen bg-slate-300">

    {/* Header */}

    <header className="bg-white shadow-sm border-b">

        <div className="max-w-7xl mx-auto px-8 py-6 flex justify-between items-center">

            <div>

                <h1 className="text-3xl font-bold text-slate-800">
                    Inventory Management
                </h1>

                <p className="text-slate-500">
                    Manage your products and stock
                </p>

            </div>

            <div className="flex gap-4">

                <button
                onClick={() => router.push("/dashboard/admindashboard")}
                className="px-5 py-2 rounded-lg bg-slate-700 hover:bg-slate-800 text-white transition">

                    Dashboard

                </button>

                <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition">

                    Logout

                </button>

            </div>

        </div>

    </header>

    <main className="max-w-7xl mx-auto p-8">

        {/* Statistics */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

            <div className="bg-white rounded-xl shadow p-6">

                <p className="text-gray-500">
                    Products
                </p>

                <h2 className="text-4xl font-bold mt-2">
                    {products.length}
                </h2>

            </div>

            <div className="bg-white rounded-xl shadow p-6">

                <p className="text-gray-500">
                    Total Stock
                </p>

                <h2 className="text-4xl font-bold mt-2">

                    {products.reduce((sum,p)=>sum+p.productQty,0)}

                </h2>

            </div>

            <div className="bg-white rounded-xl shadow p-6">

                <p className="text-gray-500">
                    Inventory Value
                </p>

                <h2 className="text-3xl font-bold mt-2 text-green-600">

                    UGX {products
                        .reduce((sum,p)=>sum+p.ProductPrice*p.productQty,0)
                        .toLocaleString()}

                </h2>

            </div>

        </div>

        {/* Main Grid */}

        <div className="grid lg:grid-cols-3 gap-8">

            {/* Left */}

            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 sticky top-6">

  <div className="mb-6">
    <h2 className="text-2xl font-bold text-slate-800">
      {editingId ? "✏️ Edit Product" : "➕ Add Product"}
    </h2>

    <p className="text-sm text-slate-500 mt-1">
      {editingId
        ? "Update product information."
        : "Fill in the details below to add a new product."}
    </p>
  </div>

  {/* Product Name */}

  <div className="mb-5">

    <label className="block text-sm font-semibold text-slate-700 mb-2">
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
        border
        border-slate-300
        px-4
        py-3
        outline-none
        focus:ring-2
        focus:ring-green-500
        focus:border-green-500
        transition
      "
    />

  </div>

  {/* Price */}

  <div className="mb-5">

    <label className="block text-sm font-semibold text-slate-700 mb-2">
      Price (UGX)
    </label>

    <input
      type="number"
      placeholder="0"
      value={ProductPrice}
      onChange={(e) =>
        setProductPrice(
          e.target.value === "" ? "" : Number(e.target.value)
        )
      }
      disabled={loading}
      className="
        w-full
        rounded-xl
        border
        border-slate-300
        px-4
        py-3
        outline-none
        focus:ring-2
        focus:ring-green-500
        transition
      "
    />

  </div>

  {/* Quantity */}

  <div className="mb-6">

    <label className="block text-sm font-semibold text-slate-700 mb-2">
      Quantity
    </label>

    <input
      type="number"
      placeholder="0"
      value={productQty}
      onChange={(e) =>
        setProductQty(
          e.target.value === "" ? "" : Number(e.target.value)
        )
      }
      disabled={loading}
      className="
        w-full
        rounded-xl
        border
        border-slate-300
        px-4
        py-3
        outline-none
        focus:ring-2
        focus:ring-green-500
        transition
      "
    />

  </div>

  {/* Buttons */}

  <div className="space-y-3">

    <button
      onClick={saveProduct}
      disabled={loading}
      className="
        w-full
        bg-green-600
        hover:bg-green-700
        text-white
        font-semibold
        py-3
        rounded-xl
        transition
        disabled:opacity-50
      "
    >
      {loading
        ? "Saving..."
        : editingId
        ? "Update Product"
        : "Add Product"}
    </button>

    {editingId && (
      <button
        onClick={() => {
          setEditingId(null);
          setProductName("");
          setProductPrice("");
          setProductQty("");
        }}
        className="
          w-full
          border
          border-slate-300
          hover:bg-slate-100
          py-3
          rounded-xl
          transition
        "
      >
        Cancel Edit
      </button>
    )}

  </div>

</div>

            {/* Right */}

            <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg border border-slate-200 p-6">

  {/* Header */}

  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">

    <div>

      <h2 className="text-2xl font-bold text-slate-800">
        Inventory
      </h2>

      <p className="text-slate-500">
        {filteredProducts.length} products
      </p>

    </div>

    <div className="flex gap-3">

      <input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded-xl px-4 py-2 w-60 focus:ring-2 focus:ring-green-500 outline-none"
      />

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="border rounded-xl px-4 py-2"
      >
        <option value="name">Sort: Name</option>
        <option value="price">Sort: Price</option>
        <option value="qty">Sort: Quantity</option>
      </select>

    </div>

  </div>

  {/* Table */}

  <div className="overflow-x-auto">

    <table className="min-w-full">

      <thead>

        <tr className="border-b bg-slate-50">

          <th
  onClick={() => handleSort("productName")}
  className="cursor-pointer p-4 text-left hover:text-green-600"
>
  Product
  {sortField === "productName" &&
    (sortDirection === "asc" ? " ▲" : " ▼")}
</th>

          <th
  onClick={() => handleSort("ProductPrice")}
  className="cursor-pointer p-4 text-right hover:text-green-600"
>
  Name
  {sortField === "ProductPrice" &&
    (sortDirection === "asc" ? " ▲" : " ▼")}
</th>

          <th
  onClick={() => handleSort("productQty")}
  className="cursor-pointer p-4 text-right hover:text-green-600"
>
  Price
  {sortField === "productQty" &&
    (sortDirection === "asc" ? " ▲" : " ▼")}
</th>
<th className="p-4 w-16">
#
</th>


          <th className="text-right p-4">Value</th>

          <th className="text-center p-4">Status</th>

          <th className="text-center p-4">Actions</th>

        </tr>

      </thead>

      <tbody>

        {filteredProducts.length === 0 && (

          <tr>

            <td
              colSpan={6}
              className="text-center py-12 text-slate-500"
            >
              No products found.
            </td>

          </tr>

        )}

        {filteredProducts.map((p, index) => (

          <tr
            key={p.productId}
            className="border-b hover:bg-slate-50 transition"
          >
            <td className="p-4 text-slate-500">
              {index + 1}
            </td>

            <td className="p-4 font-semibold">
              {p.productName}
            </td>

            <td className="text-right p-4">
              UGX {p.ProductPrice.toLocaleString()}
            </td>

            <td className="text-right p-4">

<span
className={`px-3 py-1 rounded-full text-sm font-semibold
${
p.productQty < 5
? "bg-red-100 text-red-700"
: p.productQty < 15
? "bg-yellow-100 text-yellow-700"
: "bg-green-100 text-green-700"
}`}>

{p.productQty}

</span>

</td>

            <td className="text-right p-4 font-semibold">

              UGX {(p.ProductPrice * p.productQty).toLocaleString()}

            </td>

            <td className="text-center p-4">

              {p.productQty < 5 ? (

                <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-medium">
                  Low Stock
                </span>

              ) : (

                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                  In Stock
                </span>

              )}

            </td>

            <td className="text-center p-4">

              <div className="flex justify-center gap-2">

<button
onClick={()=>editProduct(p)}
className="rounded-lg bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 transition">

✏ Edit

</button>

<button
onClick={()=>removeProduct(p.productId)}
className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-4 py-2 transition">

🗑 Delete

</button>

</div>

            </td>

          </tr>

        ))}

      </tbody>

    </table>
    <div className="mt-6 border-t pt-4 flex justify-between">

<p className="text-gray-500">

Showing .

<strong>

 {filteredProducts.length}

</strong>

. products

</p>

<p className="font-semibold">

Total Inventory Value

UGX {filteredProducts
.reduce(
(sum,p)=>sum+p.ProductPrice*p.productQty,
0
)
.toLocaleString()}

</p>

</div>

  </div>

</div>

        </div>

    </main>

</div>
</ProtectedRoute>
);
}

// ----- Styles -----
const styles = {
  card: { padding: "15px", background: "#f5f5f5", borderRadius: "10px", marginBottom: "20px" },
  input: { width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" },
  saveBtn: { width: "100%", padding: "12px", background: "green", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
  cancelBtn: { width: "100%", padding: "12px", background: "gray", color: "white", borderRadius: "6px", border: "none", marginTop: "8px", cursor: "pointer" },
  itemRow: { display: "flex", justifyContent: "space-between", background: "#eee", padding: "12px", borderRadius: "8px", marginBottom: "10px" },
  editBtn: { padding: "8px 12px", marginRight: "6px", background: "#007bff", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
  deleteBtn: { padding: "8px 12px", background: "red", color: "white", borderRadius: "6px", border: "none", cursor: "pointer" },
  backBtn: { marginBottom: 20, padding: "8px 12px", backgroundColor: "gray", color: "#fff", border: "none", borderRadius: 5, cursor: "pointer" },
  logoutBtn: {
    position: "fixed",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "white",
    color: "green",
    padding: "0.75rem 1.5rem",
    border: "none",
    borderRadius: "1.75rem",
    cursor: "pointer",
    fontWeight: 500,
    fontSize: "1rem",
    width: "75%",
    zIndex: 1000,
    textAlign: "center",
    boxShadow: "0px 2px 8px rgba(0,0,0,0.2)",
  },
};
