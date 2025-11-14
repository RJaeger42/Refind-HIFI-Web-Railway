#!/bin/bash
# Verify Postgres service and apply schema
# Usage: ./verify-postgres.sh

echo "🔍 Phase 2: Verifying Postgres Service"
echo ""

# Get DATABASE_URL from Railway
echo "📡 Fetching DATABASE_URL from Railway..."
DB_URL=$(railway variables --service Postgres | grep DATABASE_URL | awk -F '│' '{print $3}' | tr -d ' ')

if [ -z "$DB_URL" ]; then
    echo "❌ Could not fetch DATABASE_URL from Railway"
    echo "Please get it manually from Railway Dashboard → Postgres → Variables"
    exit 1
fi

echo "✅ DATABASE_URL found (truncated for security)"
echo ""

# Test connection
echo -n "🔌 Testing database connection... "
if psql "$DB_URL" -c "SELECT 1" > /dev/null 2>&1; then
    echo "✅ SUCCESS"
else
    echo "❌ FAILED"
    echo "   Check DATABASE_URL is correct"
    exit 1
fi

echo ""
echo "📊 Checking existing tables..."
psql "$DB_URL" -c "\dt" 2>/dev/null || echo "No tables yet"

echo ""
echo "📝 Applying schema updates..."
psql "$DB_URL" -f database/schema.sql

echo ""
echo "✅ Verifying tables created:"
psql "$DB_URL" -c "\dt" | grep -E "listings|price_history|scraper_errors"

echo ""
echo "📈 Checking data:"
psql "$DB_URL" -c "SELECT 
    (SELECT COUNT(*) FROM listings) as listings,
    (SELECT COUNT(*) FROM price_history) as price_history,
    (SELECT COUNT(*) FROM scraper_errors) as errors;"

echo ""
echo "✅ Phase 2 Complete - Postgres ready!"
