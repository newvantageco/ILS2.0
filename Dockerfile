# Multi-stage build to handle npm optional dependencies bug
FROM node:20 AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Workaround for npm optional dependencies bug
# Remove package-lock.json and force clean install
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install --include=optional && \
    npm install --force @rollup/rollup-linux-x64-gnu && \
    npm list @rollup/rollup-linux-x64-gnu || true

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:20-slim AS production

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgif7 \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -g 1001 nodejs && \
    useradd -r -u 1001 -g nodejs nodejs

WORKDIR /app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

USER nodejs
EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
