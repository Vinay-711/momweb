/**
 * test_ui_states.ts
 *
 * Automated verification test suite for UI states:
 * 1. Loading (Skeleton loaders)
 * 2. Empty (Cart: "Your flower basket is waiting.")
 * 3. No search results / No products ("No flowers found.")
 * 4. Error ("Something went wrong. Please try again." + database error leakage prevention)
 * 5. Offline (OfflineState + network check)
 * 6. Out of stock ("Currently unavailable.")
 * 7. Business closed ("Currently Closed" + "We're currently closed. Please check our opening hours.")
 */

import fs from 'fs';
import path from 'path';
import { sanitizeErrorMessage } from '../src/utils/errorUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

console.log('\n--- 1. Testing Error Sanitization (Zero Raw DB Errors) ---');

// Test database errors getting sanitized
const dbError1 = 'PGRST116: JSON object requested, multiple (or no) rows returned';
assert(
  sanitizeErrorMessage(dbError1) === 'Something went wrong. Please try again.',
  'PGRST error code sanitized to fallback'
);

const dbError2 = new Error('relation "public.products" does not exist; SQLSTATE 42P01');
assert(
  sanitizeErrorMessage(dbError2) === 'Something went wrong. Please try again.',
  'PostgreSQL relation and SQLSTATE error sanitized'
);

const dbError3 = { message: 'violates row-level security policy for table "orders"' };
assert(
  sanitizeErrorMessage(dbError3) === 'Something went wrong. Please try again.',
  'Row-level security policy violation error sanitized'
);

const dbError4 = 'Failed to fetch from https://xyz.supabase.co/rest/v1/orders - network timeout';
assert(
  sanitizeErrorMessage(dbError4).includes('Network connection error'),
  'Supabase domain and network error sanitized to friendly network message'
);

const stockError = 'violates check constraint on stock_quantity';
assert(
  sanitizeErrorMessage(stockError).includes('out of stock'),
  'Database stock constraint violation converted to friendly stock message'
);

// Test safe customer validation errors not being masked
const safeValidation = 'Please enter a valid 10-digit mobile number';
assert(
  sanitizeErrorMessage(safeValidation) === safeValidation,
  'Safe customer validation message preserved untouched'
);

console.log('\n--- 2. Auditing Static Codebase for Exact State Texts ---');

const srcDir = path.resolve(process.cwd(), 'src');

function readFile(relPath: string): string {
  return fs.readFileSync(path.join(srcDir, relPath), 'utf-8');
}

// 2.1 Empty Cart Wording
const cartPage = readFile('pages/CartPage.tsx');
const cartDrawer = readFile('components/layout/CartDrawer.tsx');
const checkoutPage = readFile('pages/CheckoutPage.tsx');

assert(
  cartPage.includes('Your flower basket is waiting.'),
  'CartPage displays "Your flower basket is waiting."'
);
assert(
  cartDrawer.includes('Your flower basket is waiting.'),
  'CartDrawer displays "Your flower basket is waiting."'
);
assert(
  checkoutPage.includes('Your flower basket is waiting.'),
  'CheckoutPage displays "Your flower basket is waiting." on empty cart'
);

// 2.2 No products / Zero search results
const catalogPage = readFile('pages/CatalogPage.tsx');
assert(
  catalogPage.includes('title="No flowers found."'),
  'CatalogPage displays "No flowers found."'
);

// 2.3 Error State Wording
const errorState = readFile('components/ui/ErrorState.tsx');
const errorBoundary = readFile('components/ui/ErrorBoundary.tsx');
assert(
  errorState.includes('Something went wrong. Please try again.'),
  'ErrorState defaults to "Something went wrong. Please try again."'
);
assert(
  errorBoundary.includes('Something went wrong. Please try again.'),
  'ErrorBoundary defaults to "Something went wrong. Please try again."'
);

// 2.4 Out of Stock Wording
const productCard = readFile('components/ui/ProductCard.tsx');
const pdp = readFile('pages/ProductDetailPage.tsx');

assert(
  productCard.includes('Currently unavailable'),
  'ProductCard displays "Currently unavailable" on out of stock button & badge'
);
assert(
  pdp.includes('Currently unavailable'),
  'ProductDetailPage displays "Currently unavailable" when item is out of stock'
);
assert(
  cartPage.includes('Currently unavailable'),
  'CartPage alerts "Currently unavailable" on out of stock items'
);
assert(
  cartDrawer.includes('Currently unavailable'),
  'CartDrawer alerts "Currently unavailable" on out of stock items'
);

// 2.5 Business Closed Wording
assert(
  productCard.includes('Currently Closed'),
  'ProductCard button displays "Currently Closed" when business is closed'
);
assert(
  pdp.includes('Currently Closed'),
  'ProductDetailPage button displays "Currently Closed" when business is closed'
);
assert(
  productCard.includes("We're currently closed. Please check our opening hours."),
  'ProductCard explains "We\'re currently closed. Please check our opening hours."'
);
assert(
  pdp.includes("We're currently closed. Please check our opening hours."),
  'ProductDetailPage explains "We\'re currently closed. Please check our opening hours."'
);

// 2.6 Loading Skeletons
const skeletonFile = readFile('components/ui/Skeleton.tsx');
assert(
  skeletonFile.includes('export const ProductCardSkeleton') &&
  skeletonFile.includes('export const ProductGridSkeleton') &&
  skeletonFile.includes('export const ProductDetailSkeleton') &&
  skeletonFile.includes('export const OrderTrackingSkeleton') &&
  skeletonFile.includes('export const TableRowSkeleton') &&
  skeletonFile.includes('export const MetricCardSkeleton') &&
  skeletonFile.includes('export const CardSkeleton') &&
  skeletonFile.includes('export const CategoryPillSkeleton'),
  'All 8 skeleton loader components defined in Skeleton.tsx'
);

// 2.7 Offline State
const offlineState = readFile('components/ui/OfflineState.tsx');
assert(
  offlineState.includes('Check Connection') &&
  offlineState.includes('placing orders and live delivery tracking require an active internet connection'),
  'OfflineState explains order/tracking restriction and provides Check Connection CTA'
);

// 2.8 App Error Boundary
const appFile = readFile('App.tsx');
assert(
  appFile.includes('<ErrorBoundary>') && appFile.includes('</ErrorBoundary>'),
  'App.tsx is wrapped with root ErrorBoundary'
);

console.log('\n--- Summary ---');
console.log(`Total Passed: ${passed}`);
console.log(`Total Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('🎉 All UI state specifications verified successfully!\n');
  process.exit(0);
}
