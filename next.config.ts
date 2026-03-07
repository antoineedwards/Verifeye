import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'stsnmjgqhgkulpcaicjg.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        // Add your production domain here before deploying, e.g.:
        // 'verifeye.vercel.app',
      ],
      bodySizeLimit: '5mb',
    },
    serverComponentsExternalPackages: ['tesseract.js'],
  },
  reactCompiler: true, 
};

export default nextConfig;
