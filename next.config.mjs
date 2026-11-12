/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // No ESLint config ships with this project; never block the build on lint.
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
