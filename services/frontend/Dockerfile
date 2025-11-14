# Build stage
FROM node:18-slim AS build

WORKDIR /app

# Copy frontend service files
COPY package*.json ./
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Install dependencies
RUN npm ci

# Build for production
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
