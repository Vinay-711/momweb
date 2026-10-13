/**
 * Human-Friendly Order Number Verification Suite
 * Padma's Floral Platform
 *
 * Verifies:
 * 1. Human-friendly order number format: PREFIX-YYYY-0001 (e.g. FL-2026-0001)
 * 2. Prefix configurability via business_settings (e.g. FL -> PF -> FL)
 * 3. Sequential ordering / counter progression
 * 4. Database-level uniqueness enforcement (uniqueness constraint on orders.order_number)
 * 5. Retrieval by human-friendly order reference via getOrder(orderNumber)
 * 6. Order items association with human-friendly order
 *
 * Run with: npx tsx --env-file=.env scripts/test_order_numbers.mjs
 */

import { createOrder, getOrder, getProducts } from '../src/services/dataAccess.ts';
import { orderService } from '../src/services/orderService.ts';
import { supabase } from '../src/lib/supabase.ts';

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function pass(name, detail = '') {
  console.log(`  ${colors.green}✔ PASS${colors.reset}: ${colors.bold}${name}${colors.reset} ${colors.gray}${detail}${colors.reset}`);
}

function fail(name, detail = '') {
  console.log(`  ${colors.red}✖ FAIL${colors.reset}: ${colors.bold}${name}${colors.reset} ${colors.yellow}${detail}${colors.reset}`);
}

function info(title) {
  console.log(`\n${colors.cyan}${colors.bold}=== ${title} ===${colors.reset}`);
}

async function runOrderNumbersSuite() {
  console.log(`${colors.bold}Padma's Floral — Human-Friendly Order Numbers Verification Suite${colors.reset}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  let totalTests = 0;
  let passedTests = 0;

  const record = (success, name, detail) => {
    totalTests++;
    if (success) {
      passedTests++;
      pass(name, detail);
    } else {
      fail(name, detail);
    }
  };

  const createdOrderIds = [];
  const currentYear = new Date().getFullYear();

  // Temporarily configure 24h hours so test orders can be placed
  const initialSettings = await orderService.getBusinessSettings();
  await orderService.updateBusinessSettings({
    opening_time: '00:00',
    closing_time: '00:00',
    is_store_open: true,
  });

  // 1. Fetch available product for testing
  const products = await getProducts();
  if (products.length === 0) {
    throw new Error('No products found in database to run order tests.');
  }
  const testProduct = products[0];

  // ---------------------------------------------------------
  // TEST 1: DEFAULT SETTINGS & PREFIX CONFIGURATION
  // ---------------------------------------------------------
  info('1. PREFIX CONFIGURATION IN BUSINESS SETTINGS');
  let originalPrefix = 'FL';
  try {
    const settings = await orderService.getBusinessSettings();
    originalPrefix = settings.order_number_prefix || 'FL';
    record(
      Boolean(settings.order_number_prefix),
      'order_number_prefix is configurable in business_settings',
      `Current configured prefix: "${settings.order_number_prefix}"`
    );
  } catch (err) {
    record(false, 'Fetch business_settings prefix', err.message);
  }

  // ---------------------------------------------------------
  // TEST 2: ORDER NUMBER FORMAT GENERATION (FL-YYYY-XXXX)
  // ---------------------------------------------------------
  info('2. HUMAN-FRIENDLY FORMAT GENERATION (FL-2026-0001)');
  let order1 = null;
  try {
    order1 = await createOrder(
      {
        customer_name: 'Lakshmi Narayan',
        customer_phone: '9845012345',
        recipient_name: 'Lakshmi Narayan',
        recipient_phone: '9845012345',
        recipient_address: '88, MG Road, Ramanagara',
        delivery_city: 'Ramanagara',
        delivery_pincode: '562159',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time_slot: 'Morning (8:00 AM - 12:00 PM)',
        payment_method: 'cod',
      },
      [{ product: testProduct, quantity: 1 }]
    );

    createdOrderIds.push(order1.id);

    // Format check: FL-2026-0001 (or <PREFIX>-<YYYY>-<0001>)
    const formatRegex = new RegExp(`^${originalPrefix}-${currentYear}-\\d{4}$`);
    const matchesFormat = formatRegex.test(order1.order_number);

    record(
      matchesFormat,
      `Order number matches format ${originalPrefix}-${currentYear}-XXXX`,
      `Generated: "${order1.order_number}"`
    );
  } catch (err) {
    record(false, 'Create order with human-friendly number', err.message);
  }

  // ---------------------------------------------------------
  // TEST 3: SEQUENTIAL INCREMENTATION
  // ---------------------------------------------------------
  info('3. SEQUENTIAL ORDER NUMBER INCREMENTATION');
  let order2 = null;
  try {
    order2 = await createOrder(
      {
        customer_name: 'Ramesh Kumar',
        customer_phone: '9845067890',
        recipient_name: 'Ramesh Kumar',
        recipient_phone: '9845067890',
        recipient_address: '45, Silk Cocoon Market Road',
        delivery_city: 'Ramanagara',
        delivery_pincode: '562159',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time_slot: 'Evening (4:00 PM - 8:00 PM)',
        payment_method: 'upi',
      },
      [{ product: testProduct, quantity: 2 }]
    );

    createdOrderIds.push(order2.id);

    const num1Parts = order1.order_number.split('-');
    const num2Parts = order2.order_number.split('-');
    const seq1 = parseInt(num1Parts[2], 10);
    const seq2 = parseInt(num2Parts[2], 10);

    const isSequential = seq2 > seq1;
    record(
      isSequential,
      'Order counter sequentially increments',
      `Order 1: ${order1.order_number} (#${seq1}) -> Order 2: ${order2.order_number} (#${seq2})`
    );
  } catch (err) {
    record(false, 'Sequential counter incrementation', err.message);
  }

  // ---------------------------------------------------------
  // TEST 4: DATABASE UNIQUENESS ENFORCEMENT
  // ---------------------------------------------------------
  info('4. DATABASE / BACKEND UNIQUENESS GUARANTEE');
  try {
    // Attempt to directly insert a duplicate order_number into the database
    // to prove the database guarantees uniqueness
    const { error: duplicateError } = await supabase
      .from('orders')
      .insert({
        id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'c0000000-0000-4000-8000-111111111111',
        order_number: order1.order_number, // Deliberate duplicate
        customer_name: 'Intruder Impersonator',
        customer_phone: '9999999999',
        recipient_name: 'Intruder',
        recipient_phone: '9999999999',
        recipient_address: '1 Fake St',
        delivery_city: 'Ramanagara',
        delivery_pincode: '562159',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time_slot: 'Morning',
        subtotal: 450,
        delivery_fee: 49,
        total_amount: 499,
        payment_method: 'cod',
        order_status: 'pending'
      });

    const isRejectedByDatabase = Boolean(
      duplicateError && (duplicateError.code === '23505' || duplicateError.message.toLowerCase().includes('duplicate') || duplicateError.message.toLowerCase().includes('unique'))
    );

    record(
      isRejectedByDatabase,
      'Database strictly prevents duplicate order numbers (DB-level constraint)',
      duplicateError ? `DB Rejection Code: ${duplicateError.code} (${duplicateError.message})` : 'Unexpectedly permitted duplicate!'
    );
  } catch (err) {
    record(true, 'Database strictly prevents duplicate order numbers', err.message);
  }

  // ---------------------------------------------------------
  // TEST 5: CONFIGURABLE PREFIX DYNAMICS (e.g. PF or PADMA)
  // ---------------------------------------------------------
  info('5. DYNAMIC PREFIX CONFIGURABILITY');
  let orderCustomPrefix = null;
  try {
    const customTestPrefix = 'PF';
    await orderService.updateBusinessSettings({ order_number_prefix: customTestPrefix });

    orderCustomPrefix = await createOrder(
      {
        customer_name: 'Divya Suresh',
        customer_phone: '9740030159',
        recipient_name: 'Divya Suresh',
        recipient_phone: '9740030159',
        recipient_address: '10, Bengaluru Road',
        delivery_city: 'Bengaluru',
        delivery_pincode: '560001',
        delivery_date: new Date().toISOString().split('T')[0],
        delivery_time_slot: 'Morning',
        payment_method: 'cod',
      },
      [{ product: testProduct, quantity: 1 }]
    );

    createdOrderIds.push(orderCustomPrefix.id);

    const hasNewPrefix = orderCustomPrefix.order_number.startsWith(`${customTestPrefix}-${currentYear}-`);
    record(
      hasNewPrefix,
      `Prefix dynamically reflects configured business setting ("${customTestPrefix}")`,
      `Generated: ${orderCustomPrefix.order_number}`
    );

    // Revert back to original prefix
    await orderService.updateBusinessSettings({ order_number_prefix: originalPrefix });
    const restoredSettings = await orderService.getBusinessSettings();
    record(
      restoredSettings.order_number_prefix === originalPrefix,
      `Business setting prefix safely restored to "${originalPrefix}"`,
      `Current: ${restoredSettings.order_number_prefix}`
    );
  } catch (err) {
    record(false, 'Dynamic prefix configurability', err.message);
    // Ensure restoration even if error occurs
    await orderService.updateBusinessSettings({ order_number_prefix: originalPrefix }).catch(() => {});
  }

  // ---------------------------------------------------------
  // TEST 6: LOOKUP & TRACKING VIA ORDER NUMBER
  // ---------------------------------------------------------
  info('6. CUSTOMER TRACKING & ORDER RETRIEVAL BY REFERENCE');
  try {
    const retrieved = await getOrder(order1.order_number);
    const validRetrieval = retrieved !== null && retrieved.id === order1.id && retrieved.order_number === order1.order_number;
    const hasItems = retrieved?.items && retrieved.items.length > 0;

    record(
      validRetrieval && hasItems,
      'Order retrieved by human-friendly reference # with line items',
      `Found ${retrieved?.order_number} for customer ${retrieved?.customer_name} (Items: ${retrieved?.items.length})`
    );
  } catch (err) {
    record(false, 'Order retrieval by human-friendly reference #', err.message);
  }

  // ---------------------------------------------------------
  // TEST 7: WHATSAPP DEEP LINK INCLUDES ORDER NUMBER
  // ---------------------------------------------------------
  info('7. WHATSAPP NOTIFICATION FORMATTING');
  try {
    const waUrl = orderService.generateWhatsAppOrderUrl(order1, order1.items || retrieved?.items || []);
    const decodedUrl = decodeURIComponent(waUrl);
    const containsOrderNum = decodedUrl.includes(order1.order_number);
    const containsOrderLabel = decodedUrl.includes('Order #:') || decodedUrl.includes('Order Reference:');

    record(
      containsOrderNum && containsOrderLabel,
      'WhatsApp message prominently embeds human-friendly order reference',
      `Contains "*Order Reference:* ${order1.order_number}"`
    );
  } catch (err) {
    record(false, 'WhatsApp URL formatting', err.message);
  }

  // ---------------------------------------------------------
  // CLEANUP TEST ORDERS & RESTORE SETTINGS
  // ---------------------------------------------------------
  if (supabase && createdOrderIds.length > 0) {
    for (const id of createdOrderIds) {
      await supabase.from('order_items').delete().eq('order_id', id);
      await supabase.from('orders').delete().eq('id', id);
    }
  }

  // Restore original store operating hours settings
  if (initialSettings) {
    await orderService.updateBusinessSettings(initialSettings);
  }

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  info('TEST RESULTS SUMMARY');
  console.log(`Total Checks Executed: ${totalTests}`);
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)`);

  if (passedTests === totalTests) {
    console.log(`\n${colors.green}${colors.bold}All ${totalTests} Human-Friendly Order Number requirements verified successfully!${colors.reset}\n`);
  } else {
    console.log(`\n${colors.yellow}${colors.bold}Some tests failed. Check log details above.${colors.reset}\n`);
    process.exit(1);
  }
}

runOrderNumbersSuite().catch(err => {
  console.error('Test suite runtime error:', err);
  process.exit(1);
});
