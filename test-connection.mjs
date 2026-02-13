import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://cryptopay_user:D5vC78mxWNvAqCKhhKIoMFHrVMe86Xgt@dpg-d62iih68alac73df0ceg-a.oregon-postgres.render.com:5432/cryptopay_grra";

async function testConnection() {
  console.log('🔍 Testing PostgreSQL connection...');
  console.log('Host:', connectionString.split('@')[1]?.split(':')[0]);
  
  const client = new Client({
    connectionString: connectionString,
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
  });

  try {
    console.log('⏳ Connecting (may take 30-60 seconds on Render free tier)...');
    await client.connect();
    console.log('✅ Connected successfully!');
    
    const result = await client.query('SELECT NOW() as current_time');
    console.log('✅ Database time:', result.rows[0].current_time);
    
    const dbResult = await client.query("SELECT datname FROM pg_database WHERE datname = 'cryptopay_grra'");
    if (dbResult.rows.length > 0) {
      console.log('✅ Database "cryptopay_grra" exists');
    } else {
      console.log('❌ Database "cryptopay_grra" does not exist');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('ECONNRESET')) {
      console.log('\n⚠️  Render free tier database is SLEEPING or DELETED');
      console.log('Free tier databases:');
      console.log('1. Sleep after inactivity');
      console.log('2. Auto-delete after 90 days');
      console.log('3. First connection takes 30-60 seconds to wake');
    }
    
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});