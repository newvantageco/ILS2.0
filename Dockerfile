# ================================
# Multi-Stage Production Dockerfile
# ================================

# ----------------
# Stage 1: Builder
# ----------------
FROM node:22-slim AS builder

# Install build dependencies including Rust
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Rust via rustup
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application with increased memory for large TypeScript project
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN npm run build

# ----------------
# Stage 2: Production
# ----------------
FROM node:22-slim AS production

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

# Copy package files and node_modules from builder
COPY --chown=nodejs:nodejs package*.json ./
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules

# Copy built application from builder (contains bundled index.js and public/)
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist

# Copy shared directory (contains schema and types)
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Copy drizzle config and migrations for database setup
COPY --from=builder --chown=nodejs:nodejs /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder --chown=nodejs:nodejs /app/migrations ./migrations

# Copy public assets
COPY --from=builder --chown=nodejs:nodejs /app/public ./public

# Copy native Rust module (if built successfully)
COPY --from=builder --chown=nodejs:nodejs /app/native/ils-core ./native/ils-core

# Copy startup script
COPY --chown=nodejs:nodejs docker-start.sh ./docker-start.sh
RUN chmod +x ./docker-start.sh

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads /app/logs && chown -R nodejs:nodejs /app/uploads /app/logs

# Switch to non-root user
USER nodejs

# Expose application port (Railway will override with $PORT)
EXPOSE 5000

# Set environment variables
# Note: Railway will override PORT automatically
ENV NODE_ENV=production \
    PORT=5000 \
    HOST=0.0.0.0

# Health check (uses PORT environment variable for Railway compatibility)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "const port = process.env.PORT || 5000; require('http').get(\`http://localhost:\${port}/api/health\`, (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application (runs migrations via startup script)
CMD ["./docker-start.sh"]
