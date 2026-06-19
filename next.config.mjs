/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `pg` is a Node-native lib — keep it external instead of bundling into RSC.
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
};

export default nextConfig;
