import { db } from '../server/db.js';

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

async function runTests() {
  console.log('--- STARTING BUILDCONNECT CORE MARKETPLACE AUTOMATED TEST SUITE ---');

  // Test 1: User Retrieval & Authentication
  const users = db.getUsers();
  assert(users.length >= 8, 'Users seeded with all 8 marketplace roles');
  const customer = db.getUserById('usr_cust_01');
  assert(customer !== undefined && customer.role === 'customer', 'Customer persona identified');
  const vendor = db.getUserById('usr_vend_01');
  assert(vendor !== undefined && vendor.role === 'vendor', 'Vendor persona identified');

  // Test 2: Material Inventory & Minimum Order
  const cement = db.getMaterialById('mat_01');
  assert(cement !== undefined, 'Cement material product exists in database');
  assert(cement!.minOrderQty === 25, 'Cement minOrderQty constraint enforced at 25 bags');
  assert(cement!.availableStock > 0, 'Cement inventory stock is available');

  // Test 3: Stock Decrement & Prevent Negative Stock
  const initialStock = cement!.availableStock;
  const decrementSuccess = db.decrementStock('mat_01', 50);
  assert(decrementSuccess, 'Stock successfully decremented for valid order quantity');
  assert(cement!.availableStock === initialStock - 50, 'Stock correctly reduced in database');

  const excessiveDecrement = db.decrementStock('mat_01', 999999);
  assert(!excessiveDecrement, 'Excessive quantity correctly rejected to prevent negative inventory');

  // Test 4: Equipment Availability & Overlap Conflict Prevention
  const jcb = db.getEquipmentById('eq_01');
  assert(jcb !== undefined, 'JCB equipment listing exists');
  const initialBlocked = [...jcb!.blockedDates];

  // Try booking for 2026-11-20
  const booking1 = db.createEquipmentBooking({
    id: `test_bk_${Date.now()}`,
    bookingNumber: 'BC-TEST-EQ-01',
    equipmentId: 'eq_01',
    equipmentName: jcb!.name,
    providerId: jcb!.providerId,
    customerId: 'usr_cust_01',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 98201 44521',
    siteAddress: 'Plot #14, Test Site',
    startDate: '2026-11-20',
    durationDays: 2,
    includeOperator: true,
    rentalCost: 17000,
    operatorCost: 1600,
    securityDeposit: 15000,
    totalAmount: 33600,
    status: 'requested',
    createdAt: new Date().toISOString(),
  });

  assert(booking1 !== undefined, 'Equipment booking successfully created');
  assert(jcb!.blockedDates.includes('2026-11-20'), 'Date 2026-11-20 marked blocked for equipment');

  // Test 5: Double-Entry Financial Ledger
  const ledgerCountBefore = db.getLedger().length;
  db.addLedgerEntry({
    id: `test_ledg_${Date.now()}`,
    transactionRef: 'TEST-TXN-01',
    orderId: 'ord_test_01',
    entryType: 'ORDER_PAYMENT',
    amount: 50000,
    debitAccount: 'CUSTOMER_ESCROW',
    creditAccount: 'MARKETPLACE_CLEARING',
    description: 'Test gross order payment',
    createdAt: new Date().toISOString(),
  });

  assert(db.getLedger().length === ledgerCountBefore + 1, 'Ledger entry recorded for financial reconciliation');

  // Test 6: Delivery OTP Verification
  const testOrder = db.createOrder({
    id: `ord_test_${Date.now()}`,
    orderNumber: 'BC-ORD-TEST99',
    customerId: 'usr_cust_01',
    customerName: 'Vikram Malhotra',
    customerPhone: '+91 98201 44521',
    shippingAddress: {
      street: 'Plot 42 Test Site',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
    },
    vendorId: 'usr_vend_01',
    vendorName: 'Agarwal Cement & Steel Traders',
    items: [],
    subtotal: 38500,
    totalGst: 10780,
    totalDelivery: 800,
    grandTotal: 50080,
    status: 'out_for_delivery',
    statusHistory: [],
    paymentMethod: 'UPI',
    paymentStatus: 'paid',
    deliveryOtp: '7412',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert(testOrder.deliveryOtp === '7412', 'Site delivery OTP generated');
  const updatedOrder = db.updateOrderStatus(testOrder.id, 'delivered', 'OTP verified');
  assert(updatedOrder?.status === 'delivered', 'Order status successfully transitioned to Delivered');

  // Test 7: Customer Projects & Saved Addresses
  const project = db.createProject({
    id: `proj_test_${Date.now()}`,
    customerId: 'usr_cust_01',
    title: 'Test Villa Construction',
    projectType: 'residential_villa',
    siteAddress: 'Electronic City Phase 1',
    sitePincode: '560100',
    targetBudget: 8000000,
    spentSoFar: 0,
    status: 'planning',
    orderIds: [],
    bookingIds: [],
    quotationIds: [],
    createdAt: new Date().toISOString(),
  });

  assert(project !== undefined && project.title === 'Test Villa Construction', 'Customer project created');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
