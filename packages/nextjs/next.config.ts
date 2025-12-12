import type { NextConfig } from "next";

const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix workspace root detection
  outputFileTracingRoot: require("path").join(__dirname, "../../"),
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Tree shaking optimization for common packages
  experimental: {
    optimizePackageImports: [
      "@heroicons/react",
      "wagmi",
      "viem",
      "@tanstack/react-query",
      "react-hot-toast",
    ],
  },
  webpack: config => {
    config.resolve.fallback = {
      fs: false,
      net: false,
      tls: false,
      // Fix @react-native-async-storage missing module
      "@react-native-async-storage/async-storage": false,
    };
    config.externals.push("pino-pretty", "lokijs", "encoding");
    // Ignore MetaMask SDK react-native dependencies in browser build
    config.resolve.alias = {
      ...config.resolve.alias,
      "@react-native-async-storage/async-storage": false,
    };
    // Optimize vendor chunking
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk for stable dependencies
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // Commons chunk for shared code
          common: {
            name: "common",
            minChunks: 2,
            chunks: "async",
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Web3 libraries in separate chunk
          web3: {
            test: /[\\/]node_modules[\\/](wagmi|viem|@reown|@coinbase)[\\/]/,
            name: "web3",
            chunks: "all",
            priority: 30,
          },
        },
      },
    };
    return config;
  },
};

const isIpfs = process.env.NEXT_PUBLIC_IPFS_BUILD === "true";

if (isIpfs) {
  nextConfig.output = "export";
  nextConfig.trailingSlash = true;
  nextConfig.images = {
    unoptimized: true,
  };
}

module.exports = withBundleAnalyzer(nextConfig);
