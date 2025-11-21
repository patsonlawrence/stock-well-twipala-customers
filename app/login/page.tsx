'use client';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function Login() {
  const router = useRouter();

  const [input, setInput] = useState({
    username: '',
    password: '',
    remember: false,
  });

  // ✅ Auto-redirect if already logged in
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('loggedIn');
    if (isLoggedIn === 'true') {
      router.push('/dashboard');
    }
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value, type, checked } = e.target;
    setInput((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleLogin = (e: React.FormEvent) => {
  e.preventDefault();

  const stored = localStorage.getItem('userProfiles');
  if (!stored) {
    alert('No user found. Please sign up first.');
    return;
  }

  const users = JSON.parse(stored); // ⬅️ This is now an array

  const foundUser = users.find((user: any) =>
    (input.username === user.email || input.username === user.phone) &&
    input.password === user.password
  );
  if (foundUser) {
    alert('Login successful!');
    if (input.remember) {
      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('loggedInUser', JSON.stringify(foundUser));
    }

    router.push('/dashboard');
  } else {
    alert('Incorrect email/phone or password.');
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
  className="mb-4"
  style={{
    display: 'block',
    margin: '0 auto',
    textAlign: 'center',
    borderRadius: '50%', // <-- This makes it circular
    objectFit: 'cover'    // <-- Optional: makes sure the image fills the circle
  }}
/>
          <h2 className="text-2xl font-bold text-center mb-6">Kinoonya Login</h2>
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-600">
                Email / Phone Number
              </label>
              <input
                type="text"
                id="username"
                value={input.username}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="you@example.com or 07xxxxxxxx"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-600">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={input.password}
                onChange={handleChange}
                className="w-full mt-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
                required
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
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              
            >
              Log In
            </button>
          </form>
          <p className="text-center text-sm text-gray-600 mt-4">
            Don't have an account? <a href="/signup" className="text-blue-500">Sign up</a>
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
          </p>
          
        </div>
      </div>
    </>
  );
}
