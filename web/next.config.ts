import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/",
        has: [
          {
            type: "header",
            key: "accept",
            value: "(.*text/markdown.*)",
          },
        ],
        destination: "/index.md",
      },
    ];
  },
};

export default nextConfig;
