import { orderService } from '../src/services/orderService';
import { INITIAL_BUSINESS_SETTINGS, INITIAL_PRODUCTS } from '../src/data/seedData';

async function testOrderRejection() {
  console.log('Testing createOrder closed rejection...');
  
  // Set business settings to closed (06:00 to 21:00 while time is 01:45 AM or is_store_open: false)
  await orderService.updateBusinessSettings({
    ...INITIAL_BUSINESS_SETTINGS,
    is_store_open: false,
    closed_notice: "We're currently closed. Please check our opening hours.",
  });

  const cartItem = {
    id: 'item-1',
    product: INITIAL_PRODUCTS[0],
    quantity: 1,
  };

  try {
    await orderService.createOrder(
      {
        customer_name: 'Test Customer',
        customer_phone: '9876543210',
        recipient_name: 'Test Customer',
        recipient_phone: '9876543210',
        recipient_address: '123 Test St, Ramanagara',
        delivery_city: 'Ramanagara',
        delivery_pincode: '562159',
        delivery_date: '2026-09-25',
        delivery_time_slot: 'Morning (8:00 AM - 12:00 PM)',
        payment_method: 'cod',
      },
      [cartItem]
    );
    console.error('❌ Error: Order creation should have thrown an error when closed!');
    process.exit(1);
  } catch (err: any) {
    console.log(`✅ Order was properly rejected with message: "${err.message}"`);
    if (err.message.includes("We're currently closed. Please check our opening hours.")) {
      console.log('✅ Explanation message matches exactly!');
    } else {
      console.error(`❌ Unexpected error message: ${err.message}`);
      process.exit(1);
    }
  }

  // Restore store settings to open
  await orderService.updateBusinessSettings({
    ...INITIAL_BUSINESS_SETTINGS,
    is_store_open: true,
  });
  console.log('✅ Restored store settings to open');
}

testOrderRejection().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
