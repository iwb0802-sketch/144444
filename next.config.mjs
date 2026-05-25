/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: "/", has: [{ type: "host", value: "inus.weddingmusic.kr" }], destination: "/inus", permanent: false },
      { source: "/", has: [{ type: "host", value: "bns.weddingmusic.kr" }], destination: "/bnscustomer", permanent: false },
      { source: "/", has: [{ type: "host", value: "staff.weddingmusic.kr" }], destination: "/bns", permanent: false },
      { source: "/", has: [{ type: "host", value: "yedo.weddingmusic.kr" }], destination: "/yedo", permanent: false },
    ];
  },
};

export default nextConfig;
