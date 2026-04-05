/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{
          source:      '/api/:path*',
          destination: `${process.env.API_URL ?? 'http://localhost:3008'}/api/:path*`
        }]
      : [];
  },
};

module.exports = nextConfig;