/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [{
          source:      '/api/:path*',
          destination: `${process.env.API_URL ?? 'http://127.0.0.1:3008'}/api/:path*`
        }]
      : [];
  },
};

module.exports = nextConfig;