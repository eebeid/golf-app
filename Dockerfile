# Base image
FROM node:20 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set browser path for builder
ENV PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

# Generate Prisma Client
RUN npx prisma generate

# Install Playwright browsers in builder stage
RUN npx playwright install chromium

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Install system dependencies for Chromium
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libxkbcommon0 \
    libxcomposite1 \
    libxdamage1 \
    libxext6 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libasound2 \
    libpangocairo-1.0-0 \
    libwayland-client0 \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/app/ms-playwright

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Copy the browsers from the builder stage
COPY --from=builder --chown=nextjs:nodejs /app/ms-playwright ./ms-playwright

# Automatically leverage output traces to reduce image size
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy prisma schema + migrations + engine
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run DB migrations then start the app
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
