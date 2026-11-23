FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

FROM base AS build
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build --filter=web --filter=@newt-app-ssl-auth-example/api

# --- app ---
# One image: Nest serves the API and web's static export (apps/web/out). The
# workspace packages it imports ship as TypeScript source, so the whole built
# workspace is copied rather than a pruned bundle.
FROM base AS app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/apps/api
EXPOSE 3001
CMD ["node", "dist/main"]

# --- migrate ---
FROM build AS migrate
WORKDIR /app
CMD ["pnpm", "db:migrate"]