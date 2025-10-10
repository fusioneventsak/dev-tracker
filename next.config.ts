import type { NextConfig } from "next";
import withPWA from "next-pwa";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  // Auto-update the app when new content is available
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig);
