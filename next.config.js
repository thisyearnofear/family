const path = require("path");
const webpack = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    esmExternals: true,
  },
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.pinata.cloud",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
        pathname: "/ipfs/**",
      },
    ],
    domains: ["gateway.pinata.cloud"],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
  },
  env: {
    NEXT_PUBLIC_SPACE_DEMO_ID: process.env.NEXT_PUBLIC_SPACE_DEMO_ID,
    NEXT_PUBLIC_JAPANESE_DEMO_ID: process.env.NEXT_PUBLIC_JAPANESE_DEMO_ID,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
