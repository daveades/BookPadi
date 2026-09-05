import { routes, type VercelConfig } from "@vercel/config/v1";

const configuredOrigin = process.env.API_ORIGIN;

if (!configuredOrigin) {
  throw new Error("API_ORIGIN is required");
}

const parsedOrigin = new URL(configuredOrigin);

if (
  parsedOrigin.protocol !== "https:" ||
  parsedOrigin.username ||
  parsedOrigin.password ||
  parsedOrigin.pathname !== "/" ||
  parsedOrigin.search ||
  parsedOrigin.hash
) {
  throw new Error("API_ORIGIN must be an HTTPS origin without a path, query, or fragment");
}

const apiOrigin = parsedOrigin.origin;

export const config: VercelConfig = {
  rewrites: [
    routes.rewrite("/auth/:path*", `${apiOrigin}/auth/:path*`),
    routes.rewrite("/books", `${apiOrigin}/books`),
    routes.rewrite("/books/:path*", `${apiOrigin}/books/:path*`),
    routes.rewrite("/search", `${apiOrigin}/search`),
    routes.rewrite("/library", `${apiOrigin}/library`),
    routes.rewrite("/:path*", "/index.html"),
  ],
};
