'use client';

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useSwipeable } from "react-swipeable";


export default function Home() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreen();
    window.addEventListener("resize", checkScreen);

    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <main style={pageStyle}>
      {/* Background decoration */}
      <div style={glowOne} />
      <div style={glowTwo} />

      {/* Brand */}
      <header style={headerStyle}>
        <div style={logoStyle}>
          <span style={logoMark}>✦</span>
          <span>TWIPALA</span>
        </div>

        <div style={taglineStyle}>
          Premium. Simple. Reliable.
        </div>
      </header>

      {/* Promo */}
      <PromoCarousel />

      {/* Welcome */}
      <section style={welcomeStyle}>
        <p style={eyebrowStyle}>WELCOME</p>

        <h1 style={headingStyle}>
          Everything you need,
          <br />
          <span style={headingAccent}>in one place.</span>
        </h1>

        <p style={descriptionStyle}>
          Access our services, manage your orders and discover
          our latest offers with ease.
        </p>
      </section>

      {isMobile ? <MobileHome /> : <DesktopHome />}
    </main>
  );
}

/* =========================
   MOBILE HOME
========================= */

function MobileHome() {
  const router = useRouter();

  const menu: {
  title: string;
  icon: string;
  path: string;
  disabled?: boolean;
}[] = [
    {
      title: "BackOffice",
      icon: "◈",
      path: "/login",
    },
    {
      disabled: true,
      title: "Offers",
      icon: "◇",
      path: "/offers",
    },
    {
      disabled: true,
      title: "Orders",
      icon: "🛒",
      path: "/orders",
    },
    {
      disabled: true,
      title: "Sign Up",
      icon: "♙",
      path: "/signup",
    },
  ];

  return (
    <section style={mobileSectionStyle}>
      {/* Contact buttons */}
      <div style={contactRowStyle}>
        <a
          href="https://wa.me/256709095815"
          style={contactStyle}
        >
          <span style={contactIconStyle}>●</span>
          WhatsApp
        </a>

        <a
          href="tel:0709095815"
          style={contactStyle}
        >
          <span style={contactIconStyle}>⌕</span>
          Call
        </a>
      </div>

      {/* Navigation */}
      <div style={mobileMenuStyle}>
        {menu.map((item) => (
          <button
  key={item.title}
  disabled={item.disabled}
  onClick={() => router.push(item.path)}
  style={{
    ...menuButtonStyle,
    opacity: item.disabled ? 0.5 : 1,
    cursor: item.disabled ? "not-allowed" : "pointer",
  }}
>
  <span style={menuIconStyle}>{item.icon}</span>
  <span>{item.title}</span>
</button>
        ))}
      </div>
    </section>
  );
}

/* =========================
   DESKTOP HOME
========================= */

function DesktopHome() {
  const router = useRouter();

  return (
    <section style={desktopSectionStyle}>
      <button
        onClick={() => router.push("/login")}
        style={desktopButtonStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-4px)";
          e.currentTarget.style.boxShadow =
            "0 18px 40px rgba(6,114,42,0.35)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 10px 30px rgba(6,114,42,0.2)";
        }}
      >
        <span>Staff Login</span>
        <span style={{ fontSize: "22px" }}>→</span>
      </button>
    </section>
  );
}

/* =========================
   PROMO CAROUSEL
========================= */

function PromoCarousel() {
  const images = [
    "/promos/1.webp",
    "/promos/2.webp",
    "/promos/3.webp",
    "/promos/4.webp",
    "/promos/5.webp",
    "/promos/6.webp",
    "/promos/7.webp",
    "/promos/8.webp",
    "/promos/9.webp",
    "/promos/10.webp",
    "/promos/11.webp",
    "/promos/12.webp",
    "/promos/13.webp",
    "/promos/14.webp",
    "/promos/15.webp",
    "/promos/16.webp",
    "/promos/17.webp",    
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [images.length]);

  const swipe = useSwipeable({
    onSwipedLeft: () => {
      setIndex((prev) => (prev + 1) % images.length);
    },

    onSwipedRight: () => {
      setIndex(
        (prev) => (prev - 1 + images.length) % images.length
      );
    },

    trackMouse: true,
  });

  return (
    <section
      {...swipe}
      style={carouselWrapperStyle}
    >
      <div style={imageFrameStyle}>
        <img
          src={images[index]}
          alt={`Promotion ${index + 1}`}
          style={promoImageStyle}
        />

        <div style={imageOverlayStyle} />

        <div style={promoBadgeStyle}>
          FEATURED
        </div>
      </div>

      {/* Dots */}
      <div style={dotsStyle}>
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            style={{
              ...dotStyle,
              width: i === index ? "28px" : "7px",
              background:
                i === index
                  ? "#f78e16"
                  : "rgba(255,255,255,0.4)",
            }}
            aria-label={`Show promotion ${i + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

/* =========================
   STYLES
========================= */

const pageStyle: CSSProperties = {
  minHeight: "100vh",
  width: "100%",
  position: "relative",
  overflow: "hidden",
  background:
    "linear-gradient(135deg, #031b10 0%, #064d28 48%, #032619 100%)",
  color: "white",
  fontFamily:
    "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "24px",
  boxSizing: "border-box",
};

const glowOne: CSSProperties = {
  position: "absolute",
  width: "350px",
  height: "350px",
  borderRadius: "50%",
  background: "rgba(247,142,22,0.12)",
  filter: "blur(90px)",
  top: "-120px",
  left: "-100px",
  pointerEvents: "none",
};

const glowTwo: CSSProperties = {
  position: "absolute",
  width: "400px",
  height: "400px",
  borderRadius: "50%",
  background: "rgba(0,180,90,0.14)",
  filter: "blur(100px)",
  bottom: "-180px",
  right: "-120px",
  pointerEvents: "none",
};

const headerStyle: CSSProperties = {
  width: "100%",
  maxWidth: "1100px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "relative",
  zIndex: 2,
  padding: "8px 4px",
};

const logoStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "18px",
  fontWeight: "800",
  letterSpacing: "2px",
};

const logoMark: CSSProperties = {
  width: "34px",
  height: "34px",
  borderRadius: "10px",
  background: "#f78e16",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 8px 25px rgba(247,142,22,0.35)",
};

const taglineStyle: CSSProperties = {
  color: "rgba(255,255,255,0.6)",
  fontSize: "12px",
  letterSpacing: "1px",
};

const carouselWrapperStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  marginTop: "35px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  position: "relative",
  zIndex: 2,
  touchAction: "pan-y",
};

const imageFrameStyle: CSSProperties = {
  width: "min(86vw, 390px)",
  height: "min(86vw, 390px)",
  maxWidth: "390px",
  maxHeight: "390px",
  borderRadius: "28px",
  padding: "7px",
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.35), rgba(255,255,255,0.05))",
  boxShadow:
    "0 25px 70px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08)",
  position: "relative",
  boxSizing: "border-box",
};

const promoImageStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  borderRadius: "22px",
  display: "block",
};

const imageOverlayStyle: CSSProperties = {
  position: "absolute",
  inset: "7px",
  borderRadius: "22px",
  background:
    "linear-gradient(180deg, transparent 55%, rgba(0,0,0,0.35))",
  pointerEvents: "none",
};

const promoBadgeStyle: CSSProperties = {
  position: "absolute",
  bottom: "22px",
  left: "22px",
  background: "rgba(247,142,22,0.95)",
  color: "white",
  fontSize: "10px",
  fontWeight: "800",
  letterSpacing: "1.5px",
  padding: "7px 12px",
  borderRadius: "20px",
  boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
};

const dotsStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  marginTop: "18px",
};

const dotStyle: CSSProperties = {
  height: "7px",
  border: "none",
  borderRadius: "10px",
  padding: 0,
  cursor: "pointer",
  transition: "all 0.3s ease",
};

const welcomeStyle: CSSProperties = {
  width: "100%",
  maxWidth: "700px",
  textAlign: "center",
  position: "relative",
  zIndex: 2,
  marginTop: "25px",
};

const eyebrowStyle: CSSProperties = {
  color: "#f78e16",
  fontSize: "11px",
  fontWeight: "800",
  letterSpacing: "3px",
  margin: "0 0 10px",
};

const headingStyle: CSSProperties = {
  fontSize: "clamp(30px, 7vw, 52px)",
  lineHeight: "1.08",
  margin: 0,
  fontWeight: "800",
  letterSpacing: "-1.5px",
};

const headingAccent: CSSProperties = {
  color: "#f78e16",
};

const descriptionStyle: CSSProperties = {
  maxWidth: "520px",
  margin: "18px auto 0",
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
  lineHeight: "1.7",
};

const mobileSectionStyle: CSSProperties = {
  width: "100%",
  maxWidth: "480px",
  position: "relative",
  zIndex: 2,
  marginTop: "25px",
};

const contactRowStyle: CSSProperties = {
  display: "flex",
  justifyContent: "center",
  gap: "10px",
  marginBottom: "15px",
};

const contactStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  minWidth: "115px",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  padding: "11px 16px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.18)",
  fontSize: "12px",
  fontWeight: "700",
  textDecoration: "none",
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 25px rgba(0,0,0,0.12)",
};

const contactIconStyle: CSSProperties = {
  color: "#f78e16",
  fontSize: "12px",
};

const mobileMenuStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(2, 1fr)",
  gap: "12px",
};

const menuButtonStyle: CSSProperties = {
  minHeight: "82px",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "20px",
  background:
    "linear-gradient(145deg, rgba(247,142,22,0.95), rgba(220,105,5,0.95))",
  color: "white",
  fontSize: "13px",
  fontWeight: "800",
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
  transition: "all 0.25s ease",
};

const menuIconStyle: CSSProperties = {
  fontSize: "22px",
};

const desktopSectionStyle: CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  marginTop: "30px",
  position: "relative",
  zIndex: 2,
};

const desktopButtonStyle: CSSProperties = {
  width: "300px",
  height: "58px",
  borderRadius: "30px",
  border: "1px solid rgba(255,255,255,0.15)",
  background:
    "linear-gradient(135deg, #078237, #045c29)",
  color: "white",
  fontSize: "16px",
  fontWeight: "800",
  letterSpacing: "0.5px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "30px",
  boxShadow: "0 10px 30px rgba(6,114,42,0.2)",
  transition: "all 0.25s ease",
};