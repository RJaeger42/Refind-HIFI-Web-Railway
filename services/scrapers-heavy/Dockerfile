# Use Node.js with Playwright pre-installed
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

# Set working directory
WORKDIR /app

# Copy root project files for SiteScrapers
COPY package*.json ./
COPY tsconfig.json ./
COPY SiteScrapers ./SiteScrapers

# Install root dependencies (for SiteScrapers)
RUN npm install

# Copy heavy scraper service files
COPY services/scrapers-heavy/package*.json ./services/scrapers-heavy/
COPY services/scrapers-heavy/tsconfig.json ./services/scrapers-heavy/
COPY services/scrapers-heavy/src ./services/scrapers-heavy/src

# Install service dependencies
WORKDIR /app/services/scrapers-heavy
RUN npm install

# Build TypeScript
RUN npm run build

# Set environment
ENV NODE_ENV=production

# Run the cron service
CMD ["npm", "start"]
