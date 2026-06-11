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
    name: "Black Full Compression",
    price: "$180",
    originalPrice: null,
    image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Compression/DSC_7632.jpg",
    images: [
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Compression/DSC_7632.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Compression/DSC_7642.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Compression/DSC_7616.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Compression/DSC_7630.jpg",
    ],
    description: "The best heavyweight compression gear for high-intensity training. Engineered with flatlock-reinforced stitching that prevents fraying during heavy lifts, the moisture-wicking fabric accelerates blood circulation and muscle recovery.",
    category: "Outerwear",
    gender: "men",
    tag: "BESTSELLER",
  },
  {
    id: "m2",
    name: "Preminum Blud Tank Black",
    price: "$240",
    originalPrice: null,
    image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7577.jpg",
    images: [
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7577.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7551.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7573.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7562.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7592.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Men/Tank%20Black/DSC_7594.jpg",
    ],
    description: "Premium heavyweight performance tank top crafted for intensive training and outdoor workouts. Designed with deep-cut armholes for maximum range of motion, and advanced anti-odor, moisture-wicking fabric.",
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
    description: "Elite training joggers designed for cold-weather training and street runs. Made from premium double-knit performance fleece that retains body heat while actively wicking moisture, featuring secure zip pockets.",
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
    description: "A reinforced flatlock stitched compression top built for elite athletes. Designed to support optimal chest and arm muscle stability during high-intensity training, improving blood circulation and reducing fatigue.",
    category: "Tops",
    gender: "men",
    tag: null,
  },
  {
    id: "m5",
    name: "Warrior Tee",
    price: "$75",
    originalPrice: null,
    image: "/tshirt.png",
    description: "A lightweight, moisture-wicking training tee for endurance and cross-training. Engineered with mesh ventilation zones under the arms to maximize breathability, ensuring you remain cool and dry.",
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
    description: "The ultimate breathable running shorts for marathon training. Features a dual-layer design with a lightweight outer shell for maximum airflow and a built-in compression liner to prevent chafing.",
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
    image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7497.jpg",
    images: [
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7515.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7532.jpg",
      "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg",
    ],
    description: "The best moisture-wicking gear for outdoor yoga, pilates, and heavy lifting. Engineered with a zero-slip waistband and seamless inner construction to eliminate chafing, providing a sculpted squat-proof fit.",
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
    description: "High-support performance sports bra built for high-impact workouts. Features a racerback silhouette for complete shoulder range of motion and compression molded cups to minimize bounce and keep you secure.",
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
    description: "Breathable running shorts for marathon training and agility workouts. Crafted from hyper-lightweight sweat-wicking fabric with side-split hems for maximum range of motion, plus a secure key pocket.",
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
    description: "The ultimate heavyweight cold-weather training hoodie for outdoor runs. Combining a sleek cropped silhouette with plush brushed-back thermal fleece to keep your core warm without restricting movement.",
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
    description: "High-performance compression tights designed to be the best moisture-wicking gear for outdoor yoga and intense gym sessions. Graduated compression promotes blood flow and reduces post-workout muscle fatigue.",
    category: "Bottoms",
    gender: "women",
    tag: null,
  },
  {
    id: "w6",
    name: "Shadow Flex Tee",
    price: "$70",
    originalPrice: null,
    image: "/tshirt.png",
    description: "A sweat-wicking training tee featuring hyper-stretch fabric designed to move with your body during agility drills. Seamless side construction prevents skin chafing for all-day active comfort.",
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
  productsToMerge.map((product, index) => {
    const genderProducts = productsToMerge.filter((item) => item.gender === product.gender);
    const genderIndex = genderProducts.findIndex((item) => item.id === product.id);
    const localGenderProducts =
      normalizeProductKey(product.gender) === 'women' ? womensProducts : mensProducts;

    const localProduct = allLocalProducts.find(
      (local) =>
        normalizeProductKey(local.name) === normalizeProductKey(product.name) &&
        normalizeProductKey(local.gender) === normalizeProductKey(product.gender)
    ) || localGenderProducts[genderIndex] || allLocalProducts[index];

    return localProduct
      ? {
        ...product,
        name: localProduct.name || product.name,
        price: localProduct.price || product.price,
        originalPrice: localProduct.originalPrice || product.originalPrice,
        original_price: product.original_price,
        image: localProduct.image || product.image,
        images: localProduct.images || product.images,
        category: localProduct.category || product.category,
        gender: localProduct.gender || product.gender,
        tag: localProduct.tag || product.tag,
        description: localProduct.description || product.description,
      }
      : product;
  });

// ============================================================
// Category Grid — "Introducing Premium Outfits Of Life Style"
// ============================================================
export const categories = [
  { id: 1, name: "COMPRESSION", image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/Compression%20Black%20Full/DSC_8003.jpg" },
  { id: 2, name: "JOGGERS", image: "/joggers.png" },
  { id: 3, name: "T-SHIRT", image: "/tshirt.png" },
  { id: 4, name: "SHORTS", image: "/shorts.png" },
  { id: 5, name: "LEGGINGS", image: "https://pkfdvlpegeasnvtqllkz.supabase.co/storage/v1/object/public/Bludwear/Womens/DSC_7544.jpg" },
  { id: 6, name: "ACCESSORIES", image: "/hero.png" },
];
