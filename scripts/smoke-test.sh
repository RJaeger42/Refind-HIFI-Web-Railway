#!/bin/bash
# Smoke test for hi-fi aggregator deployment
# Run after Railway deployment to verify health

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to production API if no argument
API_BASE_URL="${1:-https://api-production-d092.up.railway.app}"

echo "🧪 Running smoke tests against: $API_BASE_URL"
echo ""

# Test 1: Health endpoint
echo -n "1. Testing /health endpoint... "
HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/health")
if [ "$HEALTH_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $HEALTH_RESPONSE)"
    # Get detailed health info
    curl -s "$API_BASE_URL/health" | jq -r '
        "  - Status: \(.status)",
        "  - Database: \(.checks.database)",
        "  - Scrapers (light): \(.checks.scrapersLight // "unknown")",
        "  - Scrapers (heavy): \(.checks.scrapersHeavy // "unknown")"
    ' 2>/dev/null || echo "  (Could not parse health details)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $HEALTH_RESPONSE)"
    exit 1
fi

# Test 2: API listings endpoint
echo -n "2. Testing /api/listings endpoint... "
LISTINGS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/listings?limit=5")
if [ "$LISTINGS_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $LISTINGS_RESPONSE)"
    LISTING_COUNT=$(curl -s "$API_BASE_URL/api/listings?limit=5" | jq -r '.data | length' 2>/dev/null || echo "?")
    echo "  - Returned $LISTING_COUNT listings"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $LISTINGS_RESPONSE)"
    exit 1
fi

# Test 3: API stats endpoint
echo -n "3. Testing /api/stats endpoint... "
STATS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/stats")
if [ "$STATS_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $STATS_RESPONSE)"
    curl -s "$API_BASE_URL/api/stats" | jq -r '
        "  - Total listings: \(.total_listings)",
        "  - Total sites: \(.total_sites)",
        "  - Last scrape: \(.last_scrape // "never")"
    ' 2>/dev/null || echo "  (Could not parse stats)"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $STATS_RESPONSE)"
    exit 1
fi

# Test 4: API errors endpoint
echo -n "4. Testing /api/errors endpoint... "
ERRORS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/errors?limit=5")
if [ "$ERRORS_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $ERRORS_RESPONSE)"
    ERROR_COUNT=$(curl -s "$API_BASE_URL/api/errors?limit=5" | jq -r '.stats.total_errors' 2>/dev/null || echo "?")
    if [ "$ERROR_COUNT" != "0" ] && [ "$ERROR_COUNT" != "?" ]; then
        echo -e "  ${YELLOW}⚠ Warning: $ERROR_COUNT errors in last 24h${NC}"
    else
        echo "  - No errors in last 24h"
    fi
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $ERRORS_RESPONSE)"
    exit 1
fi

# Test 5: Sites endpoint
echo -n "5. Testing /api/sites endpoint... "
SITES_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$API_BASE_URL/api/sites")
if [ "$SITES_RESPONSE" -eq 200 ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $SITES_RESPONSE)"
    SITE_COUNT=$(curl -s "$API_BASE_URL/api/sites" | jq -r 'length' 2>/dev/null || echo "?")
    echo "  - Found $SITE_COUNT sites"
else
    echo -e "${RED}✗ FAIL${NC} (HTTP $SITES_RESPONSE)"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ All smoke tests passed!${NC}"
echo ""
echo "💡 Next steps:"
echo "   - Check Railway logs for any errors"
echo "   - Monitor /api/errors for scraper failures"
echo "   - Set up Railway alerts for 5xx errors"
