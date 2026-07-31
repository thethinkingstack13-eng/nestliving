/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      // Add your Supabase Storage / CDN hostname here once real
      // property and avatar photos are uploaded, e.g.:
      // { protocol: 'https', hostname: '<project-ref>.supabase.co' },
    ],
  },
};

module.exports = nextConfig;
