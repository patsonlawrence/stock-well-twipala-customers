// next.config.js
const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development", // enable PWA only in production
});

module.exports = withPWA({
  reactStrictMode: true,
});
