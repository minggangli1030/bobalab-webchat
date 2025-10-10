/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure proper build configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Configure image domains for Firebase Storage
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
        port: "",
        pathname: "/v0/b/bobalab-web-chat.firebasestorage.app/o/**",
      },
    ],
  },
};

module.exports = nextConfig;
