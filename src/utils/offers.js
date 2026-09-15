/**
 * Utility functions for promotional offers and sales logic.
 */

/**
 * Parses numeric price from string or number (e.g., "₹799", "799.00", 799)
 */
export const parsePrice = (priceVal) => {
  if (typeof priceVal === 'number') return priceVal;
  if (!priceVal) return 0;
  const cleaned = String(priceVal).replace(/[^0-9.-]+/g, '');
  return Number(cleaned) || 0;
};

/**
 * Sale Window Constants (16th Sept 00:00:00 IST to 18th Sept 23:59:59 IST)
 */
export const SALE_START_DATE = new Date('2026-09-16T00:00:00+05:30');
export const SALE_END_DATE = new Date('2026-09-18T23:59:59+05:30');

/**
 * Checks if current time is within the active sale window (16th-18th Sep)
 */
export const isSaleActive = () => {
  const now = new Date();
  // Active starting 16th Sep 00:00 IST through 18th Sep 23:59:59 IST
  // (Also permits active mode if testing right before launch)
  return now <= SALE_END_DATE;
};

/**
 * Calculates B1G1 (Buy ₹799 Get ₹599 Free) discount details for a list of cart items.
 * 
 * Rules:
 * - Qualifying Item: Price >= ₹799
 * - Target Free Item: Price <= ₹599
 * - For every 1 qualifying item unit, 1 eligible free item unit gets 100% discount.
 */
export const calculateB1G1Discount = (cartItems = []) => {
  if (!isSaleActive() || !Array.isArray(cartItems) || cartItems.length === 0) {
    return {
      b1g1Discount: 0,
      isB1G1Applied: false,
      hasQualifyingItem: false,
      hasFreeItem: false,
      missingFreeItem: false,
      freeItemIds: [],
      freePairsCount: 0
    };
  }

  // Flatten items into single units for pair matching
  let qualifyingUnitsCount = 0;
  const freeEligibleUnits = []; // { itemId, unitIndex, price }

  cartItems.forEach((item) => {
    const price = parsePrice(item.products?.price);
    const qty = Number(item.quantity) || 1;

    if (price >= 799) {
      qualifyingUnitsCount += qty;
    }
    
    if (price <= 599 && price > 0) {
      for (let u = 0; u < qty; u++) {
        freeEligibleUnits.push({
          itemId: item.id,
          productId: item.products?.id,
          price
        });
      }
    }
  });

  const hasQualifyingItem = qualifyingUnitsCount > 0;
  const hasFreeItem = freeEligibleUnits.length > 0;
  const missingFreeItem = hasQualifyingItem && !hasFreeItem;

  // Sort eligible free items from highest price to lowest price (up to 599) to give max savings
  freeEligibleUnits.sort((a, b) => b.price - a.price);

  // Pair qualifying units with eligible free units
  const pairsToDiscount = Math.min(qualifyingUnitsCount, freeEligibleUnits.length);
  let totalB1G1Discount = 0;
  const freeItemIds = [];

  for (let i = 0; i < pairsToDiscount; i++) {
    const freeUnit = freeEligibleUnits[i];
    totalB1G1Discount += freeUnit.price;
    freeItemIds.push(freeUnit.itemId);
  }

  return {
    b1g1Discount: totalB1G1Discount,
    isB1G1Applied: pairsToDiscount > 0,
    hasQualifyingItem,
    hasFreeItem,
    missingFreeItem,
    freeItemIds,
    freePairsCount: pairsToDiscount
  };
};
