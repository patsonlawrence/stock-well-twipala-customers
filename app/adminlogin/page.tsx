"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-auth"; // we'll create this next
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  

const login = async () => {
  setLoading(true);
  try {
    // Sign in with email/password
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    // Query Firestore 'users' collection by email
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error("User document not found in Firestore");
    }

    const userDoc = querySnapshot.docs[0]; // take the first matching document
    let role = userDoc.data()?.role;

    if (!role) throw new Error("No role assigned to this user");

    role = role.toLowerCase().trim(); // normalize role
    const defaultRoute = getDefaultRouteForRole(role);

    console.log("Redirecting to:", defaultRoute);
    router.push(defaultRoute);

  } catch (err: any) {
    alert(err.message);
    console.error(err);
  }
  setLoading(false);
};


  return (
    <div style={{ padding: 30, maxWidth: 400, margin: "50px auto" }}>
      <h2>🔐 Admin Login</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={styles.input}
      />

      <button onClick={login} style={styles.button} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
      <button
      onClick={() => router.push('/')}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: 'gray',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '1rem',
          width: '50%',
          zIndex: 1000,
        }}
      >
        Home
      </button> 
    </div>
  );
}

const styles = {
  input: {
    width: "100%",
    padding: 12,
    margin: "10px 0",
    borderRadius: 6,
    border: "1px solid #ccc",
  },
  button: {
    width: "100%",
    padding: 12,
    background: "black",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    marginTop: 10,
  },
};
function getDefaultRouteForRole(role: string): string {
  if (!role) return "/";

  switch (role) {
    case "admin":
      return "/dashboard/admindashboard"; // Admin Dashboard
    case "superuser":
      return "/dashboard/superuserdashboard"; // Superuser Dashboard
    case "manager":
      return "/dashboard/managerdashboard"; // Manager Dashboard
    case "sales":
      return "/dashboard/salesdashboard"; // Sales Team Dashboard
    case "supervisor":
      return "/dashboard/supervisordashboard"; // Supervisor Dashboard
    case "customer":
      return "/dashboard/customerdashboard"; // Customer Dashboard
    default:
      return "/"; // fallback
  }
}


