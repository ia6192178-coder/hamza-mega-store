// Default store settings. These are written into the `settings` table by
// /api/seed (only when the key does not exist yet) and are also used as a
// fallback whenever the database is unavailable.
export const DEFAULT_SETTINGS: Record<string, string> = {
  store_name: 'Hamza Mega Store',
  phone: '0307-4347460',
  whatsapp: '923074347460',
  email: 'info@hamzamegastore.com',
  address: 'Bahria Town, Lahore, Pakistan',
  delivery_fee: '250',
  free_delivery_threshold: '7000',
  announcement:
    'Free delivery on orders over Rs 7,000 — Cash on Delivery available across Pakistan',
  admin_password: 'hamza123',
  admin_session_token: '',
};

export type SeedProduct = {
  name: string;
  category: string;
  price: number;
  old_price: number | null;
  description: string;
  image_url: string;
  stock: number;
  is_new: boolean;
  is_best_seller: boolean;
  is_clearance: boolean;
  is_sold_out: boolean;
  rating: number;
};

// Sample catalogue (31 products, 10 categories). Every image URL below is a
// real Unsplash photo verified to return HTTP 200. These are placeholder
// products — the owner replaces them from the Admin panel (/admin).
export const SEED_PRODUCTS: SeedProduct[] = [
  // ---- Kitchen & Dining ----
  {
    name: 'Non-Stick Frying Pan 28cm',
    category: 'Kitchen & Dining',
    price: 1899,
    old_price: 2499,
    description:
      'Heavy-duty non-stick frying pan with a cool-touch handle. Perfect for daily cooking — parathas, omelettes, stir-fry and more.',
    image_url:
      'https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&q=80',
    stock: 50,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },
  {
    name: 'Electric Kettle 1.7L',
    category: 'Kitchen & Dining',
    price: 2499,
    old_price: 3299,
    description:
      'Fast-boil 1.7 litre electric kettle with auto shut-off and cool-touch body. Boils water in minutes for chai and coffee.',
    image_url:
      'https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=800&q=80',
    stock: 40,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.6,
  },
  {
    name: 'Kitchen Knife Set (6 Pieces)',
    category: 'Kitchen & Dining',
    price: 2199,
    old_price: 2999,
    description:
      'Sharp stainless steel knives with comfortable grips — chef knife, bread knife, utility knife and more in one set.',
    image_url:
      'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800&q=80',
    stock: 35,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.4,
  },
  {
    name: 'Ceramic Dinner Set (24 Pieces)',
    category: 'Kitchen & Dining',
    price: 5499,
    old_price: 7999,
    description:
      'Elegant 24-piece ceramic dinner set for 6 people. Chip-resistant glaze, dishwasher safe — perfect for family dinners and guests.',
    image_url:
      'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&q=80',
    stock: 20,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.7,
  },

  // ---- Home & Living ----
  {
    name: 'Cotton Bedsheet Set (Double)',
    category: 'Home & Living',
    price: 1499,
    old_price: 2199,
    description:
      'Soft 100% cotton double bedsheet with 2 pillow covers. Breathable, colour-fast and gentle on skin.',
    image_url:
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80',
    stock: 60,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },
  {
    name: 'Velvet Cushion Covers (Set of 5)',
    category: 'Home & Living',
    price: 999,
    old_price: 1499,
    description:
      'Luxury soft velvet cushion covers in rich colours. Hidden zip, easy to wash — instantly refreshes your sofa.',
    image_url:
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=800&q=80',
    stock: 45,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.3,
  },
  {
    name: 'LED Table Lamp',
    category: 'Home & Living',
    price: 1299,
    old_price: null,
    description:
      'Modern LED table lamp with warm light and adjustable brightness. Ideal for bedside tables and study desks.',
    image_url:
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80',
    stock: 30,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.4,
  },

  // ---- Footwear ----
  {
    name: "Men's Running Shoes",
    category: 'Footwear',
    price: 3499,
    old_price: 4999,
    description:
      'Lightweight breathable running shoes with cushioned soles. Comfortable for daily wear, jogging and gym.',
    image_url:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80',
    stock: 40,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.6,
  },
  {
    name: "Women's Comfort Sandals",
    category: 'Footwear',
    price: 1899,
    old_price: 2499,
    description:
      'Soft cushioned sandals with anti-slip soles. All-day comfort for home and outdoor wear.',
    image_url:
      'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=800&q=80',
    stock: 35,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.4,
  },
  {
    name: 'Kids Sports Shoes',
    category: 'Footwear',
    price: 1799,
    old_price: 2299,
    description:
      'Durable, lightweight sports shoes for kids with easy velcro straps — built for play, easy to wear.',
    image_url:
      'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80',
    stock: 0,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: true,
    rating: 4.5,
  },

  // ---- Baby & Kids Toys ----
  {
    name: 'Building Blocks Set (120 pcs)',
    category: 'Baby & Kids Toys',
    price: 1299,
    old_price: 1899,
    description:
      'Colourful 120-piece building blocks that spark creativity. Safe, non-toxic plastic for hours of fun.',
    image_url:
      'https://images.unsplash.com/photo-1558060370-d644479cb6f7?w=800&q=80',
    stock: 50,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.7,
  },
  {
    name: 'Soft Plush Teddy Bear (3 ft)',
    category: 'Baby & Kids Toys',
    price: 1499,
    old_price: null,
    description:
      'Extra-soft 3-foot teddy bear — the perfect gift for kids. Washable, huggable and made to last.',
    image_url:
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?w=800&q=80',
    stock: 25,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.8,
  },
  {
    name: 'Remote Control Racing Car',
    category: 'Baby & Kids Toys',
    price: 2499,
    old_price: 3499,
    description:
      'Fast RC racing car with 2.4GHz remote, rechargeable battery and working headlights.',
    image_url:
      'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=800&q=80',
    stock: 20,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },

  // ---- Home Decor ----
  {
    name: 'Modern Wall Clock',
    category: 'Home Decor',
    price: 899,
    old_price: 1299,
    description:
      'Stylish silent wall clock with a clean modern face. No ticking sound — perfect for bedrooms and living rooms.',
    image_url:
      'https://images.unsplash.com/photo-1563861826100-9cb868fdbe1c?w=800&q=80',
    stock: 40,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.3,
  },
  {
    name: 'Ceramic Flower Vase Set',
    category: 'Home Decor',
    price: 1199,
    old_price: 1799,
    description:
      'Set of elegant ceramic vases in three sizes. Add fresh or artificial flowers for an instant decor upgrade.',
    image_url:
      'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=800&q=80',
    stock: 30,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.4,
  },
  {
    name: 'Artificial Plant in Pot',
    category: 'Home Decor',
    price: 449,
    old_price: null,
    description:
      'Realistic artificial plant in a decorative pot. No watering needed — green decor all year round.',
    image_url:
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80',
    stock: 55,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.2,
  },

  // ---- Bathroom Accessories ----
  {
    name: 'Bathroom Organizer Set',
    category: 'Bathroom Accessories',
    price: 1099,
    old_price: 1599,
    description:
      'Complete bathroom storage set — toothbrush holder, soap dish, tray and more. Keeps your bathroom tidy.',
    image_url:
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?w=800&q=80',
    stock: 35,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.3,
  },
  {
    name: 'Luxury Bath Towel Set (4 pcs)',
    category: 'Bathroom Accessories',
    price: 1899,
    old_price: 2799,
    description:
      'Super-soft, highly absorbent cotton towels — 2 bath towels and 2 hand towels in matching colours.',
    image_url:
      'https://images.unsplash.com/photo-1600369672770-985fd30004eb?w=800&q=80',
    stock: 45,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.6,
  },
  {
    name: 'Bath Mat Set',
    category: 'Bathroom Accessories',
    price: 649,
    old_price: 1099,
    description:
      'Non-slip absorbent bath mats that keep your floor dry and safe. Quick-drying and machine washable.',
    image_url:
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    stock: 40,
    is_new: false,
    is_best_seller: false,
    is_clearance: true,
    is_sold_out: false,
    rating: 4.1,
  },

  // ---- Mobile Accessories ----
  {
    name: 'Wireless Bluetooth Earbuds',
    category: 'Mobile Accessories',
    price: 2999,
    old_price: 4499,
    description:
      'True wireless earbuds with clear sound, touch controls and a charging case. Up to 20 hours total playtime.',
    image_url:
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
    stock: 50,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.6,
  },
  {
    name: 'Fast Charging Power Bank 20000mAh',
    category: 'Mobile Accessories',
    price: 3299,
    old_price: 4299,
    description:
      'High-capacity 20000mAh power bank with fast charging and dual USB output. Charges your phone 3–4 times.',
    image_url:
      'https://images.unsplash.com/photo-1601524909162-ae8725290836?w=800&q=80',
    stock: 30,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },
  {
    name: 'Universal Phone Holder Stand',
    category: 'Mobile Accessories',
    price: 449,
    old_price: 799,
    description:
      'Adjustable phone stand for desk, bedside or kitchen. Sturdy, foldable and fits all phone sizes.',
    image_url:
      'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&q=80',
    stock: 70,
    is_new: false,
    is_best_seller: false,
    is_clearance: true,
    is_sold_out: false,
    rating: 4.2,
  },
  {
    name: 'Braided Fast-Charging Cable (2m)',
    category: 'Mobile Accessories',
    price: 399,
    old_price: 699,
    description:
      'Extra-long 2m braided cable with fast charging and data sync. Tangle-free and built to last.',
    image_url:
      'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80',
    stock: 100,
    is_new: false,
    is_best_seller: false,
    is_clearance: true,
    is_sold_out: false,
    rating: 4.3,
  },

  // ---- Organizers ----
  {
    name: 'Multi-Layer Storage Box Set',
    category: 'Organizers',
    price: 1299,
    old_price: 1999,
    description:
      'Stackable storage boxes with lids — organise clothes, toys, tools and more. Strong, dust-proof and neat.',
    image_url:
      'https://images.unsplash.com/photo-1604335399105-a0c585fd81a1?w=800&q=80',
    stock: 40,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.4,
  },
  {
    name: 'Closet Hanging Organizer',
    category: 'Organizers',
    price: 899,
    old_price: 1299,
    description:
      '6-shelf hanging closet organizer for clothes, shoes and accessories. Folds flat when not in use.',
    image_url:
      'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80',
    stock: 0,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: true,
    rating: 4.2,
  },
  {
    name: 'Stackable Shoe Rack',
    category: 'Organizers',
    price: 1599,
    old_price: 2299,
    description:
      'Sturdy multi-tier shoe rack that holds up to 18 pairs. Easy to assemble, fits any corner.',
    image_url:
      'https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=800&q=80',
    stock: 25,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },

  // ---- Health & Fitness ----
  {
    name: 'Adjustable Dumbbell Set 10kg',
    category: 'Health & Fitness',
    price: 4999,
    old_price: 6999,
    description:
      'Adjustable dumbbell set with easy weight change. Build strength at home — no gym needed.',
    image_url:
      'https://images.unsplash.com/photo-1638536532686-d610adfc8e5c?w=800&q=80',
    stock: 15,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.7,
  },
  {
    name: 'Non-Slip Yoga Mat',
    category: 'Health & Fitness',
    price: 1199,
    old_price: 1799,
    description:
      'Thick cushioned yoga mat with non-slip grip. Comfortable for yoga, stretching and home workouts.',
    image_url:
      'https://images.unsplash.com/photo-1576678927484-cc907957088c?w=800&q=80',
    stock: 35,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.5,
  },
  {
    name: 'Digital Weighing Scale',
    category: 'Health & Fitness',
    price: 1499,
    old_price: 2199,
    description:
      'Accurate digital bathroom scale with a clear LCD display. Tracks your weight with precision.',
    image_url:
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80',
    stock: 0,
    is_new: false,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: true,
    rating: 4.4,
  },

  // ---- Tool Kits ----
  {
    name: '46-Piece Home Tool Kit',
    category: 'Tool Kits',
    price: 3499,
    old_price: 4999,
    description:
      'Complete 46-piece tool set — hammer, screwdrivers, pliers, wrenches and more in a sturdy carry case.',
    image_url:
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800&q=80',
    stock: 20,
    is_new: false,
    is_best_seller: true,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.6,
  },
  {
    name: 'Cordless Drill Machine 21V',
    category: 'Tool Kits',
    price: 6499,
    old_price: 8999,
    description:
      'Powerful 21V cordless drill with 2 batteries, charger and bit set. Drills wood, metal and walls with ease.',
    image_url:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80',
    stock: 12,
    is_new: true,
    is_best_seller: false,
    is_clearance: false,
    is_sold_out: false,
    rating: 4.7,
  },
];

// Hero carousel slides (Unsplash images, verified HTTP 200).
export const HERO_SLIDES = [
  {
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1600&q=80',
    title: 'Mega Sale — Up to 45% Off',
    subtitle: 'Kitchen, home, fashion & more. Quality products at honest prices.',
    cta: 'Shop Best Sellers',
    href: '/#best-sellers',
  },
  {
    image:
      'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600&q=80',
    title: 'Everything For Your Home',
    subtitle: '10 categories, 100s of products — delivered to your doorstep.',
    cta: 'Browse Categories',
    href: '/#categories',
  },
  {
    image:
      'https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=1600&q=80',
    title: 'Cash on Delivery Across Pakistan',
    subtitle: 'Order now, pay when your parcel arrives. Free delivery over Rs 7,000.',
    cta: 'Shop New Arrivals',
    href: '/#new-arrivals',
  },
];
