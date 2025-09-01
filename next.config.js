/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react"],
    serverExternalPackages: ["googleapis"],
  },
};

module.exports = nextConfig;
