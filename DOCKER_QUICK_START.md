# Docker Quick Start Guide

Fast reference for common Docker commands for HiFi Scrapers project.

---

## Installation

First, install Docker and Docker Compose:

```bash
# macOS (with Homebrew)
brew install docker docker-compose

# Ubuntu/Debian
sudo apt-get install docker.io docker-compose

# Windows
# Download Docker Desktop: https://www.docker.com/products/docker-desktop
```

Start Docker:

```bash
# Linux
sudo systemctl start docker

# macOS/Windows - Docker Desktop starts automatically
```

---

## 5-Minute Setup

```bash
# 1. Clone and enter project
git clone <repo>
cd HIFI_Scrapers_Terminal

# 2. Build images
docker-compose build

# 3. Run quick tests
docker-compose run --rm test-smoke

# Done! ✅
```

---

## Essential Commands

### Quick Tests

```bash
# Smoke test (2 min) - FASTEST ⚡
docker-compose run --rm test-smoke

# Unit tests (5 min)
docker-compose run --rm test-basic

# Integration tests (15-20 min) - REAL WEBSITES
docker-compose run --rm test-integration

# All tests
docker-compose run --rm test
```

### Development

```bash
# Interactive development shell
docker-compose run --rm dev bash

# Inside container:
npm run build           # Compile TypeScript
npm run test:quick      # Run quick tests
npx ts-node script.ts   # Run specific script
```

### Production

```bash
# Start production server
docker-compose up app

# In background
docker-compose up -d app

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## Build Targets

```bash
# Development environment (1.5 GB)
docker-compose run --rm dev bash

# Testing (1.4 GB)
docker-compose run --rm test

# Production (500 MB)
docker-compose up app

# Production minimal (350 MB)
docker-compose up app-slim
```

---

## Manual Docker Commands

```bash
# Build specific image
docker build --target development -t hifi:dev .
docker build --target production -t hifi:latest .
docker build --target testing -t hifi:test .

# Run image
docker run -it hifi:dev bash
docker run --rm hifi:test npm test

# List images
docker images | grep hifi

# Remove image
docker rmi hifi:dev

# View logs
docker logs <container-id>

# Stop container
docker stop <container-id>
```

---

## Useful Shortcuts

### Run in Background

```bash
# Start and keep running
docker-compose up -d app

# View status
docker-compose ps

# View logs
docker-compose logs -f

# Stop all
docker-compose down
```

### Interactive Shell

```bash
# Dev environment with bash
docker-compose run --rm dev bash

# Run commands
npm test
npm run build
npx ts-node script.ts

# Exit
exit
```

### One-Off Commands

```bash
# Run test command
docker-compose run --rm test npm run test:quick

# Run build
docker-compose run --rm build

# Run with environment variable
docker-compose run --rm -e TIMEOUT=60000 dev npm test
```

---

## Common Issues & Fixes

### "Cannot connect to Docker daemon"

```bash
# Start Docker
sudo systemctl start docker

# Or check Docker is running (macOS)
open -a Docker
```

### "Port already in use"

```bash
# Use different port
docker-compose run -p 3001:3000 dev

# Or kill the process
lsof -i :3000
kill -9 <PID>
```

### "Out of disk space"

```bash
# Clean everything
docker system prune -a

# Or just dangling images
docker image prune
```

### "Tests failing in Docker but passing locally"

```bash
# Check Node version
docker run --rm hifi:test node --version

# Check environment
docker run --rm hifi:test env | grep NODE

# Rebuild without cache
docker-compose build --no-cache
```

---

## Docker Compose Cheat Sheet

| Command | Purpose |
|---------|---------|
| `docker-compose build` | Build all images |
| `docker-compose up` | Start all services |
| `docker-compose up -d` | Start in background |
| `docker-compose down` | Stop and remove |
| `docker-compose ps` | List services |
| `docker-compose logs` | View logs |
| `docker-compose logs -f` | Follow logs |
| `docker-compose run <service>` | Run one-off command |
| `docker-compose run --rm <service>` | Run and auto-clean |
| `docker-compose exec <service> bash` | Shell into running service |

---

## Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
NODE_ENV=development
DEBUG=true
TIMEOUT=30000
MAX_PAGES=5
```

---

## Next Steps

1. **Build:** `docker-compose build`
2. **Test:** `docker-compose run --rm test-smoke`
3. **Develop:** `docker-compose run --rm dev bash`
4. **Deploy:** `docker-compose up -d app`

---

## More Information

See [DOCKER.md](DOCKER.md) for comprehensive documentation.

