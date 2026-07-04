"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { useRouter } from 'next/navigation';

import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";


interface User {
  id: string;
  uid: string;
  email: string;
  username: string;
  role: string;
  retired?: boolean;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);

  // Load users
  const loadUsers = async () => {
    const snapshot = await getDocs(collection(db, "users"));
    const list = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as User[];
    setUsers(list);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Create or update user
  const handleSubmit = async () => {
  if (!email || !username || !role) {
    alert("Fill all fields!");
    return;
  }

  setLoading(true);
  try {
    if (editUserId) {
      // Edit user
      await updateDoc(doc(db, "users", editUserId), {
        email,
        username,
        role,
      });
      alert("User updated!");
    } else {
      // Create user with default password "123456"
      const defaultPassword = "123456";

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        defaultPassword
      );

      await addDoc(collection(db, "users"), {
  uid: userCredential.user.uid,
  email,
  username,
  role,
  retired: false,
  defaultPassword: true, // ← important
});


      alert(`User created! Default password is ${defaultPassword}`);
    }

    setEmail("");
    setUsername("");
    setRole("");
    setEditUserId(null);
    loadUsers();
  } catch (err: any) {
    alert(err.message);
  }
  setLoading(false);
};

  const handleEdit = (user: User) => {
    setEditUserId(user.id);
    setEmail(user.email);
    setUsername(user.username);
    setRole(user.role);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Delete this user permanently?")) return;
    await deleteDoc(doc(db, "users", userId));
    loadUsers();
  };

  const handleRetire = async (user: User) => {
    await updateDoc(doc(db, "users", user.id), {
      retired: true,
    });
    loadUsers();
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
      <h2>{editUserId ? "Edit User" : "Add User"}</h2>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={styles.input}
      />
      {!editUserId && (
        <input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
      )}
      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        style={styles.input}
      />
      <select
  value={role}
  onChange={(e) => setRole(e.target.value)}
  style={styles.input}
>
  <option value="">Select role...</option>
  <option value="admin">Admin</option>
  <option value="superuser">Superuser</option>
  <option value="manager">Manager</option>
  <option value="sales">Sales</option>
  <option value="supervisor">Supervisor</option>
  <option value="customer">Customer</option>
</select>

      <button onClick={handleSubmit} style={styles.button} disabled={loading}>
        {loading ? "Saving..." : editUserId ? "Update User" : "Create User"}
      </button>

      <hr style={{ margin: "20px 0" }} />
      <h3>Users</h3>
      <ul>
        {users.map((user) => (
          <li
            key={user.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: 8,
              background: user.retired ? "#eee" : "#fff",
              marginBottom: 6,
            }}
          >
            <span>
              {user.username} ({user.email}) - {user.role}{" "}
              {user.retired && "(Retired)"}
            </span>
            <span>
              {!user.retired && (
                <>
                  <button onClick={() => handleEdit(user)} style={styles.smallBtn}>
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRetire(user)}
                    style={styles.smallBtn}
                  >
                    🛑
                  </button>
                </>
              )}
              <button
                onClick={() => handleDelete(user.id)}
                style={styles.smallBtnRed}
              >
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
    color: "red",
  },
};
