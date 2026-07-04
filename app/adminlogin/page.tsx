"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { useRouter } from "next/navigation";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentUserDocId, setCurrentUserDocId] = useState("");

  const login = async () => {
    setLoading(true);
    try {
      // Sign in with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // Query Firestore user document
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) throw new Error("User document not found in Firestore");

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const username = userData?.username || "User";
      const role = userData?.role;
      const defaultPassword = userData?.defaultPassword || false;

      setCurrentUserDocId(userDoc.id);

      if (!role) throw new Error("No role assigned to this user");

      // Save user details to localStorage
      localStorage.setItem("userEmail", email);
      localStorage.setItem("userName", username);
      localStorage.setItem("userRole", role);
      

      // If user has default password, show modal
      if (defaultPassword) {
        setShowPasswordModal(true);
      } else {
        // Redirect immediately
        const defaultRoute = getDefaultRouteForRole(role.toLowerCase().trim());
        router.push(defaultRoute);
      }

    } catch (err: any) {
      alert(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    try {
      // Update Firebase Auth password
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }

      // Update Firestore user document to mark password changed
      await updateDoc(doc(db, "users", currentUserDocId), {
        defaultPassword: false,
      });

      alert("Password updated successfully!");
      setShowPasswordModal(false);

      const role = localStorage.getItem("userRole") || "customer";
      const defaultRoute = getDefaultRouteForRole(role.toLowerCase().trim());
      router.push(defaultRoute);

    } catch (err: any) {
      console.error(err);
      alert("Failed to update password: " + err.message);
    }
  };

  return (
    <div style={{ padding: 30, maxWidth: 400, margin: "50px auto" }}>
      <h2>🔐 Staff Login</h2>

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

      {showPasswordModal && (
        <div style={modalStyles.overlay}>
          <div style={modalStyles.modal}>
            <h3>Change Default Password</h3>
            <input
              type="password"
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={styles.input}
            />
            <button onClick={handlePasswordChange} style={styles.button}>
              Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  input: { width: "100%", padding: 12, margin: "10px 0", borderRadius: 6, border: "1px solid #ccc" },
  button: { width: "100%", padding: 12, background: "black", color: "white", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 10 },
};

const modalStyles: { overlay: React.CSSProperties; modal: React.CSSProperties } = {
  overlay: {
    position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center",
  },
  modal: {
    backgroundColor: "#fff", padding: 20, borderRadius: 8, width: 300, textAlign: "center",
  },
};

function getDefaultRouteForRole(role: string): string {
  switch (role) {
    case "admin": return "/dashboard/admindashboard";
    case "superuser": return "/dashboard/superuserdashboard";
    case "manager": return "/dashboard/managerdashboard";
    case "sales": return "/dashboard/salesdashboard";
    case "supervisor": return "/dashboard/supervisordashboard";
    case "customer": return "/dashboard/customerdashboard";
    default: return "/";
  }
}
