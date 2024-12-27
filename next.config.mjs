import { readFileSync } from 'fs';
import { join } from 'path';

// Read version from package.json
const packageJson = JSON.parse(readFileSync('./package.json', 'utf8'));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable powered by header
  poweredByHeader: false,

  // Enable gzip compression
  compress: true,

  // Strict mode for better development
  reactStrictMode: true,

  // Set environment variables
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
}

export default nextConfig
