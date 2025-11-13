# ================================
# Multi-Stage Production Dockerfile
# ================================
# Build: 2025-11-11-v2

# ----------------
# Stage 1: Builder
# ----------------
FROM node:20 AS builder

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
# Clean install with explicit Rollup binary for platform
RUN rm -f package-lock.json && \
    npm cache clean --force && \
    npm install && \
    npm install @rollup/rollup-linux-x64-gnu --save-optional

# Copy source code
COPY . .

# Build the application
RUN npm run build

# ----------------
# Stage 2: Production
# ----------------
FROM node:20-slim AS production

# Install runtime dependencies only
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

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install ALL dependencies (bundled server needs all packages at runtime)
RUN npm ci --include=dev

# Copy built application from builder (contains bundled index.js and public/)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && chown -R nodejs:nodejs /app/uploads

# Switch to non-root user
USER nodejs

# Expose application port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
