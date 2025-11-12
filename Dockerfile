# Multi-stage Dockerfile for HiFi Scrapers
# Supports both development and production builds

# ============================================================================
# Stage 1: Base - Install system dependencies and Node
# ============================================================================
FROM node:20-bookworm as base

# Install system dependencies for Playwright
RUN apt-get update && apt-get install -y \
    # Playwright browser dependencies
    libwoff1 \
    libopus0 \
    libwebp6 \
    libwebpdemux2 \
    libenchant-2-2 \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libmanette-0.2-0 \
    libgstreamer-plugins-base1.0-0 \
    libgles2-mesa \
    gstreamer1.0-plugins-base \
    gstreamer1.0-plugins-good \
    libxslt1.1 \
    # Additional utilities
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ============================================================================
# Stage 2: Dependencies - Install Node dependencies
# ============================================================================
FROM base as dependencies

COPY package*.json ./
RUN npm ci --include=dev && \
    npx playwright install chromium firefox webkit && \
    npm cache clean --force

# ============================================================================
# Stage 3: Builder - Build TypeScript
# ============================================================================
FROM dependencies as builder

COPY tsconfig.json ./
COPY SiteScrapers ./SiteScrapers
COPY test-quick.ts ./

RUN npm run build

# ============================================================================
# Stage 4: Development - Full dev environment with all tools
# ============================================================================
FROM dependencies as development

COPY tsconfig.json ./
COPY SiteScrapers ./SiteScrapers
COPY test-quick.ts ./
COPY tests ./tests

# Create volumes mount points
VOLUME ["/app/output", "/app/logs"]

# Default command for development
CMD ["npm", "run", "test:quick"]

# ============================================================================
# Stage 5: Production - Minimal runtime environment
# ============================================================================
FROM base as production

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user for security
RUN useradd -m -u 1000 scraper && \
    chown -R scraper:scraper /app

USER scraper

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('fs').accessSync('dist'); console.log('OK')" || exit 1

# Default command for production
CMD ["node", "dist/index.js"]

# ============================================================================
# Stage 6: Production-Slim - Minimal image for CI/CD
# ============================================================================
FROM node:20-bookworm-slim as production-slim

WORKDIR /app

# Install only essential Playwright dependencies
RUN apt-get update && apt-get install -y \
    libwoff1 \
    libopus0 \
    libwebp6 \
    libwebpdemux2 \
    libenchant-2-2 \
    libgudev-1.0-0 \
    libsecret-1-0 \
    libhyphen0 \
    libgstreamer-plugins-base1.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules

# Create non-root user
RUN useradd -m -u 1000 scraper && \
    chown -R scraper:scraper /app

USER scraper

CMD ["node", "dist/index.js"]

# ============================================================================
# Stage 7: Testing - Optimized for running tests
# ============================================================================
FROM dependencies as testing

COPY tsconfig.json ./
COPY SiteScrapers ./SiteScrapers
COPY test-quick.ts ./
COPY tests ./tests

# Create output directory for test results
RUN mkdir -p /app/test-results /app/coverage

VOLUME ["/app/test-results", "/app/coverage"]

CMD ["npm", "test"]
