/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    optimizeCss: true,
  },
  transpilePackages: [
    "three",
    "p5",
    "pinata-web3",
    "@pinata/sdk",
    "react-use-keypress",
  ],
  images: {
    loader: "custom",
    loaderFile: "./utils/image-loader.ts",
    unoptimized: true,
  },
  env: {
    PINATA_JWT: process.env.PINATA_JWT,
    PINATA_GROUP_ID: process.env.PINATA_GROUP_ID,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    config.module.rules.push({
      test: /\.(glsl|vs|fs|vert|frag)$/,
      exclude: /node_modules/,
      use: ["raw-loader", "glslify-loader"],
    });

    return config;
  },
};

module.exports = nextConfig;
