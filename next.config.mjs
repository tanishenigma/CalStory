/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.7"],
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? { exclude: ["error", "warn"] }
        : false,
  },
  // Allow the Google Fit REST API origin for server-side or edge fetch calls.
  // Client-side fetch is not restricted by this setting, but keeping it
  // explicit documents the external dependency.
  experimental: {
    serverActions: {
      allowedOrigins: ["www.googleapis.com", "accounts.google.com"],
    },
  },
};

export default nextConfig;
