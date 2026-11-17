import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // The dev server blocks requests from any host but localhost; this lets other machines on the LAN open it. The Mac's
  // address changes with the network (192.168.0.141 before, 192.168.1.214 on 16 Nov), so any 192.168.x.x is allowed.
  allowedDevOrigins: ["192.168.0.141", "192.168.1.214", "192.168.*.*"],
  cacheComponents: true,
  images: {
    // Course covers come from the 10MS CDN; catalogue teacher and student photos from its other image hosts.
    remotePatterns: [
      { protocol: "https", hostname: "cdn.10minuteschool.com", pathname: "/images/**" },
      { protocol: "https", hostname: "cdn.10minuteschool.com", pathname: "/cpd_images/**" },
      { protocol: "https", hostname: "cdn.10minuteschool.com", pathname: "/lms10/**" },
      { protocol: "https", hostname: "cdn.10minuteschool.com", pathname: "/img/**" },
      // CT72: the live batch pages' video reviews keep their thumbnails here.
      { protocol: "https", hostname: "cdn.10minuteschool.com", pathname: "/k12/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
      { protocol: "https", hostname: "cdn.10ms.com", pathname: "/catalog/**" },
      { protocol: "https", hostname: "lm10-cdn.10minuteschool.com", pathname: "/images/**" },
      { protocol: "https", hostname: "lms10.s3.ap-southeast-1.amazonaws.com", pathname: "/crm/**" },
    ],
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
