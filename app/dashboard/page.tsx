'use client';

import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode } from 'html5-qrcode';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

type Transaction = {
  points: number;
  date: string;
  receiptNumber: string;
};

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; phone: string; points: number } | null>(null);
  const [showPoints, setShowPoints] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('loggedIn');
    const storedUser = localStorage.getItem('loggedInUser');

    if (!loggedIn || !storedUser) {
      alert('Please log in first.');
      router.push('/login');
      return;
    }

    const userData = JSON.parse(storedUser);
    const initialPoints = 0;
    setUser({
      name: userData.fullName,
      phone: userData.phone,
      points: initialPoints,
    });
    setPoints(initialPoints);

    const storedHistory = localStorage.getItem('transactionHistory');
    if (storedHistory) {
      setHistory(JSON.parse(storedHistory));
    }
  }, [router]);

  const handleScan = (newPoints: number, date: string, receiptNumber: string) => {
    const isDuplicate = history.some((tx) => tx.receiptNumber === receiptNumber);
    if (isDuplicate) {
      alert('❌ This QR code has already been scanned.');
      return;
    }

    setPoints(newPoints); // ✅ Replace total points (not add)

    const newTx: Transaction = { points: newPoints, date, receiptNumber };
    const updatedHistory = [newTx, ...history].slice(0, 20); // Keep only the last 20 transactions
    setHistory(updatedHistory);
    localStorage.setItem('transactionHistory', JSON.stringify(updatedHistory));
  };

  if (!user) return <p className="text-center mt-10">Loading user data...</p>;

  return (
    <>
      <Head>
        <title>Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-start py-6 px-4">
        <div className="w-full max-w-sm bg-white rounded-xl shadow p-6 space-y-6">
          {/* Welcome and Info */}
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
          <div>
            <h2 className="text-xl font-bold mb-1">Welcome 👋 </h2>
            <h2 className="text-xl font-bold mb-1">{user.name}</h2>
            <p className="text-gray-600 mb-4">Phone: {user.phone}</p>

            <div className="relative bg-blue-100 p-4 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-sm text-blue-700 font-semibold">Points Balance</h3>
                 
                 <p className="text-3xl font-bold text-blue-900">
                {showPoints ? points.toLocaleString() : '•••••'}                
                </p>               
              </div>
              <button
                onClick={() => setShowPoints((prev) => !prev)}
                className="text-blue-700 hover:text-blue-900"
              >
                {showPoints ? (
                  <EyeSlashIcon className="w-6 h-6" />
                ) : (
                  <EyeIcon className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-4">
            <a
              href="/profile"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-center"
            >
              View Profile
            </a>
            <button
              onClick={() => setShowHistory((prev) => !prev)}
              className="bg-yellow-100 text-yellow-700 p-2 rounded-lg shadow hover:bg-yellow-200 transition"
            >
              {showHistory ? 'Hide History' : 'History'}
            </button>
            <button className="bg-purple-100 text-purple-700 p-2 rounded-lg shadow hover:bg-purple-200 transition">
              Settings
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('loggedInUser');
                localStorage.removeItem('loggedIn');
                window.location.href = '/';
              }}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Log Out
            </button>
          </div>

          {/* QR Scanner */}
          <QrScannerComponent userPhone={user.phone} onScan={handleScan} />

          {/* History Display */}
          {showHistory && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-end justify-center z-50">
            <div className="w-full max-w-md bg-white rounded-t-xl p-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">🧾 Last 20 Transactions</h3>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="text-red-600 font-semibold text-sm"
                    style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    Close ✕
                  </button>
              </div>

              {history.length === 0 ? (
                <p className="text-sm text-gray-500 text-center">No transactions yet.</p>
                                      ) : (
                <ul className="space-y-3">
                {history.map((tx, index) => (
                <li
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-3 shadow-sm"
                    >
                    <p className="text-blue-800 font-semibold text-md">
                    +{tx.points.toLocaleString()} pts
                    </p>
                    <p className="text-xs text-gray-500">🧾 {tx.receiptNumber}</p>
                    <p className="text-xs text-gray-500">{tx.date}</p>
                </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          )}
        </div>
      </main>
    </>
  );
}

// === QR SCANNER COMPONENT ===
type QrScannerProps = {
  userPhone: string;
  onScan: (points: number, date: string, receiptNumber: string) => void;
};

function QrScannerComponent({ userPhone, onScan }: QrScannerProps) {
  const [showScanner, setShowScanner] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (showScanner && scannerRef.current) {
      const config = { fps: 10, qrbox: 250 };

      const qrCodeSuccessCallback = (decodedText: string) => {
        try {
          const qrData = JSON.parse(decodedText);
          const { phone, points, receiptNumber } = qrData;

          if (!phone || !points || !receiptNumber) {
            setScannedResult('❌ Missing QR code fields.');
            return;
          }

          if (phone !== userPhone) {
            setScannedResult('❌ Phone mismatch. This QR code is not for you.');
            return;
          }

          const date = new Date().toLocaleString();
          onScan(points, date, receiptNumber);
          setScannedResult(`✅ Points updated to ${points.toLocaleString()}`);
        } catch {
          setScannedResult('❌ Invalid QR code.');
        }

        html5QrCodeRef.current?.stop().then(() => {
          html5QrCodeRef.current?.clear();
        });
      };

      html5QrCodeRef.current = new Html5Qrcode('qr-reader');

      html5QrCodeRef.current
        .start(
          { facingMode: 'environment' },
          config,
          qrCodeSuccessCallback,
          (errorMessage: string) => {
            console.error('QR Code scan error:', errorMessage);
          }
        )
        .catch((err) => {
          console.error('Camera start error', err);
        });
    }

    return () => {
      html5QrCodeRef.current?.stop().then(() => {
        html5QrCodeRef.current?.clear();
      });
    };
  }, [showScanner, userPhone, onScan]);

  return (
    <div>
      <button
        className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition mb-4"
        onClick={() => setShowScanner(true)}
      >
        Scan QR Code
      </button>

      {showScanner && (
        <div className="mb-4">
          <div ref={scannerRef} id="qr-reader" className="w-full" />
          <p className="text-sm text-gray-600 text-center mt-2">
            Point your camera at a QR code
          </p>
        </div>
      )}

      {scannedResult && (
        <div className="bg-green-100 text-green-800 p-3 rounded-lg mt-4 text-center">
          {scannedResult}
        </div>
      )}
    </div>
  );
}
