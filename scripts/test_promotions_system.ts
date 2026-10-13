import { promotionService } from '../src/services/promotionService';
import { Promotion } from '../src/types';

async function runPromotionsVerification() {
  console.log('===============================================================');
  console.log('PADMA\'S FLORAL — PROMOTIONS & MARKETING SYSTEM VERIFICATION');
  console.log('===============================================================\n');

  // TEST 1: Initial Seed Promotions
  console.log('[Test 1] Verifying Active Promotions Retrieval & Seed Items...');
  const activePromos = await promotionService.getActivePromotions();
  console.log(`Found ${activePromos.length} active promotions on storefront.`);
  
  const expectedTitles = [
    'Festival Flowers',
    'Weekend Special',
    'Wedding Season',
    'Pooja Collection'
  ];

  for (const expected of expectedTitles) {
    const found = activePromos.find(p => p.title.toLowerCase().includes(expected.toLowerCase()));
    if (!found) {
      throw new Error(`Test 1 Failed: Expected seed promotion "${expected}" was not found in active promotions.`);
    }
    console.log(`  ✓ Found "${found.title}" (Discount Type: ${found.discount_type}, Value: ${found.discount_value})`);
  }
  console.log('✓ Test 1 Passed: All 4 canonical promotion examples are loaded.\n');

  // TEST 2: "Do not automatically invent discounts" Rule
  console.log('[Test 2] Verifying "Do not automatically invent discounts" Rule...');
  const poojaPromo = activePromos.find(p => p.title.includes('Pooja Collection'));
  if (!poojaPromo) {
    throw new Error('Test 2 Failed: Pooja Collection not found.');
  }
  
  if (poojaPromo.discount_type !== 'none' || poojaPromo.discount_value !== 0) {
    throw new Error(`Test 2 Failed: Pooja Collection must have discount_type 'none' and value 0, got type "${poojaPromo.discount_type}" and value ${poojaPromo.discount_value}`);
  }

  const poojaBadge = promotionService.getDiscountBadgeText(poojaPromo);
  console.log(`  Pooja Collection badge text: ${poojaBadge === null ? 'null (No fake discount)' : poojaBadge}`);
  if (poojaBadge !== null) {
    throw new Error(`Test 2 Failed: Pooja Collection must return null badge text, but got "${poojaBadge}". A fake discount was invented!`);
  }

  const festivalPromo = activePromos.find(p => p.title.includes('Festival Flowers'))!;
  const festivalBadge = promotionService.getDiscountBadgeText(festivalPromo);
  console.log(`  Festival Flowers badge text: "${festivalBadge}"`);
  if (festivalBadge !== '10% OFF') {
    throw new Error(`Test 2 Failed: Festival Flowers badge expected "10% OFF", got "${festivalBadge}"`);
  }

  const weekendPromo = activePromos.find(p => p.title.includes('Weekend Special'))!;
  const weekendBadge = promotionService.getDiscountBadgeText(weekendPromo);
  console.log(`  Weekend Special badge text: "${weekendBadge}"`);
  if (weekendBadge !== '₹100 OFF') {
    throw new Error(`Test 2 Failed: Weekend Special badge expected "₹100 OFF", got "${weekendBadge}"`);
  }

  const weddingPromo = activePromos.find(p => p.title.includes('Wedding Season'))!;
  const weddingBadge = promotionService.getDiscountBadgeText(weddingPromo);
  console.log(`  Wedding Season badge text: "${weddingBadge}"`);
  if (weddingBadge !== 'Free Delivery') {
    throw new Error(`Test 2 Failed: Wedding Season badge expected "Free Delivery", got "${weddingBadge}"`);
  }
  console.log('✓ Test 2 Passed: Zero fake discounts invented; real discounts formatted correctly.\n');

  // TEST 3: Database-Authoritative Active Status Rule
  console.log('[Test 3] Verifying Database Active Status Determination...');
  // Rule: is_active = true AND start_date <= now AND (end_date IS NULL OR end_date >= now)

  const now = new Date();
  
  // 3a. Future start date
  const futurePromo: Promotion = {
    id: 'test-future',
    title: 'Future Diwali Grand Sale',
    discount_type: 'percentage',
    discount_value: 15,
    start_date: new Date(now.getTime() + 7 * 86400000).toISOString(), // 7 days in future
    end_date: new Date(now.getTime() + 14 * 86400000).toISOString(),
    is_active: true,
  };
  const isFutureActive = promotionService.isPromotionActive(futurePromo);
  console.log(`  Future start date promotion active: ${isFutureActive} (Expected: false)`);
  if (isFutureActive) {
    throw new Error('Test 3 Failed: Promotion with future start date was evaluated as active.');
  }

  // 3b. Past end date
  const pastPromo: Promotion = {
    id: 'test-past',
    title: 'Past Ugadi Special',
    discount_type: 'fixed_amount',
    discount_value: 50,
    start_date: new Date(now.getTime() - 14 * 86400000).toISOString(),
    end_date: new Date(now.getTime() - 2 * 86400000).toISOString(), // ended 2 days ago
    is_active: true,
  };
  const isPastActive = promotionService.isPromotionActive(pastPromo);
  console.log(`  Past end date promotion active: ${isPastActive} (Expected: false)`);
  if (isPastActive) {
    throw new Error('Test 3 Failed: Promotion with past end date was evaluated as active.');
  }

  // 3c. Inactive toggle (is_active = false)
  const pausedPromo: Promotion = {
    id: 'test-paused',
    title: 'Temporarily Paused Offer',
    discount_type: 'percentage',
    discount_value: 20,
    start_date: new Date(now.getTime() - 2 * 86400000).toISOString(),
    end_date: new Date(now.getTime() + 5 * 86400000).toISOString(),
    is_active: false, // Paused by admin
  };
  const isPausedActive = promotionService.isPromotionActive(pausedPromo);
  console.log(`  Paused promotion (is_active = false) active: ${isPausedActive} (Expected: false)`);
  if (isPausedActive) {
    throw new Error('Test 3 Failed: Promotion with is_active = false was evaluated as active.');
  }

  // 3d. Active promo with no expiry (ongoing)
  const ongoingPromo: Promotion = {
    id: 'test-ongoing',
    title: 'Year-Round Temple Garland Service',
    discount_type: 'none',
    discount_value: 0,
    start_date: new Date(now.getTime() - 30 * 86400000).toISOString(),
    end_date: null, // No expiry
    is_active: true,
  };
  const isOngoingActive = promotionService.isPromotionActive(ongoingPromo);
  console.log(`  Ongoing promotion (end_date = null) active: ${isOngoingActive} (Expected: true)`);
  if (!isOngoingActive) {
    throw new Error('Test 3 Failed: Ongoing promotion with null end_date was evaluated as inactive.');
  }
  console.log('✓ Test 3 Passed: Database active status evaluation matches strict date/status rules.\n');

  // TEST 4: Extensible Coupon Code Validation
  console.log('[Test 4] Verifying Coupon Code Extensibility & Qualification...');
  
  // 4a. Valid FESTIVAL10 on subtotal 600 (min 499)
  const festivalResult = await promotionService.validateCouponCode('FESTIVAL10', 600);
  console.log(`  Validating 'FESTIVAL10' on ₹600: valid=${festivalResult.valid}, discount=₹${festivalResult.discount_amount}`);
  if (!festivalResult.valid || festivalResult.discount_amount !== 60) {
    throw new Error(`Test 4 Failed: Expected FESTIVAL10 on ₹600 to yield ₹60 discount, got ${festivalResult.discount_amount}`);
  }

  // 4b. FESTIVAL10 on subtotal 300 (below min 499)
  const festivalUnderMin = await promotionService.validateCouponCode('FESTIVAL10', 300);
  console.log(`  Validating 'FESTIVAL10' on ₹300 (under min): valid=${festivalUnderMin.valid}, msg="${festivalUnderMin.message}"`);
  if (festivalUnderMin.valid) {
    throw new Error('Test 4 Failed: Expected FESTIVAL10 under min order amount to be rejected.');
  }

  // 4c. Valid WEEKEND100 on subtotal 900 (min 799)
  const weekendResult = await promotionService.validateCouponCode('WEEKEND100', 900);
  console.log(`  Validating 'WEEKEND100' on ₹900: valid=${weekendResult.valid}, discount=₹${weekendResult.discount_amount}`);
  if (!weekendResult.valid || weekendResult.discount_amount !== 100) {
    throw new Error(`Test 4 Failed: Expected WEEKEND100 on ₹900 to yield ₹100 discount, got ${weekendResult.discount_amount}`);
  }

  // 4d. Invalid code
  const invalidResult = await promotionService.validateCouponCode('NONEXISTENT_CODE', 1000);
  console.log(`  Validating non-existent code: valid=${invalidResult.valid}`);
  if (invalidResult.valid) {
    throw new Error('Test 4 Failed: Invalid code was accepted.');
  }
  console.log('✓ Test 4 Passed: Coupon code validation and qualification checks succeed.\n');

  // TEST 5: Admin CRUD Operations
  console.log('[Test 5] Verifying Admin Promotion Lifecycle (Create, Read, Update, Toggle, Delete)...');
  
  // 5a. Create new promotion
  const created = await promotionService.savePromotion({
    title: 'Gowri Ganesha Early Bird',
    description: 'Special early reservation discount on Sevanti and Jasmine garlands for Ganesha Chathurthi.',
    banner_image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31',
    discount_type: 'percentage',
    discount_value: 12,
    start_date: new Date(now.getTime() - 1 * 86400000).toISOString(),
    end_date: new Date(now.getTime() + 10 * 86400000).toISOString(),
    is_active: true,
    code: 'GANESHA12',
    min_order_amount: 550,
  });
  console.log(`  Created promotion: "${created.title}" with ID ${created.id}`);
  if (!created.id || created.title !== 'Gowri Ganesha Early Bird') {
    throw new Error('Test 5 Failed: Could not create promotion.');
  }

  // 5b. Read back in active list
  let activeAfterCreate = await promotionService.getActivePromotions();
  let foundInActive = activeAfterCreate.find(p => p.id === created.id);
  if (!foundInActive) {
    throw new Error('Test 5 Failed: Created promotion was not found in getActivePromotions().');
  }
  console.log(`  ✓ Verified created promotion appears in active storefront list.`);

  // 5c. Update fields
  const updated = await promotionService.savePromotion({
    id: created.id,
    title: 'Gowri Ganesha Grand Festival Offer',
    discount_value: 15,
  });
  console.log(`  Updated promotion title to "${updated.title}" with discount ${updated.discount_value}%`);
  if (updated.title !== 'Gowri Ganesha Grand Festival Offer' || updated.discount_value !== 15) {
    throw new Error('Test 5 Failed: Promotion update did not reflect new values.');
  }

  // 5d. Toggle inactive (Pause campaign)
  await promotionService.toggleActive(created.id, false);
  let activeAfterPause = await promotionService.getActivePromotions();
  let foundInActiveAfterPause = activeAfterPause.find(p => p.id === created.id);
  console.log(`  Toggled is_active = false. Found in active promotions: ${Boolean(foundInActiveAfterPause)} (Expected: false)`);
  if (foundInActiveAfterPause) {
    throw new Error('Test 5 Failed: Paused promotion is still showing in active promotions!');
  }

  // 5e. Toggle active again
  await promotionService.toggleActive(created.id, true);
  let activeAfterResume = await promotionService.getActivePromotions();
  let foundInActiveAfterResume = activeAfterResume.find(p => p.id === created.id);
  console.log(`  Toggled is_active = true. Found in active promotions: ${Boolean(foundInActiveAfterResume)} (Expected: true)`);
  if (!foundInActiveAfterResume) {
    throw new Error('Test 5 Failed: Resumed promotion did not return to active promotions!');
  }

  // 5f. Delete promotion
  await promotionService.deletePromotion(created.id);
  let allAdminAfterDelete = await promotionService.getAllPromotionsAdmin();
  let foundInAdminAfterDelete = allAdminAfterDelete.find(p => p.id === created.id);
  console.log(`  Deleted promotion. Still in admin list: ${Boolean(foundInAdminAfterDelete)} (Expected: false)`);
  if (foundInAdminAfterDelete) {
    throw new Error('Test 5 Failed: Deleted promotion was not removed from admin list.');
  }
  console.log('✓ Test 5 Passed: Full Admin CRUD lifecycle verified successfully.\n');

  console.log('===============================================================');
  console.log('🎉 ALL 5 PROMOTION SYSTEM SUITE TESTS PASSED WITH ZERO ERRORS!');
  console.log('===============================================================');
}

runPromotionsVerification().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
