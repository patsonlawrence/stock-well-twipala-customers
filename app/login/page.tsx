"use client";

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

async function getUserProfile(
  uid: string
): Promise<UserProfile | null> {
  const usersRef = collection(db, "users");

  const q = query(
    usersRef,
    where("uid", "==", uid)
  );

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
    email: "",
    password: "",
    remember: false,
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { id, value, checked, type } = e.target;

    setInput((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  /*
   * Redirect if already logged in
   */
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        if (!user) return;

        try {
          const profile = await getUserProfile(user.uid);

          if (!profile) {
            alert(
              "Your account profile was not found. Please contact the administrator."
            );
            return;
          }

          if (!profile.role) {
            alert(
              "Your account has no assigned role."
            );
            return;
          }

          router.replace(
            getDashboardRoute(profile.role)
          );
        } catch (error) {
          console.error(error);
          router.replace("/");
        }
      }
    );

    return unsubscribe;
  }, [router]);

  /*
   * Login
   */
  const handleLogin = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      await setPersistence(
        auth,
        input.remember
          ? browserLocalPersistence
          : browserSessionPersistence
      );

      const credential =
        await signInWithEmailAndPassword(
          auth,
          input.email.trim().toLowerCase(),
          input.password
        );

      const profile = await getUserProfile(
        credential.user.uid
      );

      if (!profile) {
        alert(
          "Your account profile was not found."
        );
        return;
      }

      if (!profile.role) {
        alert(
          "Your account has no assigned role."
        );
        return;
      }

      router.replace(
        getDashboardRoute(profile.role)
      );
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
          alert(
            "Too many failed attempts. Try again later."
          );
          break;

        case "auth/network-request-failed":
          alert(
            "Network error. Check your internet connection."
          );
          break;

        default:
          alert(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#031b10] text-white">

      {/* Background gradients */}
      <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-500/10 blur-[100px]" />

      <div className="absolute -bottom-40 -right-32 h-[450px] w-[450px] rounded-full bg-green-400/10 blur-[120px]" />

      <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-600/5 blur-[100px]" />

      {/* Page content */}
      <div className="relative z-10 flex min-h-screen items-center justify-center px-5 py-10">

        <div className="w-full max-w-md">

          {/* Brand */}
          <div className="mb-7 text-center">

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mx-auto mb-5 block transition-transform duration-300 hover:scale-105"
            >
              <div className="relative mx-auto h-24 w-24 overflow-hidden rounded-[28px] border border-white/20 bg-white/10 p-1 shadow-2xl shadow-black/30 backdrop-blur-xl">

                <Image
                  src="/icons/twipalalogo.PNG"
                  alt="Twipala Logo"
                  fill
                  sizes="96px"
                  className="rounded-[23px] object-cover"
                  priority
                />

              </div>
            </button>

            <div className="mb-2 flex items-center justify-center gap-2">

              <span className="text-2xl font-black tracking-[0.15em]">
                TWIPALA
              </span>

            </div>

            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange-400">
              Let's Grow Together
            </p>

          </div>

          {/* Login card */}
          <div className="rounded-[30px] border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">

            {/* Card heading */}
            <div className="mb-7 text-center">

              <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.3em] text-orange-400">
                Welcome Back
              </p>

              <h1 className="text-3xl font-extrabold tracking-tight">
                Sign in to Twipala
              </h1>

              <p className="mt-2 text-sm leading-6 text-white/50">
                Enter your credentials to continue
                to your account.
              </p>

            </div>

            <form
              onSubmit={handleLogin}
              className="space-y-5"
            >

              {/* Email */}
              <div>

                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/60"
                >
                  Email Address
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                    @
                  </span>

                  <input
                    type="email"
                    id="email"
                    value={input.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60 focus:bg-black/30 focus:ring-2 focus:ring-orange-400/10"
                  />

                </div>

              </div>

              {/* Password */}
              <div>

                <label
                  htmlFor="password"
                  className="mb-2 block text-xs font-bold uppercase tracking-wider text-white/60"
                >
                  Password
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-orange-400">
                    ●
                  </span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    id="password"
                    value={input.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    required
                    autoComplete="current-password"
                    className="w-full rounded-2xl border border-white/10 bg-black/20 py-3.5 pl-11 pr-14 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-400/60 focus:bg-black/30 focus:ring-2 focus:ring-orange-400/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl px-2 py-1.5 text-xs font-bold text-white/40 transition hover:bg-white/10 hover:text-orange-400"
                  >
                    {showPassword
                      ? "Hide"
                      : "Show"}
                  </button>

                </div>

              </div>

              {/* Remember me */}
              <label className="flex cursor-pointer items-center gap-3 text-sm text-white/55">

                <input
                  type="checkbox"
                  id="remember"
                  checked={input.remember}
                  onChange={handleChange}
                  className="h-4 w-4 cursor-pointer accent-orange-500"
                />

                <span>
                  Remember me
                </span>

              </label>

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-orange-900/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-900/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >

                <span>
                  {loading
                    ? "Signing in..."
                    : "Sign In"}
                </span>

                {!loading && (
                  <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                    →
                  </span>
                )}

              </button>

            </form>

            {/* Divider */}
            <div className="my-7 flex items-center gap-4">

              <div className="h-px flex-1 bg-white/10" />

              <span className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                Account
              </span>

              <div className="h-px flex-1 bg-white/10" />

            </div>

            {/* Sign up */}
            <p className="text-center text-sm text-white/50">

              Don't have an account?{" "}

              <Link
                href="/signup"
                className="font-bold text-orange-400 transition hover:text-orange-300"
              >
                Create one
              </Link>

            </p>

          </div>

          {/* Home button */}
          <button
            type="button"
            onClick={() => router.push("/")}
            className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-6 py-3 text-xs font-bold text-white/50 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <span>←</span>
            Back to Home
          </button>

          {/* Footer */}
          <p className="mt-7 text-center text-[10px] uppercase tracking-[0.25em] text-white/20">
            © {new Date().getFullYear()} Twipala
          </p>

        </div>

      </div>

    </main>
  );
}