const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const rawUrl = (
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    'postgresql://postgres:db_postgre_root@localhost:5432/5w2h?schema=public'
  ).trim().replace(/^["']+|["']+$/g, '');

  const isLocal = rawUrl.includes('localhost') || rawUrl.includes('127.0.0.1');
  const client = new Client({
    connectionString: rawUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully.');

    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'schema.sql');
    let sql;
    if (fs.existsSync(sqlPath)) {
      sql = fs.readFileSync(sqlPath, 'utf8');
    } else {
      const fallbackPath = path.join(__dirname, '..', 'prisma', 'migrations', 'supabase_complete_schema.sql');
      if (fs.existsSync(fallbackPath)) {
        sql = fs.readFileSync(fallbackPath, 'utf8');
      }
    }

    if (sql) {
      console.log('Applying database schema...');
      await client.query(sql);
      console.log('Schema executed successfully!');
    }

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Public Tables in Database:', res.rows.map((r) => r.table_name));
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
