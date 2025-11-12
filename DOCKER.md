# Docker Setup - HiFi Scrapers

Complete Docker containerization for the TypeScript Playwright scraper project. Includes development, testing, and production environments.

---

## Quick Start

### Option 1: Run Development Environment

```bash
# Start dev container with interactive shell
docker-compose run --rm dev bash

# Inside container, run tests
npm run test:quick

# Or run specific scraper
npx ts-node your-script.ts
```

### Option 2: Run All Tests

```bash
# Quick smoke tests (2 min)
docker-compose run --rm test-smoke

# Unit tests (5 min)
docker-compose run --rm test-basic

# Integration tests (15-20 min)
docker-compose run --rm test-integration

# All tests at once
docker-compose run --rm test
```

### Option 3: Production Deployment

```bash
# Build production image
docker build --target production -t hifi-scrapers:latest .

# Run production container
docker run --rm \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  hifi-scrapers:latest
```

---

## Docker Builds Overview

### Available Build Targets

| Target | Purpose | Size | Use Case |
|--------|---------|------|----------|
| `base` | System dependencies | ~800 MB | Foundation |
| `dependencies` | + Node packages | ~1.2 GB | Intermediate |
| `builder` | + TypeScript build | ~1.3 GB | CI/CD source |
| `development` | Full dev environment | ~1.5 GB | Local development |
| `testing` | Optimized for tests | ~1.4 GB | Test execution |
| `production` | Full production | ~500 MB | Production deploy |
| `production-slim` | Minimal production | ~350 MB | CI/CD, minimal footprint |

---

## docker-compose.yml Services

### Development Service

```bash
docker-compose run --rm dev bash
```

**Features:**
- Full development environment
- Hot-reload with volume mounts
- Interactive shell (tty + stdin)
- Node modules cached
- Output/logs directories mapped

**Usage:**
```bash
# Run quick tests
npm run test:quick

# Build TypeScript
npm run build

# Run with ts-node
npx ts-node your-script.ts

# Edit and save, changes are reflected immediately
```

### Testing Services

#### Smoke Tests (Fast)
```bash
docker-compose run --rm test-smoke
# Runs: npm run test:quick
# Time: 2 minutes
```

#### Unit Tests
```bash
docker-compose run --rm test-basic
# Runs: npm run test:basic
# Time: 5 minutes
```

#### Integration Tests
```bash
docker-compose run --rm test-integration
# Runs: npm run test:integration
# Time: 15-20 minutes
# Includes: Real website access, requires internet
```

#### All Tests
```bash
docker-compose run --rm test
# Runs: npm test
# Time: ~25-30 minutes total
# Includes: smoke + unit + integration
```

### Production Services

#### Full Production
```bash
docker-compose up app
```

**Features:**
- Non-root user (security)
- Health checks enabled
- Auto-restart policy
- Minimal bloat (500 MB)
- Full Playwright support

#### Production Slim
```bash
docker-compose up app-slim
```

**Features:**
- Minimal dependencies only
- Smallest image (350 MB)
- Perfect for CI/CD pipelines
- Reduced attack surface

### Build Service

```bash
docker-compose run --rm build
# Compiles TypeScript to dist/
```

---

## Manual Docker Commands

### Building Images

```bash
# Build development image
docker build --target development -t hifi-scrapers:dev .

# Build production image
docker build --target production -t hifi-scrapers:latest .

# Build production-slim image
docker build --target production-slim -t hifi-scrapers:slim .

# Build testing image
docker build --target testing -t hifi-scrapers:test .
```

### Running Containers

```bash
# Interactive development shell
docker run -it --rm \
  -v $(pwd):/app \
  -v /app/node_modules \
  hifi-scrapers:dev \
  bash

# Run smoke tests
docker run --rm hifi-scrapers:test npm run test:quick

# Run unit tests
docker run --rm hifi-scrapers:test npm run test:basic

# Run integration tests (with internet access)
docker run --rm hifi-scrapers:test npm run test:integration

# Production with volume mounts
docker run --rm \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/logs:/app/logs \
  -e NODE_ENV=production \
  hifi-scrapers:latest
```

### Image Management

```bash
# List images
docker images | grep hifi-scrapers

# Remove image
docker rmi hifi-scrapers:dev

# Inspect image
docker inspect hifi-scrapers:latest

# View image history
docker history hifi-scrapers:latest

# Check image size
docker images --format "table {{.Repository}}\t{{.Size}}" | grep hifi-scrapers
```

### Container Management

```bash
# List running containers
docker ps | grep hifi-scrapers

# List all containers
docker ps -a | grep hifi-scrapers

# View logs
docker logs hifi-scrapers-app

# Follow logs in real-time
docker logs -f hifi-scrapers-app

# Stop container
docker stop hifi-scrapers-app

# Remove container
docker rm hifi-scrapers-app

# Get shell access to running container
docker exec -it hifi-scrapers-app bash
```

---

## docker-compose Commands Reference

### Running Services

```bash
# Run service and remove when done
docker-compose run --rm dev bash
docker-compose run --rm test-smoke

# Start service in background
docker-compose up -d app
docker-compose up -d test

# Start multiple services
docker-compose up -d app test

# View running services
docker-compose ps

# View logs
docker-compose logs
docker-compose logs -f app           # Follow logs
docker-compose logs --tail=50 test   # Last 50 lines

# Stop services
docker-compose stop
docker-compose stop app

# Stop and remove
docker-compose down
docker-compose down -v               # Remove volumes too

# Remove unused images
docker-compose down --rmi unused
docker-compose down --rmi all
```

### Building

```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build dev

# Build without cache
docker-compose build --no-cache

# Build and push to registry
docker-compose build
docker tag hifi-scrapers-dev:latest myregistry/hifi-scrapers:dev
docker push myregistry/hifi-scrapers:dev
```

---

## Environment Variables

### Development
```bash
NODE_ENV=development
DEBUG=true
```

### Testing
```bash
NODE_ENV=test
CI=true
```

### Production
```bash
NODE_ENV=production
```

### Custom Variables

Create `.env` file:
```bash
# .env
NODE_ENV=production
PLAYWRIGHT_HEADLESS=true
TIMEOUT=30000
MAX_PAGES=5
```

Load in docker-compose:
```yaml
services:
  app:
    env_file:
      - .env
```

Or via command line:
```bash
docker-compose run --rm -e TIMEOUT=60000 dev bash
```

---

## Volume Mounting

### Development Volume Strategy

```yaml
# Code and dependencies
volumes:
  - .:/app                    # Mount current directory
  - /app/node_modules        # Keep node_modules separate
  - ./dist:/app/dist          # Output directory

# Output directories
volumes:
  - ./output:/app/output      # Scraper output
  - ./logs:/app/logs          # Application logs
  - ./test-results:/app/test-results
  - ./coverage:/app/coverage
```

### Common Volume Patterns

```bash
# Mount current directory with anonymous volume for node_modules
docker run -it \
  -v $(pwd):/app \
  -v /app/node_modules \
  hifi-scrapers:dev

# Mount only source code, use container's node_modules
docker run -it \
  -v $(pwd)/SiteScrapers:/app/SiteScrapers \
  -v $(pwd)/test-quick.ts:/app/test-quick.ts \
  hifi-scrapers:dev

# Mount with read-only source
docker run -it \
  -v $(pwd):/app:ro \
  -v /app/node_modules \
  hifi-scrapers:dev

# Named volume for persistent data
docker volume create hifi-output
docker run -v hifi-output:/app/output hifi-scrapers:latest
```

---

## Networking

### Container-to-Container Communication

```yaml
services:
  app:
    networks:
      - hifi-network

  db:
    networks:
      - hifi-network

networks:
  hifi-network:
    driver: bridge
```

### Port Mapping

```bash
# Map port 3000
docker-compose run -p 3000:3000 dev

# Map multiple ports
docker run -p 3000:3000 -p 8080:8080 hifi-scrapers:dev
```

---

## Performance Optimization

### Build Optimization

```dockerfile
# Use build cache effectively
RUN apt-get update && apt-get install -y \
    package1 \
    package2 \
    && rm -rf /var/lib/apt/lists/*

# Multi-stage builds reduce final image size
FROM node:20 as builder
# ... build steps
FROM node:20-slim as runtime
COPY --from=builder /app/dist ./dist
```

### Runtime Optimization

```bash
# Limit memory
docker run -m 2g hifi-scrapers:latest

# Limit CPU
docker run --cpus="2" hifi-scrapers:latest

# Both
docker run -m 2g --cpus="2" hifi-scrapers:latest
```

### Volume Performance

```bash
# Named volumes are faster than bind mounts
docker volume create hifi-data
docker run -v hifi-data:/app/output hifi-scrapers:latest

# Tmpfs for temporary files (RAM-based, very fast)
docker run --tmpfs /app/temp:size=500m hifi-scrapers:latest
```

---

## Troubleshooting

### Issue: "Port already in use"

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
docker run -p 3001:3000 hifi-scrapers:dev
```

### Issue: "Cannot connect to Docker daemon"

```bash
# Start Docker
sudo systemctl start docker

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Issue: "Out of space"

```bash
# Clean up unused images/containers/volumes
docker system prune -a --volumes

# Remove specific image
docker rmi hifi-scrapers:dev

# Check disk usage
docker system df
```

### Issue: "Build takes too long"

```bash
# Check what's slow
docker build --progress=plain .

# Use buildkit for faster builds (Docker 18.09+)
DOCKER_BUILDKIT=1 docker build .

# Use layer caching effectively
# Put frequently-changing commands at end of Dockerfile
```

### Issue: "Tests failing in Docker but passing locally"

```bash
# Check environment variables
docker run --rm hifi-scrapers:test env

# Check Node version
docker run --rm hifi-scrapers:test node --version

# Check TypeScript compilation
docker run --rm hifi-scrapers:test npm run lint

# Run with debug output
docker run --rm -e DEBUG=* hifi-scrapers:test npm test
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test in Docker

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build --target testing -t hifi-scrapers:test .

      - name: Run smoke tests
        run: docker run --rm hifi-scrapers:test npm run test:quick

      - name: Run unit tests
        run: docker run --rm hifi-scrapers:test npm run test:basic

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI Example

```yaml
stages:
  - test
  - build
  - deploy

test:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build --target testing -t hifi-scrapers:test .
    - docker run --rm hifi-scrapers:test npm test

build:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build --target production -t hifi-scrapers:latest .
    - docker push registry.example.com/hifi-scrapers:latest
```

---

## Security Best Practices

### Container Security

```dockerfile
# Use specific version tags
FROM node:20-bookworm

# Create non-root user
RUN useradd -m -u 1000 scraper
USER scraper

# Scan for vulnerabilities
RUN npm audit
```

### Runtime Security

```bash
# Run as read-only filesystem
docker run --read-only \
  --tmpfs /tmp \
  hifi-scrapers:latest

# Drop unnecessary capabilities
docker run --cap-drop=ALL \
  --cap-add=NET_BIND_SERVICE \
  hifi-scrapers:latest
```

### Image Security

```bash
# Scan image for vulnerabilities
docker scan hifi-scrapers:latest

# Use minimal base images
FROM node:20-slim        # Better than node:20-bookworm
FROM node:20-alpine      # Even smaller but may have fewer tools
```

---

## Production Deployment

### Docker Registry (Docker Hub)

```bash
# Tag image
docker tag hifi-scrapers:latest username/hifi-scrapers:1.0.0
docker tag hifi-scrapers:latest username/hifi-scrapers:latest

# Push to registry
docker login
docker push username/hifi-scrapers:1.0.0
docker push username/hifi-scrapers:latest

# Pull and run
docker pull username/hifi-scrapers:latest
docker run -d username/hifi-scrapers:latest
```

### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy service
docker service create \
  --name hifi-scrapers \
  --replicas 3 \
  -v /output:/app/output \
  hifi-scrapers:latest

# View service
docker service ls
docker service ps hifi-scrapers
```

### Kubernetes (if using Docker images with K8s)

```bash
# Create deployment YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: hifi-scrapers
spec:
  replicas: 3
  selector:
    matchLabels:
      app: hifi-scrapers
  template:
    metadata:
      labels:
        app: hifi-scrapers
    spec:
      containers:
      - name: hifi-scrapers
        image: hifi-scrapers:latest
        volumeMounts:
        - mountPath: /app/output
          name: output
      volumes:
      - name: output
        persistentVolumeClaim:
          claimName: hifi-output
```

---

## Summary

| Scenario | Command |
|----------|---------|
| **Quick test** | `docker-compose run --rm test-smoke` |
| **All tests** | `docker-compose run --rm test` |
| **Dev environment** | `docker-compose run --rm dev bash` |
| **Production** | `docker-compose up app` |
| **Build only** | `docker-compose run --rm build` |
| **View logs** | `docker-compose logs -f app` |
| **Clean up** | `docker-compose down -v` |

---

## Next Steps

1. **Build the image:**
   ```bash
   docker-compose build
   ```

2. **Run tests:**
   ```bash
   docker-compose run --rm test-smoke
   ```

3. **Deploy to production:**
   ```bash
   docker-compose up -d app
   ```

4. **Monitor:**
   ```bash
   docker-compose logs -f app
   ```

For more information, see:
- [Docker Documentation](https://docs.docker.com/)
- [Playwright Docker Guide](https://playwright.dev/docs/docker)
- [Node.js Docker Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)
