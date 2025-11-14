#!/bin/bash
# Test scraper services
# Usage: ./test-scrapers.sh https://api-url.railway.app [webhook-secret]

API_URL="${1}"
SECRET="${2}"

if [ -z "$API_URL" ]; then
    echo "❌ Usage: $0 <API_URL> [WEBHOOK_SECRET]"
    exit 1
fi

echo "🧪 Testing scraper services via: $API_URL"
echo ""

# Test 1: Scraper status
echo -n "1. Scraper status: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/scrape/status")
if [ "$STATUS" -eq 200 ]; then
    echo "✅ PASS"
    curl -s "$API_URL/api/scrape/status" | jq -r '
        "   Light: \(.light.service // "unknown")",
        "   Heavy: \(.heavy.service // "unknown")"
    '
else
    echo "❌ FAIL (HTTP $STATUS)"
fi

# Test 2: Manual trigger (if secret provided)
if [ -n "$SECRET" ]; then
    echo -n "2. Manual trigger (light): "
    RESULT=$(curl -s -X POST "$API_URL/api/scrape/trigger" \
        -H "Content-Type: application/json" \
        -d '{"container":"light"}')
    
    if echo "$RESULT" | jq -e '.triggered' > /dev/null 2>&1; then
        echo "✅ PASS"
        echo "   Wait 30s for scrape to complete..."
        sleep 30
        
        # Check for new data
        LISTINGS=$(curl -s "$API_URL/api/stats" | jq -r '.total_listings')
        echo "   Total listings now: $LISTINGS"
    else
        echo "❌ FAIL"
        echo "$RESULT" | jq '.'
    fi
else
    echo "2. Manual trigger: ⏭️  SKIP (no webhook secret provided)"
fi

echo ""
echo "✅ Scraper tests complete"
