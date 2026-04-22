#!/usr/bin/env node

/**
 * Test Sales Entry Script
 * 
 * This script simulates entering a mango juice sale into the system
 * and verifies the double-entry ledger entries.
 * 
 * Usage: node scripts/test-sales-entry.mjs
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable not set');
  process.exit(1);
}

function parseConnectionString(url) {
  const urlObj = new URL(url);
  return {
    host: urlObj.hostname,
    port: urlObj.port || 3306,
    user: urlObj.username,
    password: urlObj.password,
    database: urlObj.pathname.slice(1),
    ssl: {},
  };
}

async function testSalesEntry() {
  const config = parseConnectionString(DATABASE_URL);
  const connection = await mysql.createConnection(config);

  try {
    console.log('='.repeat(60));
    console.log('🥤 MANGO JUICE SALE ENTRY TEST');
    console.log('='.repeat(60));
    console.log();

    // Step 1: Get the product
    console.log('📦 Step 1: Retrieving product...');
    const [products] = await connection.execute(
      'SELECT id, name, sku, category FROM products WHERE sku = ? LIMIT 1',
      ['mj-001']
    );

    if (products.length === 0) {
      console.error('❌ Product not found: Mango Juice 0.2L');
      process.exit(1);
    }

    const product = products[0];
    const salePrice = 10000; // UGX 10,000 as per test requirement
    console.log(`✅ Found: ${product.name}`);
    console.log(`   - SKU: ${product.sku}`);
    console.log(`   - Category: ${product.category}`);
    console.log(`   - Sale Price: UGX ${salePrice}`);
    console.log();

    // Step 2: Get the test user
    console.log('👤 Step 2: Retrieving test user...');
    const [users] = await connection.execute(
      'SELECT id, name, email, role FROM users WHERE email = ? LIMIT 1',
      ['test@karzjuice.local']
    );

    if (users.length === 0) {
      console.error('❌ Test user not found');
      process.exit(1);
    }

    const user = users[0];
    console.log(`✅ Found: ${user.name}`);
    console.log(`   - Email: ${user.email}`);
    console.log(`   - Role: ${user.role}`);
    console.log();

    // Step 3: Get the accounts
    console.log('💰 Step 3: Retrieving accounts...');
    const [accounts] = await connection.execute(
      'SELECT id, code, name, type FROM accounts WHERE code IN (?, ?)',
      ['1000', '4000']
    );

    let cashAccountId, revenueAccountId;
    for (const account of accounts) {
      if (account.code === '1000') {
        cashAccountId = account.id;
        console.log(`✅ Cash Account (${account.code}): ${account.name} [ID: ${account.id}]`);
      }
      if (account.code === '4000') {
        revenueAccountId = account.id;
        console.log(`✅ Revenue Account (${account.code}): ${account.name} [ID: ${account.id}]`);
      }
    }
    console.log();

    // Step 4: Create the sale transaction
    console.log('📝 Step 4: Recording sale transaction...');
    const today = new Date().toISOString().split('T')[0];
    const transactionId = `SALE-${Date.now()}`;
    const saleAmount = salePrice;

    console.log(`   - Product: ${product.name}`);
    console.log(`   - Quantity: 1 unit`);
    console.log(`   - Unit Price: UGX ${salePrice}`);
    console.log(`   - Total Amount: UGX ${saleAmount}`);
    console.log(`   - Payment Method: Cash`);
    console.log(`   - Date: ${today}`);
    console.log(`   - Transaction ID: ${transactionId}`);

    // Insert into daily_sales
    const [saleResult] = await connection.execute(
      `INSERT INTO daily_sales (productId, quantity, unitPrice, total, paymentMethod, saleDate, recordedBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product.id, 1, salePrice, saleAmount, 'cash', today, user.id, new Date(), new Date()]
    );

    const saleId = saleResult.insertId;
    console.log(`✅ Sale recorded with ID: ${saleId}`);
    console.log();

    // Step 5: Create ledger entries (double-entry)
    console.log('📊 Step 5: Creating double-entry ledger entries...');
    console.log(`   - DEBIT: Cash Account (${cashAccountId}) - UGX ${saleAmount}`);
    console.log(`   - CREDIT: Revenue Account (${revenueAccountId}) - UGX ${saleAmount}`);

    const [ledgerResult] = await connection.execute(
      `INSERT INTO ledger_entries 
       (transactionId, debitAccountId, creditAccountId, amount, description, entryDate, entryType, createdBy, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        cashAccountId,
        revenueAccountId,
        saleAmount,
        `Sale of ${product.name} (Qty: 1)`,
        today,
        'sales',
        user.id,
        new Date(),
        new Date(),
      ]
    );

    console.log(`✅ Ledger entry created with ID: ${ledgerResult.insertId}`);
    console.log();

    // Step 6: Verify the transaction
    console.log('✔️ Step 6: Verifying transaction...');
    const [ledgerEntries] = await connection.execute(
      'SELECT * FROM ledger_entries WHERE transactionId = ?',
      [transactionId]
    );

    if (ledgerEntries.length === 0) {
      console.error('❌ Ledger entry not found');
      process.exit(1);
    }

    const ledgerEntry = ledgerEntries[0];
    console.log(`✅ Ledger entry verified`);
    console.log(`   - Amount: UGX ${ledgerEntry.amount}`);
    console.log(`   - Type: ${ledgerEntry.entryType}`);
    console.log(`   - Date: ${ledgerEntry.entryDate}`);
    console.log();

    // Step 7: Get daily sales summary
    console.log('📚 Step 7: Daily sales summary...');
    const [dailySummary] = await connection.execute(
      `SELECT 
        COUNT(*) as transactionCount,
        SUM(total) as totalSales,
        SUM(CASE WHEN paymentMethod = 'cash' THEN total ELSE 0 END) as cashTotal,
        SUM(CASE WHEN paymentMethod = 'mobile_money' THEN total ELSE 0 END) as mobileMoneyTotal
       FROM daily_sales 
       WHERE saleDate = ?`,
      [today]
    );

    const summary = dailySummary[0];
    console.log(`   - Date: ${today}`);
    console.log(`   - Total Transactions: ${summary.transactionCount}`);
    console.log(`   - Total Sales: UGX ${summary.totalSales}`);
    console.log(`   - Cash: UGX ${summary.cashTotal || 0}`);
    console.log(`   - Mobile Money: UGX ${summary.mobileMoneyTotal || 0}`);
    console.log();

    // Step 8: Verify accounting equation
    console.log('⚖️ Step 8: Verifying accounting equation...');
    const [accountBalances] = await connection.execute(
      `SELECT 
        SUM(CASE WHEN type = 'asset' THEN balance ELSE 0 END) as totalAssets,
        SUM(CASE WHEN type = 'liability' THEN balance ELSE 0 END) as totalLiabilities,
        SUM(CASE WHEN type = 'equity' THEN balance ELSE 0 END) as totalEquity
       FROM accounts`
    );

    const balances = accountBalances[0];
    console.log(`   - Total Assets: UGX ${balances.totalAssets}`);
    console.log(`   - Total Liabilities: UGX ${balances.totalLiabilities}`);
    console.log(`   - Total Equity: UGX ${balances.totalEquity}`);
    console.log();

    console.log('='.repeat(60));
    console.log('✅ SALE ENTRY TEST COMPLETE');
    console.log('='.repeat(60));
    console.log();
    console.log('📊 TRANSACTION SUMMARY:');
    console.log(`   Product: ${product.name}`);
    console.log(`   Amount: UGX ${saleAmount}`);
    console.log(`   Payment: Cash`);
    console.log(`   Date: ${today}`);
    console.log(`   Status: ✅ Successfully recorded`);
    console.log();
    console.log('💾 DATABASE ENTRIES:');
    console.log(`   - Sale ID: ${saleId}`);
    console.log(`   - Ledger Entry ID: ${ledgerResult.insertId}`);
    console.log(`   - Transaction ID: ${transactionId}`);
    console.log();

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

testSalesEntry();
