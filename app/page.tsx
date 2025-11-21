'use client'; // Required for client-side hooks like useEffect

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSwipeable } from 'react-swipeable';
import { FaWhatsapp, FaBeer, FaCoffee, FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa';
import { LocalNotifications } from "@capacitor/local-notifications";
import { Geolocation } from "@capacitor/geolocation";

export default function Home() {
  useEffect(() => {
  // 💡 1. Guard: only run on client
  if (typeof window === "undefined") return;

  // 💡 2. Guard: Capacitor plugins exist?
  const isCapacitor = () => {
    const cap = (window as any).Capacitor;
    return !!(cap?.isNativePlatform?.() || cap?.isPluginAvailable);
  };
  if (!isCapacitor()) {
    console.log("Capacitor environment not detected. Skipping notifications & geolocation.");
    return;
  }
  // 💡 3. Guard: Geolocation supported?
  if (!navigator.geolocation) {
    console.log("Browser does not support geolocation.");
    return;
  }
  // === Now it's safe to run Capacitor code ===
  (async () => {
    try {
        // 4️⃣ Only schedule notifications if the plugin is available
    /*    if ((window as any).Capacitor.isPluginAvailable('LocalNotifications')) {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: "Hello",
                body: "This is a test notification",
                id: 1,
                schedule: { at: new Date(new Date().getTime() + 1000 * 5) } // 5 seconds later
              },
            ],
          });
          console.log("Notification scheduled!");
        } else {
          console.log("LocalNotifications plugin not available. Skipping.");
        }*/
      } catch (err) {
        console.error("Error scheduling notification:", err);
      }
  })();
}, []);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile(); // Initial check
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}

function MobileLayout() {
  const router = useRouter();
  return (
    <div
      style={{
        display: 'flex',
        left: '30%',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '0.5rem',
        alignItems: 'left',
        backgroundColor: 'gray',
            }}
          >
      <main>
        <h1><img src="/logos/twipalaicon.png" alt="twipalaicon Logo" width="175" height="100" /></h1>        
          {/* Your mobile-specific form or content */}        
        <CustomerCarousel/>               
      </main>
     <a
 onClick={() => router.push('/login')}  
  style={{
    position: 'fixed',
    bottom: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    color: 'green',
    padding: '0.75rem 1.5rem',
    border: 'none',
    borderRadius: '1.75rem',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '1rem',
    width: '75%',
    zIndex: 1000,
    textAlign: 'center',
    textDecoration: 'none',
  }}
> 
  Log In
</a>     
  <a
  href="https://wa.me/256709095815?text=Hello%2C%20I%27m%20interested%20in%20your%20store%20products"
  target="_blank"
  rel="noopener noreferrer"
  style={{
    position: 'fixed',
    top: '2px',
    left: '88%',
    transform: 'translateX(-50%)',
    backgroundColor: 'white',
    color: 'green',
    padding: '1rem 1.5rem',
    border: '2px solid green',
    borderRadius: '1.75rem',
    cursor: 'pointer',
    fontWeight: 500,
    fontSize: '0.75rem',
    width: '23%',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  }}
>
  <img
    src="/logos/whatsapp.PNG"
    alt="WhatsApp Icon"
    style={{
      width: '15px',
      height: '15px',
      marginBottom: '1px',
      objectFit: 'contain',
    }}
  />
  Whatsapp Us
</a>    
    <button
      onClick={() => router.push('/login')}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '12%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f78e16',
          color: 'white',
          padding: '1rem 1.75rem',
          border: '2px solid white',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.75rem',
          width: '23%',
          zIndex: 1000,
          display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
        }}
      >
        💰CashBack
      </button>
      <button
      onClick={() => router.push('/login')}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '37%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f78e16',
          color: 'white',
          padding: '1rem 1.5rem',
          border: '2px solid white',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.75rem',
          width: '23%',
          zIndex: 1000,
          display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
        }}
      >
        🏷️Offers
      </button>
      <button
      onClick={() => router.push('/order')}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '62%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f78e16',
          color: 'white',
          padding: '1rem 1.5rem',
          border: '2px solid white',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.75rem',
          width: '23%',
          zIndex: 1000,
          display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
        }}
      >
        🛒Orders
      </button>
      <button
      onClick={() => router.push('/signup')}
        style={{
          position: 'fixed',
          bottom: '80px',
          left: '88%',
          transform: 'translateX(-50%)',
          backgroundColor: '#f78e16',
          color: 'white',
          padding: '1rem 1.75rem',
          border: '2px solid white',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.75rem',
          width: '23%',
          zIndex: 1000,
          display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
        }}
      >
        👤SignUp
      </button>      
      <a
      href="tel:0709095815"
        style={{
          position: 'fixed',
          top: '2px',
          left: '62%',
          transform: 'translateX(-50%)',
          backgroundColor: 'white',
          color: 'green',
          padding: '1rem 1.5rem',
          border: '2px solid green',
          borderRadius: '1.75rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.75rem',
          width: '23%',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',       
        }}
      >
       📞 Telephone Us
      </a>
    <div
  style={{
    position: 'fixed',
    top: '105px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#ffc107',
    color: '#000',
    width: '100%',
    padding: '0.2rem 0.2rem',
    borderRadius: '2.75rem',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    zIndex: 999,
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    textAlign: 'center',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
  }}
>
  <div
    style={{
      display: 'inline-block',
      paddingLeft: '100%',
      animation: 'scroll-left 12s linear infinite',
    }}
  >
    🕒 Visit our Retail Shop open everyday from 7:00am to 11:00pm!     .
        Enjoy Unlimited Shopping and Stock Variety with us! 🕒  
        Register and get a discount on every purchase with us!
  </div>

  {/* CSS Keyframes inside <style> tag */}
  <style>
    {`
      @keyframes scroll-left {
        0% {
          transform: translateX(0%);
        }
        100% {
          transform: translateX(-100%);
        }
      }
    `}
  </style>
</div>    
    </div>    
  );  
}
function CustomerCarousel() {
  const images = [
    
    '/promos/1.webp','/promos/2.webp',
    '/promos/3.webp','/promos/4.webp',
    
  ];

  const [index, setIndex] = useState(0);
  const prevIndex = (index - 1 + images.length) % images.length;
  const nextIndex = (index + 1) % images.length;

  const goToPrev = () => setIndex(prevIndex);
  const goToNext = () => setIndex(nextIndex);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
  if (isPaused) return;

  const interval = setInterval(() => {
    setIndex((prev) => (prev + 1) % images.length);
  }, 4000);

  return () => clearInterval(interval);
}, [isPaused, images.length]);

  const isTouchDevice = () => {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined') {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  }
  return false;
};
  const swipeOptions: any = {
  onSwipedLeft: goToNext,
  onSwipedRight: goToPrev,
  trackMouse: true,
};

if (isTouchDevice()) {
  swipeOptions.preventDefaultTouchmoveEvent = true;
}
const swipeHandlers = useSwipeable(swipeOptions);

  return (
    <div
      {...swipeHandlers}
      style={{
        position: 'relative',
        width: '90%',
        maxWidth: '800px',
        height: '300px',
        margin: '120px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        touchAction: 'pan-y',
      }}
    >
      {/* Previous Image */}
      <img
        src={images[prevIndex]}
        alt="Previous"
        onClick={goToPrev}
        style={{
          position: 'relative',
          left: '5%',
          width: '90px',
          opacity: 0.5,
          cursor: 'pointer',
          zIndex: 1,
          transform: 'translateY(-50px)',
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        }}
      />

      {/* Current Image */}
      <img
        src={images[index]}
        alt="Current"
        onClick={goToNext}
        style={{
          zIndex: 2,
          width: '200px',
          borderRadius: '20px',
          boxShadow: '0 6px 20px rgba(0,0,0,0.3)',
          cursor: 'pointer',
          transform: 'translateY(-50px)',
        }}
      />

      {/* Next Image */}
      <img
        src={images[nextIndex]}
        alt="Next"
        onClick={goToNext}
        style={{
          position: 'relative',
          right: '1%',
          width: '75px',
          opacity: 0.5,
          transform: 'translateY(-50px)',
          cursor: 'pointer',
          zIndex: 1,
          boxShadow: '0 6px 20px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  );
}
function DesktopLayout() {
  const router = useRouter();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        justifyContent: 'space-between',
        padding: '2rem',
        fontFamily: 'sans-serif',
        alignItems: 'centre'
      }}
    >
      <main>
        <h1>© StockWell <span>☎ Contact us 256709095815</span></h1>
        {/* Your desktop-specific form or content */}
      </main>
      <button
      onClick={() => router.push('/login')}
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#06722aff',
          color: '#ffffff',
          padding: '0.75rem 1.5rem',
          border: 'none',
          borderRadius: '0.375rem',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '1rem',
          width: '30%',
          zIndex: 1000,
        }}
      >
        Log In
      </button>
    </div>
  );
}



