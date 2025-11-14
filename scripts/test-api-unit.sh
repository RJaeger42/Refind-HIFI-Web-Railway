#!/bin/bash
# Unit test for API service only
# Usage: ./test-api-unit.sh https://your-api-url.railway.app

set -e

API_URL="${1}"
if [ -z "$API_URL" ]; then
    echo "❌ Usage: $0 <API_URL>"
    exit 1
fi

echo "🧪 Testing API service: $API_URL"
echo ""

# Test 1: Health
echo -n "1. Health endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
    curl -s "$API_URL/health" | jq -r '  "   Status: \(.status)", "   DB: \(.checks.database)"'
else
    echo "❌ FAIL (HTTP $STATUS)"
    exit 1
fi

# Test 2: Stats
echo -n "2. Stats endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/stats")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
    curl -s "$API_URL/api/stats" | jq -r '  "   Listings: \(.total_listings)", "   Sites: \(.total_sites)"'
else
    echo "❌ FAIL (HTTP $STATUS)"
    exit 1
fi

# Test 3: Listings
echo -n "3. Listings endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/listings?limit=1")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL (HTTP $STATUS)"
    exit 1
fi

# Test 4: Errors
echo -n "4. Errors endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/errors")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL (HTTP $STATUS)"
    exit 1
fi

# Test 5: Sites
echo -n "5. Sites endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/sites")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL (HTTP $STATUS)"
    exit 1
fi

echo ""
echo "✅ All API unit tests passed!"
