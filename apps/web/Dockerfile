# Stage 1: Install deps
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --silent

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1 NODE_ENV=production
ENV TSC_COMPILE_ON_ERROR=true
RUN npm run build

# Stage 3: Runner (standalone)
FROM node:20-alpine AS runner
WORKDIR /app
ENV PORT=8080 NODE_ENV=production
# Copy the standalone output and public folder
COPY --from=builder /app/.next/standalone .
COPY --from=builder /app/public ./public
EXPOSE 8080
CMD ["node", "server.js"]
