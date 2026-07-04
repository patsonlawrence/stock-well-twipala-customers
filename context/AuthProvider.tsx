"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase-auth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type AuthContextType = {
  user: User | null;
  role: string | null;
  loading: boolean;
  defaultPassword: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  defaultPassword: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [defaultPassword, setDefaultPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setRole(null);
        setDefaultPassword(false);
        setLoading(false);
        return;
      }

      const snap = await getDoc(doc(db, "users", firebaseUser.uid));

      setUser(firebaseUser);
      setRole(snap.data()?.role || null);
      setDefaultPassword(snap.data()?.defaultPassword ?? false);
      setLoading(false);
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, loading, defaultPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
