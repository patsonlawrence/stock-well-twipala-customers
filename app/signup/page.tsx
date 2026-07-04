
'use client';

import Head from 'next/head';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

import { auth, db } from '@/lib/firebase';
// app/signup/page.tsx
export default function Signup() {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    regDate: new Date().toISOString().split('T')[0],
    gender: '',
    tin: '',
    nextKinName: '',
    nextKinPhone: '',
    agree: false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.currentTarget;
    const checked =
      type === 'checkbox'
        ? (e.currentTarget as HTMLInputElement).checked
        : undefined;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!formData.agree) {
    alert("You must agree to the Terms and Conditions.");
    return;
  }

  try {
    // Create Firebase Authentication account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      formData.email.trim().toLowerCase(),
      formData.password
    );

    // Save additional profile information
    await setDoc(doc(db, "users", userCredential.user.uid), {
      fullName: formData.fullName,
      phone: formData.phone,
      email: formData.email.trim().toLowerCase(),
      gender: formData.gender,
      tin: formData.tin,
      nextKinName: formData.nextKinName,
      nextKinPhone: formData.nextKinPhone,
      regDate: formData.regDate,
      createdAt: serverTimestamp(),
    });

    alert("Account created successfully!");

    setFormData({
      fullName: "",
      phone: "",
      email: "",
      password: "",
      regDate: new Date().toISOString().split("T")[0],
      gender: "",
      tin: "",
      nextKinName: "",
      nextKinPhone: "",
      agree: false,
    });

    router.push("/login");
  } catch (error: any) {
    console.error(error);

    switch (error.code) {
      case "auth/email-already-in-use":
        alert("An account with this email already exists.");
        break;

      case "auth/weak-password":
        alert("Password must be at least 6 characters.");
        break;

      case "auth/invalid-email":
        alert("Please enter a valid email.");
        break;

      default:
        alert(error.message);
    }
  }

  // 🔄 Reset form
  setFormData({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    regDate: new Date().toISOString().split('T')[0],
    gender: '',
    tin: '',
    nextKinName: '',
    nextKinPhone: '',
    agree: false,    
  });
    window.location.href = '/login'
  
};
  return (
    <>
      <Head>        
        <title>Sign Up & Earn</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>      
      <div className="flex items-center justify-center min-h-screen bg-gray-600 px-4">
        <div className="w-full max-w-md p-8 bg-gray rounded-lg shadow-md">
          <div className="flex flex-col items-center justify-center min-h-screen bg-white-100 px-4">
        {/* ✅ Logo here */}
        <img
          src="/icons/twipalalogo.PNG"
          alt="Twipala Logo"
          width={100}
          height={100}          
          className="mb-4"
          style={{ borderRadius: '50%',objectFit: 'cover' }}
        />        
          <h2 className="text-2xl font-bold text-center mb-6">Twipala Sign Up & Earn</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="password" name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="date" name="regDate" value={formData.regDate} readOnly  className="w-full p-2 border rounded bg-gray-100 text-gray-600 cursor-not-allowed"></input>
            <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border rounded" required>
              <option value="">Select Gender</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
            <input type="text" name="tin" placeholder="Tax Identification Number" value={formData.tin} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="text" name="nextKinName" placeholder="Next of Kin - Full Name" value={formData.nextKinName} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="tel" name="nextKinPhone" placeholder="Next of Kin - Phone Number" value={formData.nextKinPhone} onChange={handleChange} className="w-full p-2 border rounded" required />
            <label className="flex items-center">
              <input type="checkbox" name="agree" checked={formData.agree} onChange={handleChange} className="mr-2" required />
              I agree to the T&Cs and Privacy Policy
            </label>
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition">
              Sign Up
            </button>
          </form>
          <p className="text-center text-sm text-green-600 mt-4">
            Already have an account? <a href="/login" className="text-blue-500">Log in</a>
          </p>
        </div>
      </div>
      </div>
    </>
  );
}

