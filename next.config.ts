
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
        hostname: 'd.ibtimes.com.au',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Add allowedDevOrigins to address cross-origin warnings in development
  devIndicators: {
    buildActivity: true, // Default, can be kept
    buildActivityPosition: 'bottom-right', // Default, can be kept
    // Add the specific origin that was causing the warning
    allowedDevOrigins: ['https://6000-firebase-studio-1750257613090.cluster-c3a7z3wnwzapkx3rfr5kz62dac.cloudworkstations.dev'],
  }
};

export default nextConfig;
