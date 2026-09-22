import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [
    "@nexus-twin/types",
    "@nexus-twin/validation",
    "@nexus-twin/database",
    "@nexus-twin/config",
  ],
  serverExternalPackages: ["mongoose"],
};

export default nextConfig;
