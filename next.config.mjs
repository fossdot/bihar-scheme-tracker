/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-host: emit a minimal standalone server (.next/standalone) for a lean Docker image.
  output: "standalone",
  // `pg` is a Node-native lib — keep it external instead of bundling into RSC.
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
