const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function run() {
  const rawUrl = (process.env.DATABASE_URL || process.env.POSTGRES_URL || '').trim().replace(/^["']+|["']+$/g, '');
  if (!rawUrl) {
    console.error('DATABASE_URL is not set in environment.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: rawUrl,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Connecting to Supabase PostgreSQL...');
    await client.connect();
    console.log('Connected successfully.');

    const sqlPath = path.join(__dirname, '..', 'prisma', 'migrations', 'supabase_complete_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Applying complete schema and User table migration...');
    await client.query(sql);

    console.log('Migration executed successfully!');

    // Verify tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Current Public Tables in Supabase:', res.rows.map((r) => r.table_name));

    // Verify User table columns
    const userColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'User' 
      ORDER BY ordinal_position;
    `);
    console.log('User Table Columns in Supabase:', userColumns.rows.map((r) => `${r.column_name} (${r.data_type})`));

    // Verify Task table columns
    const taskColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'Task' 
      ORDER BY ordinal_position;
    `);
    console.log('Task Table Columns in Supabase:', taskColumns.rows.map((r) => `${r.column_name} (${r.data_type})`));

  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
