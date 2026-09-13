const { Client } = require('pg');

async function setup() {
  console.log('Connecting to PostgreSQL admin...');
  const adminClient = new Client({
    connectionString: 'postgres://postgres:postgres@localhost:5432/postgres'
  });

  try {
    await adminClient.connect();
    console.log('✅ Connected to PostgreSQL server as admin!');

    // Check if sitetrack database exists
    const dbCheck = await adminClient.query("SELECT 1 FROM pg_database WHERE datname = 'sitetrack'");
    if (dbCheck.rows.length === 0) {
      await adminClient.query('CREATE DATABASE sitetrack');
      console.log('✅ Created database: sitetrack');
    } else {
      console.log('ℹ️ Database "sitetrack" already exists.');
    }

    // Check if sitetrack user exists
    const userCheck = await adminClient.query("SELECT 1 FROM pg_roles WHERE rolname = 'sitetrack'");
    if (userCheck.rows.length === 0) {
      await adminClient.query("CREATE USER sitetrack WITH PASSWORD 'sitetrack123'");
      console.log('✅ Created user: sitetrack');
    } else {
      await adminClient.query("ALTER USER sitetrack WITH PASSWORD 'sitetrack123'");
      console.log('ℹ️ Updated user "sitetrack" password.');
    }

    await adminClient.query('GRANT ALL PRIVILEGES ON DATABASE sitetrack TO sitetrack');
    await adminClient.query('ALTER USER sitetrack WITH SUPERUSER');
  } catch (err) {
    console.error('Admin connection error:', err.message);
  } finally {
    await adminClient.end();
  }

  console.log('\nConnecting to "sitetrack" database...');
  const appClient = new Client({
    connectionString: 'postgres://sitetrack:sitetrack123@localhost:5432/sitetrack'
  });

  try {
    await appClient.connect();
    console.log('✅ Successfully connected to "sitetrack" server!');

    // Install postgres extensions
    await appClient.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('✅ Extension "uuid-ossp" installed/verified!');

    await appClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log('✅ Extension "pgcrypto" installed/verified!');

    const extRes = await appClient.query('SELECT extname, extversion FROM pg_extension');
    console.log('\nActive PostgreSQL Extensions:');
    extRes.rows.forEach(row => {
      console.log(` - ${row.extname} (v${row.extversion})`);
    });
  } catch (err) {
    console.error('App database connection error:', err.message);
  } finally {
    await appClient.end();
  }
}

setup();
