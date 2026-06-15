import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Static export ready — remove if adding API routes that need a server
  // output: 'export',

  images: {
    // Allow CDN-hosted icons (SimpleIcons)
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.simpleicons.org' },
    ],
  },
};

export default nextConfig;
