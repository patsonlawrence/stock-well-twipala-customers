'use client';

import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase'; // Adjust this path if needed

export default function Login() {
  const router = useRouter();

  const [input, setInput] = useState({
    email: '',
    password: '',
    remember: false,
  });

  const [loading, setLoading] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.push('/dashboard');
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;

    setInput((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);

    try {
      await signInWithEmailAndPassword(
    auth,
    input.email.trim().toLowerCase(),
    input.password
);

      alert('Login successful!');
      router.push('/dashboard');
    } catch (error: any) {
      console.error(error);

      switch (error.code) {
        case 'auth/invalid-credential':
          alert('Incorrect email or password.');
          break;

        case 'auth/user-not-found':
          alert('No account found with this email.');
          break;

        case 'auth/wrong-password':
          alert('Incorrect password.');
          break;

        case 'auth/invalid-email':
          alert('Please enter a valid email address.');
          break;

        default:
          alert(error.message);
      }
    } finally {
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

          <img
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
            <a href="/signup" className="text-blue-500">
              Sign up
            </a>
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