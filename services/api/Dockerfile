FROM node:18-slim

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src

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
