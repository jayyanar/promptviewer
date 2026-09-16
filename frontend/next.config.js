/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost', 'promptweaver-example.s3.amazonaws.com'],
    unoptimized: true,
  },
  env: {
    // Environment variables can be added here
  },
  // Add these settings for Amplify deployment
  output: 'export',
  trailingSlash: true,
  distDir: 'out',
}

module.exports = nextConfig
