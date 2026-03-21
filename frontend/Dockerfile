# Next.js — build needs NEXT_PUBLIC_API_URL (your public API base, no trailing slash).
FROM node:20-bookworm-slim AS base

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Baked into client bundle at build time
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

ENV NODE_ENV=production
# Railway sets PORT; Next reads it
EXPOSE 3000
CMD ["sh", "-c", "exec npx next start -p ${PORT:-3000}"]
