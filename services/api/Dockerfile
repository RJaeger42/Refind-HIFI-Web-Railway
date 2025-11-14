FROM node:18-slim

WORKDIR /app

# Copy API service files
COPY services/api/package*.json ./
COPY services/api/tsconfig.json ./
COPY services/api/src ./src

# Install ALL dependencies (including dev for build)
RUN npm ci

# Build TypeScript
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "start"]
