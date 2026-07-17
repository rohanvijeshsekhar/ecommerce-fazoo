import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Django media server images
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/media/**",
      },
      {
        protocol: "https",
        hostname: "api.faazo.com",
        pathname: "/media/**",
      },
    ],
  },

  // Standalone output for Docker deployment
  output: "standalone",

  // Redirect /admin to Vite app during Phase 1
  async rewrites() {
    return [
      // Admin panel is NOT migrated in Phase 1 — proxy to Vite dev server
      // Remove this rewrite after Phase 2 admin migration
    ];
  },
};

export default nextConfig;
