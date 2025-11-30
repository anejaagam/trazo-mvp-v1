import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
   typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Exclude Prototypes and archive folders from build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/Prototypes/**', '**/archive/**'],
    };
    return config;
  },
  
  // Exclude from page building
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => ext),
};

export default nextConfig;
