
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['mongodb', 'bson', 'bcryptjs'],
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Disable static optimization for all pages to avoid build errors
  trailingSlash: false,
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Prevent client-side bundling of Node.js modules
      config.resolve.fallback = {
        ...config.resolve.fallback,
        dns: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        events: false,
        querystring: false,
      };
      
      // Exclude / alias server-only packages from client bundle
      config.externals = config.externals || [];
      config.externals.push('server-only');

      // Alias server-only modules to a small empty shim so the client bundle
      // doesn't try to resolve Node built-ins. The shim exports an empty object.
      const path = require('path')
      const shim = path.resolve(__dirname, 'src/shims/empty.js')
      config.resolve.alias = config.resolve.alias || {}
      ;[
        'mongodb', 'bson', 'bcryptjs', 'dns', 'fs', 'net', 'tls', 'child_process',
        'socks', 'saslprep'
      ].forEach((m) => {
        config.resolve.alias[m] = shim
      })
    }
    
    return config;
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
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      }
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
