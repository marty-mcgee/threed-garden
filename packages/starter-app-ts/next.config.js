// ==============================================================
// ** NEXT.JS 13 BUILD CONFIGURATION FILE

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true, // Recommended for the `pages` directory, default in `app`.
  swcMinify: true,
  experimental: {
    // Required true for Next 13
    appDir: true,
  },
}

module.exports = nextConfig
