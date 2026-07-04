"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

interface Outlet {
  id: string;
  name: string;
  tin: string;
  phone: string;
  email: string;
  address?: string;
  retired?: boolean;
}

export default function OutletsPage() {
  const router = useRouter();

  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [name, setName] = useState("");
  const [tin, setTin] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [editOutletId, setEditOutletId] = useState<string | null>(null);

  // Load outlets from Firestore
  const loadOutlets = async () => {
    const snapshot = await getDocs(collection(db, "Outlets"));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Outlet[];
    setOutlets(list);
  };

  useEffect(() => {
    loadOutlets();
  }, []);

  // Add or update outlets
  const handleSubmit = async () => {
    if (!name || !tin || !phone || !email) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);

    try {
      if (editOutletId) {
        // Update Outlet
        await updateDoc(doc(db, "Outlets", editOutletId), {
          name,
          tin,
          phone,
          email,
          address,
        });
        alert("Outlet updated successfully!");
      } else {
        // Add new Outlet
        await addDoc(collection(db, "Outlets"), {
          name,
          tin,
          phone,
          email,
          address,
          retired: false,
        });
        alert("Outlet added successfully!");
      }

      // Reset form
      setName("");
      setTin("");
      setPhone("");
      setEmail("");
      setAddress("");
      setEditOutletId(null);

      // Reload list
      loadOutlets();
    } catch (err: any) {
      console.error(err);
      alert("Error: " + err.message);
    }

    setLoading(false);
  };

  // Edit Outlet
  const handleEdit = (outlet: Outlet) => {
    setEditOutletId(outlet.id);
    setName(outlet.name);
    setTin(outlet.tin);
    setPhone(outlet.phone);
    setEmail(outlet.email);
    setAddress(outlet.address || "");
  };

  // Delete outlet
  const handleDelete = async (outletId: string) => {
    if (!confirm("Delete this Outlet permanently?")) return;
    await deleteDoc(doc(db, "Outlets", outletId));
    loadOutlets();
  };

  // Retire outlet
  const handleRetire = async (outlet: Outlet) => {
    await updateDoc(doc(db, "outlet", outlet.id), {
      retired: true,
    });
    loadOutlets();
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard/admindashboard")}
        style={{
          marginBottom: 20,
          padding: "8px 12px",
          backgroundColor: "gray",
          color: "#fff",
          border: "none",
          borderRadius: 5,
          cursor: "pointer",
        }}
      >
        🔙 Back to Admin
      </button>

      <h2>{editOutletId ? "Edit Outlet" : "Add Outlet"}</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        style={styles.input}
      />
      <input
        placeholder="TIN"
        value={tin}
        onChange={(e) => setTin(e.target.value)}
        style={styles.input}
      />
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={styles.input}
      />
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />
      <input
        placeholder="Address (optional)"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        style={styles.input}
      />

      <button onClick={handleSubmit} style={styles.button} disabled={loading}>
        {loading ? "Saving..." : editOutletId ? "Update Outlet" : "Add Outlet"}
      </button>
      <hr style={{ margin: "20px 0" }} />
      <h3>Outlets</h3>
      <ul>
        {outlets.map((outlet) => (
          <li
            key={outlet.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 8,
              background: outlet.retired ? "#eee" : "#888",
              marginBottom: 6,
            }}
          >
            <span>
              {outlet.name} ({outlet.email}) - {outlet.phone}{" "}
              {outlet.retired && "(Retired)"}
            </span>
            <span>
              {!outlet.retired && (
                <>
                  <button onClick={() => handleEdit(outlet)} style={styles.smallBtn}>
                    ✏️
                  </button>
                  <button onClick={() => handleRetire(outlet)} style={styles.smallBtn}>
                    🛑
                  </button>
                </>
              )}
              <button onClick={() => handleDelete(outlet.id)} style={styles.smallBtnRed}>
                🗑️
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const styles: any = {
  input: {
    width: "100%",
    padding: 8,
    marginBottom: 10,
    borderRadius: 5,
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: 10,
    background: "green",
    color: "#fff",
    border: "none",
    borderRadius: 5,
    cursor: "pointer",
  },
  smallBtn: {
    marginRight: 5,
    cursor: "pointer",
    padding: 4,
    borderRadius: 4,
    border: "1px solid #888",
    background: "#fff",
  },
  smallBtnRed: {
    cursor: "pointer",
    padding: 4,
    borderRadius: 4,
    border: "1px solid red",
    background: "#fff",
  },
};  