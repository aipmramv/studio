
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
        port: '',
        pathname: '/v1/create-qr-code/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Apply these headers to all routes in your application.
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            // Allows embedding from any origin. 
            // For production, you should restrict this to specific Power Apps domains, e.g., 
            // value: "frame-ancestors https://apps.powerapps.com https://*.powerapps.com",
            value: "frame-ancestors *",
          },
          // X-Frame-Options is largely superseded by CSP's frame-ancestors.
          // If you still need to support very old browsers that don't understand CSP frame-ancestors,
          // you might consider X-Frame-Options, but it's generally better to rely on frame-ancestors.
          // Next.js does not set X-Frame-Options by default.
        ],
      },
    ];
  },
};

export default nextConfig;
