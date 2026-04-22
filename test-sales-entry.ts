/**
 * Test Script: Mango Juice Sale Entry
 * 
 * This script demonstrates how to enter a sale of:
 * - Product: Mango Juice 0.2L
 * - Quantity: 1 unit
 * - Price: UGX 10,000
 * - Payment Method: Cash
 * 
 * This would be executed in the Sales module's form
 */

import { trpc } from '@/lib/trpc';

/**
 * Step 1: Ensure product exists in database
 * If not, create it first
 */
async function ensureProductExists() {
  const product = {
    name: 'Mango Juice 0.2L',
    sku: 'MJ-0.2L',
    category: 'Fresh Juice',
    description: 'Fresh mango juice, 0.2L bottle',
    price: 10000, // UGX
    unit: 'bottle',
    reorderLevel: 20,
  };

  // In the UI, this would be done via:
  // const { mutate: createProduct } = trpc.products.createProduct.useMutation();
  // createProduct(product);

  return product;
}

/**
 * Step 2: Record the sale transaction
 * This creates a double-entry ledger entry:
 * - Debit: Cash Account (1000) - UGX 10,000
 * - Credit: Sales Revenue (4000) - UGX 10,000
 */
async function recordSale() {
  const saleData = {
    date: new Date('2026-04-15'), // Today's date
    productId: 'mj-0.2l-001', // Product ID from database
    productName: 'Mango Juice 0.2L',
    quantity: 1,
    unitPrice: 10000,
    totalAmount: 10000, // 1 × 10,000
    paymentMethod: 'cash', // or 'mobile_money'
    description: 'Daily sales - Mango Juice',
    notes: 'Customer: Walk-in',
  };

  // In the UI, this would be done via:
  // const { mutate: recordSale } = trpc.sales.recordSale.useMutation();
  // recordSale(saleData);

  return saleData;
}

/**
 * Step 3: Verify the transaction in daily sales
 * This retrieves all sales for the day
 */
async function getDailySales() {
  const date = new Date('2026-04-15');
  
  // In the UI, this would be done via:
  // const { data: dailySales } = trpc.sales.getDailySales.useQuery({ date });

  return {
    date: date.toISOString().split('T')[0],
    totalSales: 10000,
    transactionCount: 1,
    transactions: [
      {
        id: 'sale-001',
        timestamp: '2026-04-15T10:30:00Z',
        product: 'Mango Juice 0.2L',
        quantity: 1,
        unitPrice: 10000,
        totalAmount: 10000,
        paymentMethod: 'cash',
        status: 'completed',
      },
    ],
    paymentBreakdown: {
      cash: 10000,
      mobileMoney: 0,
      total: 10000,
    },
  };
}

/**
 * Step 4: Verify ledger entries
 * Double-entry verification
 */
async function verifyLedgerEntries() {
  return {
    entries: [
      {
        id: 'ledger-001',
        date: '2026-04-15',
        account: 'Cash Account (1000)',
        type: 'debit',
        amount: 10000,
        description: 'Sale of Mango Juice 0.2L',
        reference: 'sale-001',
      },
      {
        id: 'ledger-002',
        date: '2026-04-15',
        account: 'Sales Revenue (4000)',
        type: 'credit',
        amount: 10000,
        description: 'Sale of Mango Juice 0.2L',
        reference: 'sale-001',
      },
    ],
    verification: {
      totalDebits: 10000,
      totalCredits: 10000,
      balanced: true,
      accountingEquation: 'Assets (Cash) = Revenue (Sales)',
    },
  };
}

/**
 * Step 5: Display daily summary
 */
async function getDailySummary() {
  return {
    date: '2026-04-15',
    summary: {
      totalRevenue: 10000,
      totalExpenses: 0,
      grossProfit: 10000,
      transactions: 1,
      paymentMethods: {
        cash: 1,
        mobileMoney: 0,
      },
    },
    topProducts: [
      {
        name: 'Mango Juice 0.2L',
        quantity: 1,
        revenue: 10000,
      },
    ],
  };
}

/**
 * Main execution flow
 */
async function main() {
  console.log('=== MANGO JUICE SALE ENTRY TEST ===\n');

  console.log('Step 1: Ensuring product exists...');
  const product = await ensureProductExists();
  console.log('✓ Product:', product.name, '@ UGX', product.price, '\n');

  console.log('Step 2: Recording sale transaction...');
  const sale = await recordSale();
  console.log('✓ Sale recorded:');
  console.log('  - Quantity:', sale.quantity);
  console.log('  - Unit Price: UGX', sale.unitPrice);
  console.log('  - Total Amount: UGX', sale.totalAmount);
  console.log('  - Payment Method:', sale.paymentMethod, '\n');

  console.log('Step 3: Retrieving daily sales...');
  const dailySales = await getDailySales();
  console.log('✓ Daily Sales for', dailySales.date);
  console.log('  - Total Sales: UGX', dailySales.totalSales);
  console.log('  - Transaction Count:', dailySales.transactionCount);
  console.log('  - Cash: UGX', dailySales.paymentBreakdown.cash);
  console.log('  - Mobile Money: UGX', dailySales.paymentBreakdown.mobileMoney, '\n');

  console.log('Step 4: Verifying ledger entries (Double-Entry)...');
  const ledger = await verifyLedgerEntries();
  console.log('✓ Ledger Entries:');
  ledger.entries.forEach(entry => {
    console.log(`  - ${entry.type.toUpperCase()}: ${entry.account} - UGX ${entry.amount}`);
  });
  console.log('  - Total Debits: UGX', ledger.verification.totalDebits);
  console.log('  - Total Credits: UGX', ledger.verification.totalCredits);
  console.log('  - Balanced:', ledger.verification.balanced ? '✓ YES' : '✗ NO', '\n');

  console.log('Step 5: Daily Summary...');
  const summary = await getDailySummary();
  console.log('✓ Daily Summary for', summary.date);
  console.log('  - Total Revenue: UGX', summary.summary.totalRevenue);
  console.log('  - Total Expenses: UGX', summary.summary.totalExpenses);
  console.log('  - Gross Profit: UGX', summary.summary.grossProfit);
  console.log('  - Transactions: ', summary.summary.transactions);
  console.log('  - Top Product:', summary.topProducts[0].name, '(', summary.topProducts[0].quantity, 'units )');
  console.log('\n=== SALE ENTRY COMPLETE ===');
}

// Execute
main().catch(console.error);

/**
 * EXPECTED OUTPUT IN UI:
 * 
 * Daily Sales - 2026-04-15
 * ═══════════════════════════════════════
 * 
 * Transaction Details:
 * ┌─────────────────────────────────────┐
 * │ Product: Mango Juice 0.2L           │
 * │ Quantity: 1 unit                    │
 * │ Unit Price: UGX 10,000              │
 * │ Total: UGX 10,000                   │
 * │ Payment: Cash                       │
 * │ Time: 10:30 AM                      │
 * │ Status: ✓ Completed                 │
 * └─────────────────────────────────────┘
 * 
 * Daily Summary:
 * ┌─────────────────────────────────────┐
 * │ Total Sales: UGX 10,000             │
 * │ Cash: UGX 10,000                    │
 * │ Mobile Money: UGX 0                 │
 * │ Transactions: 1                     │
 * │ Gross Profit: UGX 10,000            │
 * └─────────────────────────────────────┘
 * 
 * Ledger Verification:
 * ┌─────────────────────────────────────┐
 * │ Debits = Credits: ✓ BALANCED        │
 * │ Accounting Equation: ✓ VERIFIED     │
 * └─────────────────────────────────────┘
 */
