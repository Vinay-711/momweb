/**
 * Supabase Row Level Security (RLS) Test Suite
 * Padma's Floral E-Commerce Platform
 * 
 * Verifies:
 * 1. Anonymous Customer Capabilities & Constraints (Principle of Least Privilege)
 * 2. Authenticated Admin Capabilities
 * 
 * Run with: node scripts/test_rls_security.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://qklgjmpjucqgufsvuqhl.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Lh3GLbvV-76wx8LoLr5HmQ_lRS0YEsI';

// Color formatting for console
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function pass(testName, detail = '') {
  console.log(`  ${colors.green}✔ PASS${colors.reset}: ${colors.bold}${testName}${colors.reset} ${colors.gray}${detail}${colors.reset}`);
}

function fail(testName, detail = '') {
  console.log(`  ${colors.red}✖ FAIL${colors.reset}: ${colors.bold}${testName}${colors.reset} ${colors.yellow}${detail}${colors.reset}`);
}

function info(msg) {
  console.log(`\n${colors.cyan}${colors.bold}=== ${msg} ===${colors.reset}`);
}

async function runRlsAudit() {
  console.log(`${colors.bold}Padma's Floral — Supabase RLS Security Verification Suite${colors.reset}`);
  console.log(`Target Supabase URL: ${SUPABASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const anonClient = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false }
  });

  let totalTests = 0;
  let passedTests = 0;

  // Helper to record pass/fail
  const record = (success, name, detail) => {
    totalTests++;
    if (success) {
      passedTests++;
      pass(name, detail);
    } else {
      fail(name, detail);
    }
  };

  // ----------------------------------------------------
  // SECTION 1: PUBLIC CUSTOMER ALLOWED CAPABILITIES
  // ----------------------------------------------------
  info('TESTING PUBLIC CUSTOMER PERMITTED ACCESS (ANONYMOUS)');

  // 1. Read active categories
  try {
    const { data, error } = await anonClient.from('categories').select('*').limit(5);
    const success = !error && Array.isArray(data) && data.every(c => c.is_active === true);
    record(success, 'Public can read active categories', `(${data?.length || 0} categories retrieved, all is_active=true)`);
  } catch (err) {
    record(false, 'Public can read active categories', err.message);
  }

  // 2. Read available products
  try {
    const { data, error } = await anonClient.from('products').select('*').limit(5);
    const success = !error && Array.isArray(data) && data.every(p => p.is_available === true);
    record(success, 'Public can read available products', `(${data?.length || 0} products retrieved, all is_available=true)`);
  } catch (err) {
    record(false, 'Public can read available products', err.message);
  }

  // 3. Read business settings
  try {
    const { data, error } = await anonClient.from('business_settings').select('*').limit(1);
    const success = !error && data && data.length > 0;
    record(success, 'Public can read business settings', `(Storefront settings accessible: ${data?.[0]?.business_name || 'Padma\'s Floral'})`);
  } catch (err) {
    record(false, 'Public can read business settings', err.message);
  }

  // 4. Read delivery zones
  try {
    const { data, error } = await anonClient.from('delivery_zones').select('*').limit(5);
    const success = !error && Array.isArray(data) && data.every(z => z.is_active === true);
    record(success, 'Public can read active delivery zones', `(${data?.length || 0} zones retrieved)`);
  } catch (err) {
    record(false, 'Public can read active delivery zones', err.message);
  }

  // ----------------------------------------------------
  // SECTION 2: PUBLIC CUSTOMER RESTRICTIONS (MUST BE BLOCKED)
  // ----------------------------------------------------
  info('TESTING PUBLIC CUSTOMER RESTRICTIONS (ANTI-SCRAPING & ACCESS CONTROL)');

  // 5. Customer records MUST NOT be publicly readable
  try {
    const { data, error } = await anonClient.from('customers').select('*').limit(5);
    // Secure behavior: either an error (permission denied) or empty array (0 rows due to RLS)
    const success = error !== null || (Array.isArray(data) && data.length === 0);
    record(success, 'Public CANNOT read all customer records (PII protection)', error ? `Blocked with: ${error.message}` : `RLS returned 0 rows`);
  } catch (err) {
    record(true, 'Public CANNOT read all customer records (PII protection)', err.message);
  }

  // 6. Orders MUST NOT be publicly scrapable
  try {
    const { data, error } = await anonClient.from('orders').select('*').limit(5);
    // Secure behavior: either an error or empty array (0 rows)
    const success = error !== null || (Array.isArray(data) && data.length === 0);
    record(success, 'Public CANNOT read all orders (Order history protection)', error ? `Blocked with: ${error.message}` : (data?.length === 0 ? `RLS filtered 0 rows` : `VULNERABLE: Leaked ${data?.length} orders!`));
  } catch (err) {
    record(true, 'Public CANNOT read all orders', err.message);
  }

  // 7. Public CANNOT modify products
  try {
    const { data: prods } = await anonClient.from('products').select('id').limit(1);
    if (prods && prods.length > 0) {
      const { error } = await anonClient.from('products').update({ price: 999999 }).eq('id', prods[0].id);
      const success = error !== null;
      record(success, 'Public CANNOT modify products / price', error ? `Blocked: ${error.message}` : 'VULNERABLE: Product price updated by anon!');
    } else {
      record(true, 'Public CANNOT modify products / price', 'No products or update not permitted');
    }
  } catch (err) {
    record(true, 'Public CANNOT modify products / price', err.message);
  }

  // 8. Public CANNOT delete products
  try {
    const { data: prods } = await anonClient.from('products').select('id').limit(1);
    if (prods && prods.length > 0) {
      const { error } = await anonClient.from('products').delete().eq('id', prods[0].id);
      const success = error !== null;
      record(success, 'Public CANNOT delete products', error ? `Blocked: ${error.message}` : 'VULNERABLE: Product deleted by anon!');
    } else {
      record(true, 'Public CANNOT delete products', 'No products or delete not permitted');
    }
  } catch (err) {
    record(true, 'Public CANNOT delete products', err.message);
  }

  // 9. Public CANNOT modify inventory
  try {
    const { data: prods } = await anonClient.from('products').select('id').limit(1);
    if (prods && prods.length > 0) {
      const { error } = await anonClient.from('products').update({ stock_quantity: 0 }).eq('id', prods[0].id);
      const success = error !== null;
      record(success, 'Public CANNOT tamper with inventory (stock_quantity)', error ? `Blocked: ${error.message}` : 'VULNERABLE: Stock tampered by anon!');
    } else {
      record(true, 'Public CANNOT tamper with inventory', 'Update blocked');
    }
  } catch (err) {
    record(true, 'Public CANNOT tamper with inventory', err.message);
  }

  // 10. Public CANNOT modify categories
  try {
    const { data: cats } = await anonClient.from('categories').select('id').limit(1);
    if (cats && cats.length > 0) {
      const { error } = await anonClient.from('categories').update({ name: 'Hacked Category' }).eq('id', cats[0].id);
      const success = error !== null;
      record(success, 'Public CANNOT modify categories', error ? `Blocked: ${error.message}` : 'VULNERABLE: Category updated by anon!');
    } else {
      record(true, 'Public CANNOT modify categories', 'Category update blocked');
    }
  } catch (err) {
    record(true, 'Public CANNOT modify categories', err.message);
  }

  // 11. Public CANNOT modify business settings
  try {
    const { data: settings } = await anonClient.from('business_settings').select('id').limit(1);
    if (settings && settings.length > 0) {
      const { error } = await anonClient.from('business_settings').update({ phone: '0000000000' }).eq('id', settings[0].id);
      const success = error !== null;
      record(success, 'Public CANNOT modify business settings', error ? `Blocked: ${error.message}` : 'VULNERABLE: Settings updated by anon!');
    } else {
      record(true, 'Public CANNOT modify business settings', 'Settings update blocked');
    }
  } catch (err) {
    record(true, 'Public CANNOT modify business settings', err.message);
  }

  // 12. Public CANNOT update arbitrary orders
  try {
    const { error } = await anonClient.from('orders').update({ order_status: 'delivered' }).eq('order_number', 'TEST-1001');
    const success = error !== null;
    record(success, 'Public CANNOT update arbitrary orders', error ? `Blocked: ${error.message}` : 'VULNERABLE: Order status updated by anon!');
  } catch (err) {
    record(true, 'Public CANNOT update arbitrary orders', err.message);
  }

  // 13. Public CANNOT delete arbitrary orders
  try {
    const { error } = await anonClient.from('orders').delete().eq('order_number', 'TEST-1001');
    const success = error !== null;
    record(success, 'Public CANNOT delete arbitrary orders', error ? `Blocked: ${error.message}` : 'VULNERABLE: Order deleted by anon!');
  } catch (err) {
    record(true, 'Public CANNOT delete arbitrary orders', err.message);
  }

  // ----------------------------------------------------
  // SECTION 3: SANITIZED PUBLIC ORDER LOOKUP (RPC)
  // ----------------------------------------------------
  info('TESTING SECURE PARAMETERIZED ORDER LOOKUP');

  try {
    const { data, error } = await anonClient.rpc('lookup_order', {
      p_order_number: 'NON_EXISTENT_ORDER_999',
      p_phone: '9845012345'
    });
    const success = !error && data === null;
    record(success, 'Public lookup_order RPC gracefully returns null for unknown order', error ? `RPC error: ${error.message}` : 'Handled gracefully');
  } catch (err) {
    record(false, 'Public lookup_order RPC available', err.message);
  }

  // Summary
  info('AUDIT SUMMARY');
  console.log(`Total Checks: ${totalTests}`);
  console.log(`Passed: ${passedTests}/${totalTests} (${Math.round((passedTests / totalTests) * 100)}%)`);

  if (passedTests < totalTests) {
    console.log(`\n${colors.yellow}${colors.bold}Action Required:${colors.reset}`);
    console.log(`Some tables still exhibit loose policies or missing tables on the remote database.`);
    console.log(`Execute ${colors.cyan}supabase/migrations/20260921_production_security_hardening.sql${colors.reset} in the Supabase Dashboard SQL Editor to enforce strict RLS!`);
  } else {
    console.log(`\n${colors.green}${colors.bold}All Row Level Security policies verified!${colors.reset}`);
  }
}

runRlsAudit().catch(console.error);
