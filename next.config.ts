import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // External packages for server components
  serverExternalPackages: ['@aws-sdk/client-s3', '@aws-sdk/client-sqs', '@aws-sdk/client-sns', '@aws-sdk/client-iam'],
  // Enable standalone output for Docker
  output: 'standalone',
  // Ensure proper file watching
  watchOptions: {
    pollIntervalMs: 1000,
  },
  // Disable TypeScript checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
