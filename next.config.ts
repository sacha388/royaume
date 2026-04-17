import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["framer-motion"],
  },
  turbopack: {
    root: process.cwd(),
  },
  /**
   * Accès au dev server depuis le réseau local (ex. http://192.168.x.x:3000).
   * Sans ça, le HMR / ressources `/_next/*` sont bloquées → écran blanc possible.
   * Ajoute ton IP ou un hostname si besoin, puis redémarre `npm run dev`.
   */
  allowedDevOrigins: ["192.168.1.197"],
};

export default nextConfig;
