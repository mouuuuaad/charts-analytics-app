
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'd.ibtimes.com.au',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'thehillstimes.in',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.fsdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'files.ozbargain.com.au',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.nzherald.co.nz',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add allowedDevOrigins to address cross-origin warnings in development
  devIndicators: {
    // buildActivity: true, // DEPRECATED: Removed
    position: 'bottom-right', // RENAMED from buildActivityPosition
    // Add the specific origin that was causing the warning
    allowedDevOrigins: ['https://6000-firebase-studio-1750257613090.cluster-c3a7z3wnwzapkx3rfr5kz62dac.cloudworkstations.dev'],
  }
};

export default nextConfig;
