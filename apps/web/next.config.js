import dotenv from "dotenv";
import { resolve } from "path";

// Load root .env first, then local .env (local takes precedence)
dotenv.config({ path: resolve(process.cwd(), "../../.env") });
dotenv.config({ path: resolve(process.cwd(), ".env") });

// No /api rewrite: Next serves /api itself, so there is no api container to
// proxy to.
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  // Keep the dev indicator off the sidebar's bottom-left Admin link.
  devIndicators: { position: "bottom-right" },
  serverExternalPackages: [
    "@newt-app-ssl-auth-example/api",
    "@newt-app-ssl-auth-example/db",
    "@nestjs/core",
    "@nestjs/common",
    "@nestjs/microservices",
    "@nestjs/websockets",
    "@thallesp/nestjs-better-auth",
    "reflect-metadata",
    "express",
  ],
};

export default nextConfig;
