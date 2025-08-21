'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    const savedUsers = localStorage.getItem('userProfiles');

    if (savedUsers) {
      const users = JSON.parse(savedUsers);
      // Assuming the last signed-up user is the logged-in one
      const lastUser = users[users.length - 1];
      setProfile(lastUser);
    } else {
      alert('No profile found. Redirecting to signup...');
      router.push('/signup');
    }
  }, [router]);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="bg-white rounded-lg shadow-md p-8 w-full max-w-md">
        <img
          src="/logos/stalogo.PNG"
          alt="Standard Logo"
          width={100}
          height={100}
          className="mb-4"
          style={{ display: 'block', margin: '0 auto', textAlign: 'center' }}
        />
        <h1 className="text-2xl font-bold text-center mb-4">👤 Aponye Profile</h1>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Name:</strong> {profile.fullName}</li>
          <li><strong>Phone:</strong> {profile.phone}</li>
          <li><strong>Email:</strong> {profile.email}</li>
          <li><strong>Gender:</strong> {profile.gender}</li>
          <li><strong>Tax ID (TIN):</strong> {profile.tin}</li>
          <li><strong>Next of Kin:</strong> {profile.nextKinName}</li>
          <li><strong>Next of Kin Phone:</strong> {profile.nextKinPhone}</li>
          <li><strong>Registered On:</strong> {profile.regDate}</li>
        </ul>

        <button
          className="mt-6 w-full bg-red-600 text-white py-2 rounded hover:bg-red-700 transition"
          onClick={() => {
            localStorage.removeItem('loggedIn');
            router.push('/');
          }}
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
