import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Output mode for deployment
  // Use 'standalone' for better performance, or remove for static export
  output: 'standalone',
  
  // Environment variables that should be available on the client
  env: {
    NEXT_PUBLIC_APIVAULT_URL: process.env.NEXT_PUBLIC_APIVAULT_URL || 'https://www.apivault.it.com',
  },
  
  // Optimize for production
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;
