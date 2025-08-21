const withPWA = require('next-pwa')({
  dest: 'out',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: require('next-pwa/cache'),
});

const nextConfig = {
  output: 'export',  // static export mode
  reactStrictMode: true,
};

module.exports = withPWA(nextConfig);
