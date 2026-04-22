#!/usr/bin/env node

/**
 * Create Test User Account Script
 * 
 * This script creates a test user account in the Karz Juice system
 * for testing purposes without requiring OAuth authentication.
 * 
 * Usage: node scripts/create-test-user.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

/**
 * Parse MySQL connection string
 */
function parseConnectionString(url) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || 3306,
    user: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1),
    ssl: {}, // TiDB requires SSL
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  };
}

/**
 * Create test user
 */
async function createTestUser() {
  const config = parseConnectionString(DATABASE_URL);
  
  console.log('🔌 Connecting to database...');
  const connection = await mysql.createConnection(config);
  
  try {
    // Test user data
    const testUser = {
      openId: 'test-user-' + Date.now(),
      name: 'Test User',
      email: 'test@karzjuice.local',
      loginMethod: 'test',
      role: 'admin', // Admin role for full access
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };

    console.log('\n📝 Creating test user with details:');
    console.log('  - Name:', testUser.name);
    console.log('  - Email:', testUser.email);
    console.log('  - OpenID:', testUser.openId);
    console.log('  - Role:', testUser.role);
    console.log('  - Login Method:', testUser.loginMethod);

    // Insert user
    const query = `
      INSERT INTO users (openId, name, email, loginMethod, role, createdAt, updatedAt, lastSignedIn)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await connection.execute(query, [
      testUser.openId,
      testUser.name,
      testUser.email,
      testUser.loginMethod,
      testUser.role,
      testUser.createdAt,
      testUser.updatedAt,
      testUser.lastSignedIn,
    ]);

    console.log('\n✅ Test user created successfully!');
    console.log('  - User ID:', result.insertId);
    console.log('  - OpenID:', testUser.openId);

    // Create default organization if not exists
    console.log('\n🏢 Setting up organization...');
    const orgQuery = `
      SELECT id FROM organization LIMIT 1
    `;
    const [orgs] = await connection.execute(orgQuery);

    if (orgs.length === 0) {
      const insertOrgQuery = `
        INSERT INTO organization (name, description, createdAt, updatedAt)
        VALUES (?, ?, ?, ?)
      `;
      const [orgResult] = await connection.execute(insertOrgQuery, [
        'Karz Juice Uganda',
        'Test organization for Karz Juice system',
        new Date(),
        new Date(),
      ]);
      console.log('✅ Organization created: Karz Juice Uganda');
    } else {
      console.log('✅ Organization already exists');
    }

    // Create default chart of accounts if not exists
    console.log('\n💰 Setting up chart of accounts...');
    const accountsQuery = `
      SELECT COUNT(*) as count FROM accounts
    `;
    const [accountsResult] = await connection.execute(accountsQuery);

    if (accountsResult[0].count === 0) {
      const defaultAccounts = [
        { code: '1000', name: 'Cash Account', type: 'asset', category: 'cash' },
        { code: '1001', name: 'Mobile Money (MTN)', type: 'asset', category: 'mobile_money' },
        { code: '2000', name: 'Function Accounts', type: 'asset', category: 'function' },
        { code: '3000', name: "Owner's Equity", type: 'equity', category: 'other' },
        { code: '4000', name: 'Sales Revenue', type: 'income', category: 'other' },
        { code: '4100', name: 'Function Income', type: 'income', category: 'other' },
        { code: '5000', name: 'Operating Expenses', type: 'expense', category: 'other' },
        { code: '5100', name: 'Cost of Goods Sold', type: 'expense', category: 'other' },
      ];

      for (const account of defaultAccounts) {
        const insertAccountQuery = `
          INSERT INTO accounts (code, name, type, category, balance, isActive, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(insertAccountQuery, [
          account.code,
          account.name,
          account.type,
          account.category,
          0,
          true,
          new Date(),
          new Date(),
        ]);
      }
      console.log('✅ Chart of accounts created with', defaultAccounts.length, 'default accounts');
    } else {
      console.log('✅ Chart of accounts already exists');
    }

    // Create default products if not exists
    console.log('\n🥤 Setting up products...');
    const productsQuery = `
      SELECT COUNT(*) as count FROM products
    `;
    const [productsResult] = await connection.execute(productsQuery);

    if (productsResult[0].count === 0) {
      const defaultProducts = [
        {
          name: 'Mango Juice 0.2L',
          sku: 'MJ-0.2L',
          category: 'Fresh Juice',
          description: 'Fresh mango juice, 0.2L bottle',
          price: 10000,
          unit: 'bottle',
          reorderLevel: 20,
        },
        {
          name: 'Mango Juice 0.5L',
          sku: 'MJ-0.5L',
          category: 'Fresh Juice',
          description: 'Fresh mango juice, 0.5L bottle',
          price: 15000,
          unit: 'bottle',
          reorderLevel: 15,
        },
        {
          name: 'Beetroot Mix 1L',
          sku: 'BM-1L',
          category: 'Detox',
          description: 'Beetroot and carrot mix, 1L bottle',
          price: 8500,
          unit: 'bottle',
          reorderLevel: 10,
        },
        {
          name: 'Pineapple Ginger Shot 250ml',
          sku: 'PGS-250',
          category: 'Energy Boost',
          description: 'Pineapple ginger shot, 250ml',
          price: 6000,
          unit: 'bottle',
          reorderLevel: 15,
        },
        {
          name: 'Mixed Fruit Smoothie 750ml',
          sku: 'MFS-750',
          category: 'Premium Blend',
          description: 'Mixed fruit smoothie, 750ml',
          price: 12000,
          unit: 'bottle',
          reorderLevel: 8,
        },
      ];

      for (const product of defaultProducts) {
        const insertProductQuery = `
          INSERT INTO products (name, sku, category, description, price, unit, reorderLevel, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await connection.execute(insertProductQuery, [
          product.name,
          product.sku,
          product.category,
          product.description,
          product.price,
          product.unit,
          product.reorderLevel,
          new Date(),
          new Date(),
        ]);
      }
      console.log('✅ Products created:', defaultProducts.length, 'default products');
    } else {
      console.log('✅ Products already exist');
    }

    console.log('\n' + '='.repeat(50));
    console.log('🎉 TEST ENVIRONMENT SETUP COMPLETE');
    console.log('='.repeat(50));
    console.log('\n📋 Test User Credentials:');
    console.log('  - OpenID: ' + testUser.openId);
    console.log('  - Email: ' + testUser.email);
    console.log('  - Name: ' + testUser.name);
    console.log('  - Role: ' + testUser.role);
    console.log('\n💡 Next Steps:');
    console.log('  1. The system uses OAuth authentication');
    console.log('  2. To log in, you would normally use Google/Facebook/etc.');
    console.log('  3. For testing, you can manually set a session cookie');
    console.log('  4. Or use the browser developer tools to simulate OAuth');
    console.log('\n📝 To use this test account:');
    console.log('  1. Open the application in your browser');
    console.log('  2. Open Developer Tools (F12)');
    console.log('  3. Go to Application > Cookies');
    console.log('  4. Create a session cookie with the test user data');
    console.log('  5. Or contact the development team for OAuth test credentials');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Error creating test user:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

// Run
createTestUser();
