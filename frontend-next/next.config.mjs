/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving uploaded files / images from the API host if needed.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.nanakfinserv.com" },
    ],
  },
  webpack: (config, { dev }) => {
    // On Windows the filesystem pack cache frequently corrupts (".pack.gz"
    // ENOENT / "Cannot find module './NNN.js'"). Use an in-memory cache in dev
    // to avoid it entirely.
    if (dev) config.cache = { type: "memory" };
    return config;
  },
};

export default nextConfig;
