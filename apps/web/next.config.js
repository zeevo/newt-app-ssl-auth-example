import dotenv from "dotenv";
import { resolve } from "path";

// Load root .env first, then local .env (local takes precedence)
dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

const isProduction = process.env.NODE_ENV === "production";

// Keep the dev indicator off the sidebar's bottom-left Admin link.
const devIndicators = { position: "bottom-right" };

// Static export in production, served by NestJS via ServeStaticModule.
// rewrites() is incompatible with output: "export", so dev uses the proxy
// and production uses the static files. trailingSlash writes /admin as
// admin/index.html, which the static server finds without extra routing.
/** @type {import('next').NextConfig} */
const nextConfig = isProduction
  ? { output: "export", trailingSlash: true, devIndicators }
  : {
      devIndicators,
      async rewrites() {
        return [
          {
            source: "/api/:path*",
            destination: "http://localhost:3001/api/:path*",
          },
        ];
      },
    };

export default nextConfig;
