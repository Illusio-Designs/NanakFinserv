/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving uploaded files / images from the API host if needed.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "api.nanakfinserv.com" },
    ],
  },
};

export default nextConfig;
