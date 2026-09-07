# syntax=docker/dockerfile:1
# Two stages: build the static site with Node, serve dist/ with nginx.
# Built by .github/workflows/ci.yml and pushed to registry.apps.vernaillen.dev;
# Coolify runs the resulting image (port 80, TLS terminated by its proxy).

FROM node:26-alpine AS build
WORKDIR /app
# Node 25+ no longer bundles Corepack; pin the pnpm major from pnpm-lock.yaml.
RUN npm install -g pnpm@12
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
# Build-time only; this stage is discarded. PUBLIC_RADIO_URL is baked into
# src/scripts/fft-demo-core.ts. The GitHub token (src/lib/github.ts, snapshot
# fallback when absent) is a BuildKit secret so it never lands in a layer or
# the build cache: `--secret id=github_token,env=GITHUB_TOKEN`.
ARG PUBLIC_RADIO_URL
RUN --mount=type=secret,id=github_token,env=GITHUB_TOKEN pnpm build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
