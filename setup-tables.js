// setup-tables.js
import 'dotenv/config';
import { db } from './dist-server/server/db.js'; // ← Use the built file
import { sql } from 'drizzle-orm';

async function setupTables() {
  try {
    console.log('🔄 Creating database tables...');
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        "isAdmin" BOOLEAN DEFAULT FALSE,
        "walletBalance" VARCHAR(255) DEFAULT '0',
        "phonePrefix" VARCHAR(10),
        "phoneNumber" VARCHAR(20),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create user_plans table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_plans (
        id SERIAL PRIMARY KEY,
        "userId" INTEGER REFERENCES users(id),
        "planType" VARCHAR(255) NOT NULL,
        "investmentAmount" DECIMAL(10,2) NOT NULL,
        "expectedReturn" DECIMAL(10,2) NOT NULL,
        "roi" DECIMAL(5,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Database tables created successfully!');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

setupTables();