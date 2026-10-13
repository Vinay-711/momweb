import { orderService } from '../src/services/orderService';

async function runTests() {
  console.log('--- Testing Order Tracking Dual-Factor Verification ---');

  // Test 1: Valid Order Number + Matching Customer Phone
  console.log('\n[Test 1] Valid Order (PF-2609-01) + Matching Customer Phone (9845012345)');
  const res1 = await orderService.trackOrder('PF-2609-01', '9845012345');
  console.log('Result:', res1 ? `Found order: ${res1.order_number}, Customer: ${res1.customer_name}` : 'FAILED (null)');
  if (!res1 || res1.order_number !== 'PF-2609-01') {
    throw new Error('Test 1 failed: Expected order to be found');
  }

  // Test 2: Valid Order Number + Formatted Phone (+91 98450 12345)
  console.log('\n[Test 2] Valid Order (PF-2609-01) + Formatted Phone (+91 98450 12345)');
  const res2 = await orderService.trackOrder('PF-2609-01', '+91 98450 12345');
  console.log('Result:', res2 ? `Found order: ${res2.order_number}` : 'FAILED (null)');
  if (!res2 || res2.order_number !== 'PF-2609-01') {
    throw new Error('Test 2 failed: Expected order with formatted phone to be found');
  }

  // Test 3: Valid Order Number + WRONG Phone Number (9111111111) -> Must return null!
  console.log('\n[Test 3] Valid Order (PF-2609-01) + WRONG Phone (9111111111)');
  const res3 = await orderService.trackOrder('PF-2609-01', '9111111111');
  console.log('Result:', res3 === null ? 'PASSED: Order access denied (null)' : `FAILED: Order exposed! ${res3}`);
  if (res3 !== null) {
    throw new Error('Test 3 failed: Order was exposed with wrong phone number!');
  }

  // Test 4: Valid Order Number + Incomplete Phone Number (12345) -> Must return null!
  console.log('\n[Test 4] Valid Order (PF-2609-01) + Incomplete Phone (12345)');
  const res4 = await orderService.trackOrder('PF-2609-01', '12345');
  console.log('Result:', res4 === null ? 'PASSED: Incomplete phone rejected (null)' : 'FAILED: Exposed');
  if (res4 !== null) {
    throw new Error('Test 4 failed: Incomplete phone was accepted!');
  }

  // Test 5: Empty Order Number -> Must return null!
  console.log('\n[Test 5] Empty Order Number + Valid Phone');
  const res5 = await orderService.trackOrder('', '9845012345');
  console.log('Result:', res5 === null ? 'PASSED: Empty order rejected (null)' : 'FAILED: Exposed');
  if (res5 !== null) {
    throw new Error('Test 5 failed: Empty order number was accepted!');
  }

  // Test 6: Matching Recipient Phone (Order PF-2609-02 has recipient_phone 9740030159)
  console.log('\n[Test 6] Valid Order (PF-2609-02) + Matching Recipient Phone (9740030159)');
  const res6 = await orderService.trackOrder('PF-2609-02', '9740030159');
  console.log('Result:', res6 ? `Found order: ${res6.order_number}, Recipient: ${res6.recipient_name}` : 'FAILED (null)');
  if (!res6 || res6.order_number !== 'PF-2609-02') {
    throw new Error('Test 6 failed: Recipient phone lookup failed');
  }

  console.log('\n ALL 6 SECURITY & VERIFICATION TESTS PASSED SUCCESSFULLY!');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
