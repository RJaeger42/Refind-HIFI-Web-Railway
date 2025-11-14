# Use Node.js with Playwright pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy root project files (when building from project root)
COPY package*.json ./
COPY tsconfig.json ./
COPY SiteScrapers ./SiteScrapers

# Install root dependencies (for SiteScrapers)
RUN npm install

# Copy scraper service files
COPY services/scrapers/package*.json ./services/scrapers/
COPY services/scrapers/tsconfig.json ./services/scrapers/
COPY services/scrapers/src ./services/scrapers/src

# Install scraper service dependencies
WORKDIR /app/services/scrapers
RUN npm install

# Build TypeScript
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Run the cron service
CMD ["npm", "start"]
