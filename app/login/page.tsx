'use client';

import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";

import {
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";

import { FirebaseError } from "firebase/app";

import { auth, db } from "@/lib/firebase";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface UserProfile {
  id: string;
  role: string;
  username?: string;
  email?: string;
}

async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const usersRef = collection(db, "users");

  const q = query(usersRef, where("uid", "==", uid));

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const userDoc = snapshot.docs[0];

  return {
    id: userDoc.id,
    ...(userDoc.data() as Omit<UserProfile, "id">),
  };
}
console.log(process.env.NEXT_PUBLIC_FIREBASE_API_KEY);

function getDashboardRoute(role: string): string {
  
  switch (role.trim().toLowerCase()) {
    case "admin":
      return "/dashboard/admindashboard";

    case "superuser":
      return "/dashboard/superuserdashboard";

    case "manager":
      return "/dashboard/managerdashboard";

    case "supervisor":
      return "/dashboard/supervisordashboard";

    case "sales":
      return "/dashboard/salesdashboard";

    case "customer":
    return "/dashboard/customerdashboard";

    default:
      return "/";

  }
}

export default function Login() {
  
  const router = useRouter();

  const [input, setInput] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const { id, value, checked, type } = e.target;

  setInput((prev) => ({
    ...prev,
    [id]: type === "checkbox" ? checked : value,
  }));
};

  // Redirect if already logged in
  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
      
      const profile = await getUserProfile(user.uid);
      console.log("Searching for UID:", user.uid);

if (!profile) {
  alert("Your account profile was not found. Please contact the administrator.");
  return;
}

if (!profile.role) {
  alert("Your account has no assigned role.");
  return;
}

router.replace(getDashboardRoute(profile.role));
    } catch (error) {
      console.error(error);
      router.replace("/");
    }
  });

  return unsubscribe;
}, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();    

    setLoading(true);
    try {
      await setPersistence(
  auth,
  input.remember
    ? browserLocalPersistence
    : browserSessionPersistence
);

      const credential = await signInWithEmailAndPassword(
  auth,
  input.email.trim().toLowerCase(),
  input.password
);

const profile = await getUserProfile(credential.user.uid);

if (!profile) {
  alert("Your account profile was not found.");
  return;
}

if (!profile.role) {
  alert("Your account has no assigned role.");
  return;
}

router.replace(getDashboardRoute(profile.role));
    } catch (error) {
  const err = error as FirebaseError;

  switch (err.code) {
  case "auth/invalid-credential":
    alert("Incorrect email or password.");
    break;

  case "auth/user-disabled":
    alert("This account has been disabled.");
    break;

  case "auth/too-many-requests":
    alert("Too many failed attempts. Try again later.");
    break;

  case "auth/network-request-failed":
    alert("Network error. Check your internet connection.");
    break;

  default:
    alert(err.message);
}
   }finally {
  setLoading(false);
}
  };

  return (
    <>
      <Head>
      <title>Twipala Login</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-md">

          <Image
          src="/icons/twipalalogo.PNG"
          alt="Twipala Logo"
          width={100}
          height={100}
          className="mx-auto mb-4 rounded-full object-cover"
          />

          <h2 className="text-2xl font-bold text-center mb-6">
            Twipala Login
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-600"
              >
                Email Address
              </label>

              <input
                type="email"
                id="email"
                value={input.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-600"
              >
                Password
              </label>

              <input
                type="password"
                id="password"
                value={input.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                className="w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <label className="flex items-center text-sm text-gray-600">
              <input
                type="checkbox"
                id="remember"
                checked={input.remember}
                onChange={handleChange}
                className="mr-2"
              />
              Remember Me
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>

          </form>

          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-500">
              Sign up
            </Link>
          </p>

          <button
            onClick={() => router.push('/')}
            className="fixed bottom-5 left-1/2 -translate-x-1/2 bg-gray-600 text-white px-6 py-3 rounded-full w-1/2"
          >
            Home
          </button>

        </div>
      </div>
    </>
  );
}
