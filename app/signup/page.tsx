
'use client'
import Head from 'next/head';
import { useState } from 'react';
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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  if (!formData.agree) {
    alert('You must agree to the terms.');
    return;
  }

  // 🔄 Get existing users from localStorage
  const existingUsers = JSON.parse(localStorage.getItem('userProfiles') || '[]');

  // 🔍 Check if email or phone already exists
  const userExists = existingUsers.some((user: any) =>
    user.email.toLowerCase() === formData.email.toLowerCase() ||
    user.phone === formData.phone
  );

  if (userExists) {
    alert('User with this email or phone number already exists.');
    window.location.href = '/login';
    return;
  }

  // ✅ Save the new user to the array
  const updatedUsers = [...existingUsers, {
    ...formData,
    email: formData.email.toLowerCase().trim(),
  }];
  localStorage.setItem('userProfiles', JSON.stringify(updatedUsers));

  alert('Signup successful!');
  console.log('Saved user:', formData);

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
          src="/logos/stalogo.PNG"
          alt="Standard Logo"
          width={100}
          height={100}
          className="mb-4"
        />
        
          <h2 className="text-2xl font-bold text-center mb-6">Aponye Sign Up & Earn</h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input type="text" name="fullName" placeholder="Full Name" value={formData.fullName} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="tel" name="phone" placeholder="Phone Number" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded" required />
            <input type="email" name="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded" />
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
            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-green-700 transition">Sign Up</button>
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
