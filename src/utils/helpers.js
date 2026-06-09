export const normalizeProductKey = (value) => String(value || '').trim().toLowerCase();

export const createProductSlug = (product) => {
  if (!product) return '';
  // If product already has a slug from DB, use it, else generate one
  if (product.slug) return product.slug;
  return `${normalizeProductKey(product.gender)}-${normalizeProductKey(product.name)}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
};

export const getProductImages = (product) => {
  if (!product) return [];
  const gallery = Array.isArray(product.images) ? product.images : [];
  if (product.image) {
    // Return main image first, then gallery images (avoiding duplicates)
    return [product.image, ...gallery.filter(img => img !== product.image)];
  }
  return gallery;
};

export const formatPrice = (val) => {
  if (val === undefined || val === null || val === '') return '';

  let cleanVal = String(val).trim();
  let symbol = '₹';

  // Extract custom symbol if present
  if (cleanVal.startsWith('₹')) {
    symbol = '₹';
    cleanVal = cleanVal.slice(1);
  } else if (cleanVal.startsWith('$')) {
    symbol = '$';
    cleanVal = cleanVal.slice(1);
  } else if (cleanVal.startsWith('£')) {
    symbol = '£';
    cleanVal = cleanVal.slice(1);
  } else if (cleanVal.startsWith('€')) {
    symbol = '€';
    cleanVal = cleanVal.slice(1);
  }

  const num = Number(cleanVal.replace(/,/g, ''));
  if (!isNaN(num)) {
    // Round to 2 decimals if not a whole number
    const formattedNum = num % 1 === 0 ? num.toFixed(0) : num.toFixed(2);
    return `${symbol}${formattedNum}`;
  }

  return `${symbol}${cleanVal}`;
};
