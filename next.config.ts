import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      allowedOrigins: [
        //'zany-happiness-699vj9g97x76cx45j-3000.app.github.dev', // Copy this from your error message
        'localhost:3000'
      ],
    },
  },
  reactCompiler: true,
};

export default nextConfig;
