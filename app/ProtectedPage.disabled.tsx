"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase-auth";
import { useRouter, usePathname } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDefaultRouteForRole } from "@/lib/role-routing";

export default function ProtectedPage({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkRoleAccess = async () => {
      const user = auth.currentUser;

      if (!user) {
        router.push("/login");
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (!userDoc.exists()) {
        alert("User record missing in Firestore.");
        router.push("/login");
        return;
      }

      let role = userDoc.data()?.role?.toLowerCase().trim();

      if (!role) {
        alert("No role found for this user!");
        router.push("/login");
        return;
      }

      // The route they should be allowed on
      const allowedPath = getDefaultRouteForRole(role);

      // If they try entering a dashboard that isn't theirs:
      if (!pathname.startsWith(allowedPath)) {
        alert("Access denied!");
        router.push(allowedPath);
        return;
      }

      setLoading(false);
    };

    checkRoleAccess();
  }, [pathname, router]);

  if (loading) return <div>Loading...</div>;

  return <>{children}</>;
}
