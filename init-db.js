const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || process.env.DATABASE_PUBLIC_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

async function initDatabase() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');

    // Read schema file
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');

    console.log('📋 Running schema...');
    await pool.query(schema);

    console.log('✅ Database schema initialized successfully!');

    // Verify tables exist
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    console.log('\n📊 Tables created:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    // Check if test data exists
    const count = await pool.query('SELECT COUNT(*) FROM listings');
    console.log(`\n📝 Listings in database: ${count.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
