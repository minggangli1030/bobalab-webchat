/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper build configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
