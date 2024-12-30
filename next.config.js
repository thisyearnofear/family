const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@utils": path.resolve(__dirname, "./utils"),
      "@components": path.resolve(__dirname, "./components"),
      "@contexts": path.resolve(__dirname, "./contexts"),
    };
    return config;
  },
  images: {
    domains: ["gateway.pinata.cloud"],
  },
};

module.exports = nextConfig;
