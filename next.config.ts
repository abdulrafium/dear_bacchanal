import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cache images for 30 days — avoids re-downloading on every visit
    minimumCacheTTL: 2592000,
    // Serve modern compressed formats automatically (50-80% smaller than JPEG/PNG)
    formats: ["image/avif", "image/webp"],
    // Only generate thumbnails at these specific sizes (reduces server-side work)
    deviceSizes: [640, 750, 1080, 1200],
    imageSizes: [64, 128, 200, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ufs.sh",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "uploadthing.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.uploadthing.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.ufs.sh",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
