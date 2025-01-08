const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  transpilePackages: ["three", "@pinata/sdk", "react-use-keypress"],
  webpack: (config, { isServer }) => {
    // Aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      "@components": path.resolve(__dirname, "./components"),
      "@utils": path.resolve(__dirname, "./utils"),
      "@contexts": path.resolve(__dirname, "./contexts"),
      "@hooks": path.resolve(__dirname, "./hooks"),
    };

    // Fallbacks for non-server environment
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    // GLSL loader configuration
    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
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
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
