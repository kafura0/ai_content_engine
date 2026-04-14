/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produces a self-contained server in .next/standalone — smaller Docker images
  output: "standalone",
  // Allow <img> tags to render base64 data URIs from the FastAPI backend
  images: {
    dangerouslyAllowSVG: false,
    unoptimized: true,
  },
};
export default nextConfig;
