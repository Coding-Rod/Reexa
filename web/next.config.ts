import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Desktop local mode runs a second dev server; it needs its own build dir.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  // The old merged form lived at /start; the user profile is /profile now.
  async redirects() {
    return [{ source: "/start", destination: "/profile", permanent: false }];
  },
  cacheComponents: true,
  partialPrefetching: true,
  // API routes read section.json / manifest.json from disk; ship them with the functions on Vercel.
  outputFileTracingIncludes: {
    "/api/**": ["./public/content/**/*.json"],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
