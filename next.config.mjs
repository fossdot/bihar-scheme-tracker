// Baseline security headers applied to every app response (so they hold regardless of which
// proxy/vhost serves it). CSP allows 'unsafe-inline' (Next injects inline hydration scripts +
// styles and we don't use nonces) but no 'unsafe-eval'; it still hardens object/base/frame/form.
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Self-host: emit a minimal standalone server (.next/standalone) for a lean Docker image.
  output: "standalone",
  // `pg` is a Node-native lib — keep it external instead of bundling into RSC.
  experimental: {
    serverComponentsExternalPackages: ["pg"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: CSP },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
