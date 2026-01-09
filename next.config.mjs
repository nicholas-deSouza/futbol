/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "img.a.transfermarkt.technology",
      },
      {
        protocol: "https",
        hostname: "tmssl.akamaized.net",
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Don't bundle sql.js on server, let it be required normally
      config.externals = [...(config.externals || []), "sql.js"];
    }
    return config;
  },
};

export default nextConfig;
