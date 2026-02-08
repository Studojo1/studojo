FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_CONTROL_PLANE_URL=https://api.studojo.com
ENV VITE_CONTROL_PLANE_URL=${VITE_CONTROL_PLANE_URL}

RUN npm run build

# Production image, copy all the files and run react-router
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 reactrouter

COPY --from=builder /app/build ./build
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER reactrouter

EXPOSE 3004

ENV PORT=3004
ENV NODE_ENV=production

CMD ["npm", "start"]

