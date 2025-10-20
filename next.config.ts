import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  
  // Exclude Prototypes folder from build
  webpack: (config) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules', '**/Prototypes/**'],
    };
    return config;
  },
  
  // Exclude from page building
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'].map(ext => ext),
};

export default nextConfig;
