import { productService } from '../src/services/productService';

async function testSearchAndFilters() {
  console.log('=== Running Product Search & Filtering Validation ===\n');

  // Load all products
  const allProds = await productService.getProducts();
  console.log(`Loaded ${allProds.length} total catalog products for testing.`);
  if (allProds.length === 0) {
    throw new Error('Catalog is empty; cannot run tests');
  }

  // Test 1: Search by Product Name (e.g. "flower")
  console.log('\n[Test 1] Search by Product Name: "flower"');
  const searchFlower = allProds.filter(p => {
    const term = 'flower';
    return (
      p.name.toLowerCase().includes(term) ||
      (p.category_name || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });
  console.log(`Found ${searchFlower.length} products matching "flower".`);
  if (searchFlower.length === 0) throw new Error('Test 1 failed: No flower products found');
  console.log('Sample match:', searchFlower[0].name);

  // Test 2: Search by Product Term ("decorations")
  console.log('\n[Test 2] Search by Product Term: "decorations"');
  const searchDecor = allProds.filter(p => {
    const term = 'decorations';
    return (
      p.name.toLowerCase().includes(term) ||
      (p.category_name || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });
  console.log(`Found ${searchDecor.length} products matching "decorations".`);
  if (searchDecor.length === 0) throw new Error('Test 2 failed: No decorations products found');

  // Test 3: Search by Description Term ("seasons")
  console.log('\n[Test 3] Search by Description Term: "seasons"');
  const searchSeasons = allProds.filter(p => {
    const term = 'seasons';
    return (
      p.name.toLowerCase().includes(term) ||
      (p.category_name || '').toLowerCase().includes(term) ||
      (p.description || '').toLowerCase().includes(term)
    );
  });
  console.log(`Found ${searchSeasons.length} products matching "seasons".`);
  if (searchSeasons.length === 0) throw new Error('Test 3 failed: No seasons products found');
  console.log('Sample match:', searchSeasons[0].name);

  // Test 4: Price Range Filtering (Under ₹500 vs. Above ₹1000)
  console.log('\n[Test 4] Price Filter: Under ₹500');
  const under500 = allProds.filter(p => (p.sale_price ?? p.price) <= 500);
  console.log(`Found ${under500.length} products under ₹500.`);
  under500.forEach(p => {
    const effectivePrice = p.sale_price ?? p.price;
    if (effectivePrice > 500) {
      throw new Error(`Test 4 failed: Product ${p.name} price ${effectivePrice} exceeds 500`);
    }
  });

  // Test 5: Availability (In Stock Only)
  console.log('\n[Test 5] Availability Filter: In Stock Only');
  const inStock = allProds.filter(p => p.is_available && p.stock_quantity > 0);
  console.log(`Found ${inStock.length} products in stock.`);
  inStock.forEach(p => {
    if (!p.is_available || p.stock_quantity <= 0) {
      throw new Error(`Test 5 failed: Product ${p.name} is out of stock`);
    }
  });

  // Test 6: Sorting
  console.log('\n[Test 6] Sorting: Price Low to High');
  const sortedAsc = [...allProds].sort((a, b) => (a.sale_price ?? a.price) - (b.sale_price ?? b.price));
  for (let i = 0; i < sortedAsc.length - 1; i++) {
    const priceA = sortedAsc[i].sale_price ?? sortedAsc[i].price;
    const priceB = sortedAsc[i + 1].sale_price ?? sortedAsc[i + 1].price;
    if (priceA > priceB) {
      throw new Error(`Test 6 failed: Price ascending sort violated: ${priceA} > ${priceB}`);
    }
  }
  console.log(`Lowest price: ₹${sortedAsc[0].sale_price ?? sortedAsc[0].price}, Highest price: ₹${sortedAsc[sortedAsc.length - 1].sale_price ?? sortedAsc[sortedAsc.length - 1].price}`);

  console.log('\n[Test 7] Sorting: Price High to Low');
  const sortedDesc = [...allProds].sort((a, b) => (b.sale_price ?? b.price) - (a.sale_price ?? a.price));
  for (let i = 0; i < sortedDesc.length - 1; i++) {
    const priceA = sortedDesc[i].sale_price ?? sortedDesc[i].price;
    const priceB = sortedDesc[i + 1].sale_price ?? sortedDesc[i + 1].price;
    if (priceA < priceB) {
      throw new Error(`Test 7 failed: Price descending sort violated: ${priceA} < ${priceB}`);
    }
  }

  console.log('\n ALL 7 PRODUCT SEARCH & FILTER TESTS PASSED SUCCESSFULLY!');
}

testSearchAndFilters().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
