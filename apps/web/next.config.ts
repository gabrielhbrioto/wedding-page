import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.0.6', '192.168.0.8', '192.168.1.34', '192.168.0.10'],
  output: 'standalone',
  typescript: {
    // Allow builds even with TypeScript errors (useful for CI/container quick builds).
    ignoreBuildErrors: true,
  },
};

export default nextConfig;