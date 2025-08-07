import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'fjgawvjwuottxpdvgdeg.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // other config options here
};

export default nextConfig;