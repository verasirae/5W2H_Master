import { NextResponse } from 'next/server';
import { getSanitizedDatabaseUrl, isDatabaseConfigured } from '@/lib/prisma';
import { Client } from 'pg';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'schema.sql');
  let sqlContent = '';
  try {
    sqlContent = fs.readFileSync(sqlPath, 'utf8');
  } catch {
    sqlContent = '-- Migration file not found';
  }

  return NextResponse.json({
    configured: isDatabaseConfigured(),
    sql: sqlContent,
  });
}

export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        message:
          'DATABASE_URL não configurada no ambiente.',
      },
      { status: 400 }
    );
  }

  const cleanUrl = getSanitizedDatabaseUrl();
  const isLocal = cleanUrl.includes('localhost') || cleanUrl.includes('127.0.0.1');
  const client = new Client({
    connectionString: cleanUrl,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });

  try {
    const sqlPath = path.join(process.cwd(), 'prisma', 'migrations', 'schema.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await client.connect();
    await client.query(sqlContent);

    // Fetch verified tables list
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    const tables = res.rows.map((r) => r.table_name);

    return NextResponse.json({
      success: true,
      message: `Tabelas criadas/atualizadas com sucesso no PostgreSQL Local: ${tables.join(', ')}`,
      tables,
    });
  } catch (error: any) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Falha ao executar migração direta',
      },
      { status: 500 }
    );
  } finally {
    try {
      await client.end();
    } catch {
      // ignore
    }
  }
}
