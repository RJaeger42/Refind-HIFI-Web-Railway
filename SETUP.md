# Setup Guide - HiFi Scrapers

Complete setup instructions for the TypeScript Playwright scraper project with Docker.

---

## Prerequisites

- **Node.js**: 18.0.0 or higher ([download](https://nodejs.org/))
- **Docker**: Latest version ([download](https://www.docker.com/))
- **Docker Compose**: 1.29.0 or higher (included with Docker Desktop)
- **Git**: For version control

---

## Option 1: Local Setup (Recommended for Development)

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `playwright` - Browser automation
- `@playwright/test` - Testing framework
- `typescript` - TypeScript compiler
- `ts-node` - Run TypeScript directly
- `cheerio` - HTML parsing

### 2. Verify Installation

```bash
# Check Node.js version
node --version      # Should be v18 or higher

# Check npm version
npm --version       # Should be 10+ or higher

# Check TypeScript
npx tsc --version   # Should be 5.4 or higher
```

### 3. Build TypeScript

```bash
npm run build
```

This compiles TypeScript to `dist/` directory.

### 4. Verify Build

```bash
# Check if dist directory was created
ls -la dist/SiteScrapers/

# Should see compiled JavaScript files
```

### 5. Run Quick Smoke Test

```bash
npm run test:quick
```

Expected output:
```
✅ extractPrice: Swedish format
✅ normalizeUrl: Relative path
✅ filterByPrice: Range filtering
✅ AkkelisAudio: has name property
... (50+ tests)
🎉 All tests passed!
```

### 6. Run Unit Tests

```bash
npm test:basic
```

### 7. Run Integration Tests (Optional)

```bash
npm run test:integration
```

This hits real websites - takes 15-20 minutes.

---

## Option 2: Docker Setup (Recommended for Testing/Production)

### 1. Build Docker Images

```bash
docker-compose build
```

First build takes 3-5 minutes (downloads dependencies and browsers).

### 2. Run Quick Smoke Test

```bash
docker-compose run --rm test-smoke
```

### 3. Run All Tests

```bash
docker-compose run --rm test
```

### 4. Development Shell

```bash
docker-compose run --rm dev bash
```

Inside container:
```bash
npm run build
npm test
npx ts-node your-script.ts
```

### 5. Production Deployment

```bash
# Start production server
docker-compose up -d app

# View logs
docker-compose logs -f app

# Stop
docker-compose down
```

---

## Common Setup Issues

### Issue: "Cannot find module"

**Cause**: TypeScript not compiled or imports are wrong

**Fix**:
```bash
npm run build
# or
npx tsc
```

Verify imports use correct paths:
```typescript
import { BlocketPlaywright } from './SiteScrapers/index';  // ✅ Correct
import { BlocketPlaywright } from './SiteScrapers';       // ✅ Also works
import { BlocketPlaywright } from './dist/SiteScrapers';  // ❌ Wrong - use source, not dist
```

### Issue: "Unknown file extension .ts"

**Cause**: Node.js can't run TypeScript directly without loader

**Fix**: Use proper npm script or ts-node loader:
```bash
# Using npm script (preferred)
npm run test:quick

# Direct command with loader
node --loader ts-node/esm test-quick.ts

# NOT: npx ts-node test-quick.ts (old syntax, may not work)
```

### Issue: "docker-compose not found"

**Cause**: Docker Compose not installed

**Fix**:
```bash
# macOS (Homebrew)
brew install docker-compose

# Ubuntu/Debian
sudo apt-get install docker-compose

# Or use Docker Desktop (includes docker-compose)
```

### Issue: "port 3000 already in use"

**Cause**: Another service using the port

**Fix**:
```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
docker-compose run -p 3001:3000 dev
```

### Issue: "Cannot connect to Docker daemon"

**Cause**: Docker not running

**Fix**:
```bash
# Linux
sudo systemctl start docker

# macOS
open -a Docker

# Windows
# Open Docker Desktop application
```

### Issue: "Playwright browsers not installed"

**Cause**: Playwright browsers not downloaded

**Fix**:
```bash
# Install Playwright browsers
npx playwright install

# Or in Docker
docker-compose build --no-cache
```

### Issue: "Out of disk space"

**Cause**: Docker images/containers use space

**Fix**:
```bash
# Clean up Docker
docker system prune -a --volumes

# Or specific cleanup
docker image prune -a
docker container prune
docker volume prune
```

---

## Project Structure

```
HIFI_Scrapers_Terminal/
├── SiteScrapers/                  # Main scraper module
│   ├── index.ts                   # Exports all scrapers
│   ├── types.ts                   # TypeScript interfaces
│   ├── BaseScraper.ts             # Base class
│   ├── utils.ts                   # Utility functions
│   ├── README.md                  # Module documentation
│   └── scrapers/                  # Individual scrapers (15 files)
│       ├── AkkelisAudio.ts
│       ├── Blocket.ts
│       └── ... (13 more)
│
├── tests/                         # Test files
│   ├── basic.test.ts              # Unit tests
│   └── integration.test.ts        # Real website tests
│
├── dist/                          # Compiled JavaScript (generated)
│   └── SiteScrapers/
│       ├── index.js
│       ├── types.js
│       └── ... (compiled files)
│
├── Configuration Files
│   ├── package.json               # Node.js dependencies
│   ├── tsconfig.json              # TypeScript configuration
│   ├── Dockerfile                 # Docker build file
│   ├── docker-compose.yml         # Docker services
│   ├── .dockerignore              # Docker excludes
│   ├── .env.example               # Configuration template
│   └── .node-version              # Node.js version
│
├── Documentation Files
│   ├── README.md                  # Project overview
│   ├── SETUP.md                   # This file
│   ├── DOCKER.md                  # Docker reference
│   ├── DOCKER_README.md           # Docker overview
│   ├── DOCKER_QUICK_START.md      # Docker cheat sheet
│   ├── TESTING_GUIDE.md           # Testing documentation
│   ├── TEST_SUMMARY.md            # Testing quick reference
│   └── ... (more documentation)
│
└── Test Files
    └── test-quick.ts              # Smoke tests
```

---

## Development Workflow

### 1. Make Changes to Scrapers

Edit files in `SiteScrapers/` directory.

### 2. Compile TypeScript

```bash
npm run build
```

### 3. Run Tests

```bash
# Quick test
npm run test:quick

# Unit tests
npm run test:basic

# All tests
npm test
```

### 4. Check for Errors

```bash
npm run lint
```

### 5. Clean Build

```bash
npm run clean
npm run build
```

---

## Environment Configuration

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# Node Environment
NODE_ENV=development
DEBUG=true

# Scraper Settings
TIMEOUT=30000          # Request timeout (ms)
MAX_PAGES=5            # Max pages per site
REQUEST_DELAY=1000     # Delay between requests (ms)

# Playwright
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOW_MO=0

# Output
OUTPUT_DIR=./output
LOG_DIR=./logs
LOG_LEVEL=info
```

---

## NPM Scripts Reference

| Script | Purpose |
|--------|---------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run lint` | Check for TypeScript errors |
| `npm test` | Run all tests (Playwright) |
| `npm run test:quick` | Run quick smoke tests (2 min) |
| `npm run test:basic` | Run unit tests (5 min) |
| `npm run test:integration` | Run real website tests (20 min) |
| `npm run dev` | Interactive ts-node shell |
| `npm run clean` | Remove dist directory |

---

## Docker Commands Quick Reference

| Task | Command |
|------|---------|
| **Build** | `docker-compose build` |
| **Quick test** | `docker-compose run --rm test-smoke` |
| **Full tests** | `docker-compose run --rm test` |
| **Dev shell** | `docker-compose run --rm dev bash` |
| **Production** | `docker-compose up -d app` |
| **View logs** | `docker-compose logs -f app` |
| **Stop** | `docker-compose down` |

---

## Next Steps After Setup

1. **Verify Installation**
   ```bash
   npm run test:quick
   ```

2. **Build TypeScript**
   ```bash
   npm run build
   ```

3. **Start Development**
   ```bash
   # Edit files in SiteScrapers/
   # Changes are reflected with npm scripts
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

5. **Deploy to Production**
   ```bash
   docker-compose up -d app
   ```

---

## IDE Setup Recommendations

### Visual Studio Code

**Extensions** to install:
- TypeScript Vue Plugin
- Prettier - Code formatter
- ESLint
- Playwright Test for VSCode

**Settings** (.vscode/settings.json):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

### WebStorm / IntelliJ IDEA

- Uses TypeScript automatically
- Recognizes tsconfig.json
- Integrated terminal runs npm scripts

---

## Useful Commands

### Reinstall Dependencies

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update all
npm update

# Update specific package
npm install playwright@latest
```

### Clear Cache

```bash
# npm cache
npm cache clean --force

# Playwright
rm -rf ~/.cache/ms-playwright
```

---

## Testing Notes

### Smoke Tests (test-quick.ts)
- Runs in 2 minutes
- No real website access
- Tests utility functions and interfaces
- Good for CI/CD

### Unit Tests (tests/basic.test.ts)
- Runs in 5 minutes
- Tests individual utilities
- Uses Playwright test framework
- No real website access

### Integration Tests (tests/integration.test.ts)
- Runs in 15-20 minutes
- Accesses real websites
- Requires internet connection
- Tests actual scraping functionality

---

## Performance Tips

### Faster Development

```bash
# Use watch mode during development
npm run build -- --watch

# Keep container running
docker-compose run -d dev sleep infinity
docker-compose exec dev npm test
```

### Faster Docker Builds

```bash
# Use BuildKit (faster)
DOCKER_BUILDKIT=1 docker-compose build

# Build without cache
docker-compose build --no-cache
```

---

## Getting Help

### Check Documentation

1. **Quick Start**: [DOCKER_QUICK_START.md](DOCKER_QUICK_START.md)
2. **Full Guide**: [DOCKER.md](DOCKER.md)
3. **Testing**: [TESTING_GUIDE.md](TESTING_GUIDE.md)
4. **API**: [SiteScrapers/README.md](SiteScrapers/README.md)

### Troubleshooting

1. Check error message carefully
2. Run `npm run lint` to check TypeScript
3. Clear cache: `npm cache clean --force`
4. Reinstall: `rm -rf node_modules && npm install`
5. Check Docker: `docker system df` (disk usage)

### Common Questions

**Q: Why is build slow?**
A: First build downloads Playwright browsers (~500 MB). Subsequent builds are much faster due to caching.

**Q: Can I use a different Node version?**
A: Yes, but 18.0.0+ is recommended. Check `.node-version` file.

**Q: How do I debug scrapers?**
A: Set `DEBUG=true` in `.env` and use `PLAYWRIGHT_HEADLESS=false` to see browser.

**Q: Can I run in production without Docker?**
A: Yes, but Docker is recommended for consistency and isolation.

---

## Summary

| Step | Command |
|------|---------|
| 1. Install | `npm install` |
| 2. Build | `npm run build` |
| 3. Test | `npm run test:quick` |
| 4. Develop | Edit files in `SiteScrapers/` |
| 5. Deploy | `docker-compose up -d app` |

**Setup complete!** Start developing with confidence. 🚀

