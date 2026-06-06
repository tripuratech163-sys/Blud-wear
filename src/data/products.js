// ============================================================
// BludWear — Product & Category Data
// ============================================================
// To add a new product: copy a product object and fill in the fields.
// To update a price or name: just edit the value directly here.
// Images go in the /public folder and are referenced by filename.
// ============================================================

export const mensProducts = [
  {
    id: "m1",
    name: "Crimson Core Hoodie",
    price: "$180",
    originalPrice: null,
    image: "/hoodie.png",
    category: "Outerwear",
    gender: "men",
    tag: "BESTSELLER",
  },
  {
    id: "m2",
    name: "Onyx Performance Jacket",
    price: "$240",
    originalPrice: null,
    image: "/jacket.png",
    category: "Outerwear",
    gender: "men",
    tag: "NEW",
  },
  {
    id: "m3",
    name: "Bloodline Joggers",
    price: "$140",
    originalPrice: null,
    image: "/joggers.png",
    category: "Bottoms",
    gender: "men",
    tag: "NEW",
  },
  {
    id: "m4",
    name: "BludWear Compression",
    price: "$90",
    originalPrice: null,
    image: "/compression.png",
    category: "Training",
    gender: "men",
    tag: null,
  },
  {
    id: "m5",
    name: "Warrior Tee",
    price: "$75",
    originalPrice: null,
    image: "/tshirt.png",
    category: "Tops",
    gender: "men",
    tag: "NEW",
  },
  {
    id: "m6",
    name: "Shadow Shorts",
    price: "$95",
    originalPrice: null,
    image: "/shorts.png",
    category: "Bottoms",
    gender: "men",
    tag: null,
  },
];

export const womensProducts = [
  {
    id: "w1",
    name: "Phantom Leggings",
    price: "$110",
    originalPrice: "$150",
    image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
    images: [
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
    ],
    description: "High-waist performance leggings with a sculpted fit, smooth stretch, and a bold BludWear training look.",
    category: "Bottoms",
    gender: "women",
    tag: "BESTSELLER",
  },
  {
    id: "w2",
    name: "Blood Rush Sports Bra",
    price: "$75",
    originalPrice: null,
    image: "/sports_bra.png",
    category: "Tops",
    gender: "women",
    tag: "NEW",
  },
  {
    id: "w3",
    name: "Noir Running Shorts",
    price: "$85",
    originalPrice: null,
    image: "/shorts.png",
    category: "Bottoms",
    gender: "women",
    tag: null,
  },
  {
    id: "w4",
    name: "Crimson Crop Hoodie",
    price: "$160",
    originalPrice: null,
    image: "/hoodie.png",
    category: "Outerwear",
    gender: "women",
    tag: "NEW",
  },
  {
    id: "w5",
    name: "Elite Compression Tights",
    price: "$120",
    originalPrice: null,
    image: "/compression.png",
    category: "Training",
    gender: "women",
    tag: null,
  },
  {
    id: "w6",
    name: "Shadow Flex Tee",
    price: "$70",
    originalPrice: null,
    image: "/tshirt.png",
    category: "Tops",
    gender: "women",
    tag: null,
  },
];

// Combined for homepage "New Arrivals" (first 4 products)
export const products = [...mensProducts].slice(0, 4);

export const allLocalProducts = [...mensProducts, ...womensProducts];

const normalizeProductKey = (value) => String(value || '').trim().toLowerCase();

export const createProductSlug = (product) =>
  `${normalizeProductKey(product.gender)}-${normalizeProductKey(product.name)}`
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

export const getProductImages = (product) => {
  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images;
  }

  return product.image ? [product.image] : [];
};

export const mergeLocalProductImages = (productsToMerge) =>
  productsToMerge.map((product) => {
    const localProduct = allLocalProducts.find(
      (local) =>
        normalizeProductKey(local.name) === normalizeProductKey(product.name) &&
        normalizeProductKey(local.gender) === normalizeProductKey(product.gender)
    );

    return localProduct
      ? {
          ...product,
          image: product.image || localProduct.image,
          images: product.images || localProduct.images,
          description: product.description || localProduct.description,
        }
      : product;
  });

// ============================================================
// Category Grid — "Introducing Premium Outfits Of Life Style"
// ============================================================
export const categories = [
  { id: 1, name: "COMPRESSION", image: "/compression.png" },
  { id: 2, name: "JOGGERS",     image: "/joggers.png" },
  { id: 3, name: "T-SHIRT",     image: "/tshirt.png" },
  { id: 4, name: "SHORTS",      image: "/shorts.png" },
  { id: 5, name: "LEGGINGS",    image: "/leggings.png" },
  { id: 6, name: "ACCESSORIES", image: "/hero.png" },
];
