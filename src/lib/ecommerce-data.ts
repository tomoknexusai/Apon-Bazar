/**
 * E-Commerce Catalog & Master Seed Data
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import { ProductCategory, Brand, Warehouse, Product, Coupon, BrandType } from '../types';

/**
 * Brand Name Normalization Utility
 * Strips whitespace, special characters, and forces lowercase to eliminate duplicates
 * (e.g., "P.R.A.N.", "pran ", "Pran" all resolve to "pran")
 */
export const normalizeBrandName = (str: string): string => {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
};

/**
 * Format PV / TP (Point Value / Token Points) to max 2 decimal places without floating-point errors
 * Formula: ((MRP - Dealer Price) - 20%) / 10 = TP
 */
export const formatPV = (val: number | undefined | null): string => {
  if (val === undefined || val === null || isNaN(val)) return '0';
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return rounded.toString();
};

export const formatTP = (val: number | undefined | null): string => {
  return formatPV(val);
};

export const calculateProductTP = (mrp: number, dealerPrice: number): number => {
  if (!mrp || !dealerPrice || mrp <= dealerPrice) return 0;
  const margin = mrp - dealerPrice;
  const netMargin = margin * 0.8; // minus 20%
  const tp = netMargin / 10;
  return Math.round((tp + Number.EPSILON) * 100) / 100;
};

// 18 MASTER CATEGORIES WITH COMPLETE SUBCATEGORIES
export const initialCategories: ProductCategory[] = [
  {
    id: 'cat-grocery',
    name: 'Grocery & Food',
    nameBn: 'গ্রোসারি ও ফুড',
    slug: 'grocery-food',
    icon: 'Apple',
    subCategories: [
      'Rice', 'Flour', 'Atta', 'Maida', 'Dal', 'Cooking Oil', 'Salt', 'Sugar', 'Spices',
      'Biscuits', 'Cookies', 'Snacks', 'Noodles', 'Pasta', 'Sauce', 'Pickles', 'Jam', 'Jelly',
      'Canned Food', 'Frozen Food', 'Dairy Products', 'Bread & Bakery', 'Tea', 'Coffee',
      'Breakfast Food', 'Dry Food', 'Baby Food', 'Other Grocery'
    ]
  },
  {
    id: 'cat-beverage',
    name: 'Beverage',
    nameBn: 'পানীয় ও বেভারেজ',
    slug: 'beverage',
    icon: 'Coffee',
    subCategories: [
      'Soft Drinks', 'Juice', 'Energy Drinks', 'Sports Drinks', 'Mineral Water', 'Flavoured Water',
      'Milk Drinks', 'Tea Drinks', 'Coffee Drinks', 'Other Beverages'
    ]
  },
  {
    id: 'cat-personal-care',
    name: 'Personal Care',
    nameBn: 'পার্সোনাল কেয়ার',
    slug: 'personal-care',
    icon: 'Sparkles',
    subCategories: [
      'Shampoo', 'Hair Oil', 'Hair Care', 'Soap', 'Face Wash', 'Skin Care', 'Body Lotion',
      'Cream', 'Deodorant', 'Perfume', 'Toothpaste', 'Toothbrush', 'Mouthwash', 'Shaving',
      'Grooming', 'Other Personal Care'
    ]
  },
  {
    id: 'cat-home-cleaning',
    name: 'Home & Cleaning',
    nameBn: 'হোম ও ক্লিনিং',
    slug: 'home-cleaning',
    icon: 'Flame',
    subCategories: [
      'Laundry Detergent', 'Dishwashing', 'Toilet Cleaner', 'Floor Cleaner', 'Glass Cleaner',
      'Bathroom Cleaner', 'Disinfectant', 'Air Freshener', 'Tissue', 'Garbage Bags',
      'Cleaning Tools', 'Other Cleaning Products'
    ]
  },
  {
    id: 'cat-baby-care',
    name: 'Baby Care',
    nameBn: 'বেবি কেয়ার',
    slug: 'baby-care',
    icon: 'ShoppingBag',
    subCategories: [
      'Baby Diaper', 'Baby Wipes', 'Baby Food', 'Baby Shampoo', 'Baby Soap', 'Baby Lotion',
      'Baby Oil', 'Baby Powder', 'Baby Accessories', 'Feeding Products', 'Other Baby Care'
    ]
  },
  {
    id: 'cat-electronics',
    name: 'Electronics',
    nameBn: 'ইলেকট্রনিক্স',
    slug: 'electronics',
    icon: 'Tv',
    subCategories: [
      'Television', 'Refrigerator', 'Air Conditioner', 'Washing Machine', 'Microwave Oven',
      'Fan', 'Air Cooler', 'Electric Oven', 'Rice Cooker', 'Blender', 'Mixer Grinder',
      'Electric Kettle', 'Iron', 'Water Heater', 'Other Electronics'
    ]
  },
  {
    id: 'cat-mobile-accessories',
    name: 'Mobile & Accessories',
    nameBn: 'মোবাইল ও এক্সেসরিজ',
    slug: 'mobile-accessories',
    icon: 'Smartphone',
    subCategories: [
      'Smartphone', 'Feature Phone', 'Tablet', 'Smartwatch', 'Mobile Charger', 'Power Bank',
      'Earphone', 'Headphone', 'Bluetooth Speaker', 'Mobile Case', 'Screen Protector',
      'Data Cable', 'Mobile Accessories', 'Other Mobile Products'
    ]
  },
  {
    id: 'cat-computer-it',
    name: 'Computer & IT',
    nameBn: 'কম্পিউটার ও আইটি',
    slug: 'computer-it',
    icon: 'Laptop',
    subCategories: [
      'Laptop', 'Desktop', 'Monitor', 'Keyboard', 'Mouse', 'Printer', 'Scanner', 'Router',
      'Webcam', 'Storage', 'RAM', 'SSD', 'Hard Disk', 'UPS', 'Computer Accessories', 'Other IT Products'
    ]
  },
  {
    id: 'cat-clothing-fashion',
    name: 'Clothing & Fashion',
    nameBn: 'ক্লথিং ও ফ্যাশন',
    slug: 'clothing-fashion',
    icon: 'Shirt',
    subCategories: [
      "Men's Clothing", "Women's Clothing", "Kids Clothing", "Saree", "Salwar Kameez",
      "Panjabi", "Shirt", "T-Shirt", "Pant", "Jeans", "Three Piece", "Hijab", "Abaya",
      "Innerwear", "Winter Wear", "Traditional Wear", "Fashion Accessories", "Other Fashion"
    ]
  },
  {
    id: 'cat-footwear',
    name: 'Footwear',
    nameBn: 'ফুটওয়্যার ও জুতো',
    slug: 'footwear',
    icon: 'Footprints',
    subCategories: [
      "Men's Shoes", "Women's Shoes", "Kids Shoes", "Sandals", "Slippers", "Sports Shoes",
      "Formal Shoes", "Sneakers", "School Shoes", "Boots", "Other Footwear"
    ]
  },
  {
    id: 'cat-home-appliances',
    name: 'Home Appliances',
    nameBn: 'হোম অ্যাপ্লায়েন্স',
    slug: 'home-appliances',
    icon: 'Home',
    subCategories: [
      'Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Fan',
      'Rice Cooker', 'Blender', 'Mixer', 'Electric Kettle', 'Microwave', 'Oven', 'Iron',
      'Vacuum Cleaner', 'Water Purifier', 'Other Home Appliances'
    ]
  },
  {
    id: 'cat-kitchen-household',
    name: 'Kitchen & Household',
    nameBn: 'কচিন ও হাউসহোল্ড',
    slug: 'kitchen-household',
    icon: 'Utensils',
    subCategories: [
      'Cookware', 'Dinner Set', 'Plates', 'Glasses', 'Cups & Mugs', 'Kitchen Tools',
      'Storage Containers', 'Water Bottles', 'Thermos', 'Pressure Cooker', 'Frying Pan',
      'Knife & Cutting Tools', 'Household Items', 'Other Kitchen Products'
    ]
  },
  {
    id: 'cat-health-hygiene',
    name: 'Health & Hygiene',
    nameBn: 'হেলথ ও হাইজিন',
    slug: 'health-hygiene',
    icon: 'HeartPulse',
    subCategories: [
      'Health Care Products', 'First Aid', 'Personal Hygiene', 'Masks', 'Sanitizer',
      'Thermometer', 'Medical Accessories', 'Fitness Accessories', 'Hygiene Products', 'Other Health Products'
    ]
  },
  {
    id: 'cat-stationery-education',
    name: 'Stationery & Education',
    nameBn: 'স্টেশনারি ও এডুকেশন',
    slug: 'stationery-education',
    icon: 'BookOpen',
    subCategories: [
      'Pen', 'Pencil', 'Notebook', 'Exercise Book', 'Paper', 'Marker', 'School Supplies',
      'Office Supplies', 'Art Supplies', 'Geometry Box', 'Bag', 'Calculator',
      'Educational Materials', 'Other Stationery'
    ]
  },
  {
    id: 'cat-automotive',
    name: 'Automotive',
    nameBn: 'অটোমোবাইল ও মোটর',
    slug: 'automotive',
    icon: 'Car',
    subCategories: [
      'Motorcycle', 'Car Accessories', 'Motorcycle Accessories', 'Engine Oil', 'Lubricants',
      'Battery', 'Tyre', 'Helmet', 'Spare Parts', 'Car Care', 'Cleaning Products', 'Tools', 'Other Automotive'
    ]
  },
  {
    id: 'cat-sports-fitness',
    name: 'Sports & Fitness',
    nameBn: 'স্পোর্টস ও ফিটনেস',
    slug: 'sports-fitness',
    icon: 'Dumbbell',
    subCategories: [
      'Football', 'Cricket', 'Badminton', 'Tennis', 'Sports Shoes', 'Sports Clothing',
      'Gym Equipment', 'Fitness Equipment', 'Yoga Products', 'Sports Accessories', 'Other Sports Products'
    ]
  },
  {
    id: 'cat-furniture',
    name: 'Furniture',
    nameBn: 'ফার্নিচার ও আসবাবপত্র',
    slug: 'furniture',
    icon: 'Armchair',
    subCategories: [
      'Bed', 'Sofa', 'Chair', 'Table', 'Dining Table', 'Wardrobe', 'Cabinet', 'Bookshelf',
      'Office Furniture', 'Kitchen Furniture', 'Outdoor Furniture', 'Mattress', 'Other Furniture'
    ]
  },
  {
    id: 'cat-hardware-electrical',
    name: 'Hardware & Electrical',
    nameBn: 'হার্ডওয়্যার ও ইলেকট্রিক্যাল',
    slug: 'hardware-electrical',
    icon: 'Wrench',
    subCategories: [
      'Electrical Wire', 'Switch', 'Socket', 'LED Bulb', 'Tube Light', 'Circuit Breaker',
      'Electrical Accessories', 'Power Strip', 'Extension Board', 'Tools', 'Hardware',
      'Plumbing', 'Paint & Accessories', 'Construction Accessories', 'Other Hardware Products'
    ]
  }
];

// CENTRALIZED MASTER BRANDS SEED DATA
const rawBrandList: { name: string; brandType: BrandType; categoryIds?: string[]; subCategories?: string[]; country?: string }[] = [
  // Generic Fallback Brands (Available for all categories)
  { name: 'Local Brand', brandType: 'Local Brand', country: 'Bangladesh' },
  { name: 'Other Brand', brandType: 'Other Brand', country: 'International' },

  // Grocery Brands
  { name: 'PRAN', brandType: 'National/Established Brand', categoryIds: ['cat-grocery', 'cat-beverage'], subCategories: ['Biscuits', 'Cookies', 'Snacks', 'Noodles', 'Pasta', 'Sauce', 'Pickles', 'Jam', 'Jelly', 'Soft Drinks', 'Juice', 'Dairy Products'], country: 'Bangladesh' },
  { name: 'Fresh', brandType: 'National/Established Brand', categoryIds: ['cat-grocery', 'cat-beverage', 'cat-home-cleaning', 'cat-stationery-education'], subCategories: ['Rice', 'Flour', 'Atta', 'Maida', 'Dal', 'Cooking Oil', 'Salt', 'Sugar', 'Spices', 'Tea', 'Mineral Water', 'Tissue', 'Paper'], country: 'Bangladesh' },
  { name: 'Teer', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Rice', 'Flour', 'Atta', 'Maida', 'Dal', 'Cooking Oil', 'Salt', 'Sugar'], country: 'Bangladesh' },
  { name: 'Radhuni', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Spices', 'Cooking Oil', 'Pickles', 'Salt', 'Sauce'], country: 'Bangladesh' },
  { name: 'Bashundhara', brandType: 'National/Established Brand', categoryIds: ['cat-grocery', 'cat-home-cleaning'], subCategories: ['Atta', 'Flour', 'Maida', 'Noodles', 'Tissue', 'Paper'], country: 'Bangladesh' },
  { name: 'ACI Pure', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Salt', 'Flour', 'Atta', 'Maida', 'Rice', 'Spices', 'Cooking Oil'], country: 'Bangladesh' },
  { name: 'Pusti', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Cooking Oil', 'Flour', 'Atta', 'Maida', 'Rice'], country: 'Bangladesh' },
  { name: 'Ifad', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Biscuits', 'Noodles', 'Cooking Oil', 'Snacks'], country: 'Bangladesh' },
  { name: 'Chashi', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Rice', 'Aromatic Rice'], country: 'Bangladesh' },
  { name: 'Olympic', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Biscuits', 'Cookies', 'Snacks', 'Noodles'], country: 'Bangladesh' },
  { name: 'Danish', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Biscuits', 'Condensed Milk', 'Dairy Products', 'Snacks'], country: 'Bangladesh' },
  { name: 'Cocola', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Noodles', 'Biscuits', 'Snacks'], country: 'Bangladesh' },
  { name: 'Fu-Wang', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Biscuits', 'Snacks'], country: 'Bangladesh' },
  { name: 'Bombay Sweets', brandType: 'National/Established Brand', categoryIds: ['cat-grocery'], subCategories: ['Snacks', 'Potato Chips', 'Noodles'], country: 'Bangladesh' },
  { name: 'Nestlé', brandType: 'National/Established Brand', categoryIds: ['cat-grocery', 'cat-baby-care', 'cat-beverage'], subCategories: ['Noodles', 'Coffee', 'Baby Food', 'Breakfast Food', 'Dairy Products'], country: 'Switzerland' },

  // Beverage Brands
  { name: 'Coca-Cola', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'USA' },
  { name: 'Pepsi', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'USA' },
  { name: 'Sprite', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'USA' },
  { name: '7UP', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'USA' },
  { name: 'Mountain Dew', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'USA' },
  { name: 'Frutika', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Juice'], country: 'Bangladesh' },
  { name: 'Mojo', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'Bangladesh' },
  { name: 'Clemon', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Soft Drinks'], country: 'Bangladesh' },
  { name: 'Speed', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Energy Drinks'], country: 'Bangladesh' },
  { name: 'Mum', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Mineral Water'], country: 'Bangladesh' },
  { name: 'Aquafina', brandType: 'National/Established Brand', categoryIds: ['cat-beverage'], subCategories: ['Mineral Water'], country: 'USA' },

  // Personal Care
  { name: 'Lux', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Soap', 'Body Lotion', 'Skin Care'], country: 'UK' },
  { name: 'Dove', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Shampoo', 'Soap', 'Body Lotion', 'Face Wash', 'Deodorant', 'Skin Care'], country: 'UK' },
  { name: 'Sunsilk', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Shampoo', 'Hair Oil', 'Hair Care'], country: 'UK' },
  { name: 'Clear', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Shampoo', 'Hair Care'], country: 'UK' },
  { name: 'Lifebuoy', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Soap', 'Face Wash', 'Shampoo'], country: 'UK' },
  { name: 'Closeup', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Toothpaste', 'Toothbrush', 'Mouthwash'], country: 'USA' },
  { name: 'Pepsodent', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Toothpaste', 'Toothbrush'], country: 'USA' },
  { name: 'Vaseline', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Body Lotion', 'Cream', 'Skin Care'], country: 'USA' },
  { name: 'Ponds', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Face Wash', 'Cream', 'Skin Care'], country: 'USA' },
  { name: 'Nivea', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Body Lotion', 'Deodorant', 'Cream', 'Skin Care'], country: 'Germany' },
  { name: 'Himalaya', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care', 'cat-baby-care'], subCategories: ['Face Wash', 'Shampoo', 'Baby Shampoo', 'Baby Soap', 'Skin Care'], country: 'India' },
  { name: 'Joya', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Grooming', 'Other Personal Care'], country: 'Bangladesh' },
  { name: 'Unilever', brandType: 'National/Established Brand', categoryIds: ['cat-personal-care'], subCategories: ['Shampoo', 'Soap', 'Toothpaste', 'Skin Care'], country: 'UK' },

  // Home & Cleaning
  { name: 'Wheel', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Laundry Detergent'], country: 'Bangladesh' },
  { name: 'Rin', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Laundry Detergent'], country: 'Bangladesh' },
  { name: 'Surf Excel', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Laundry Detergent'], country: 'UK' },
  { name: 'Vim', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Dishwashing'], country: 'UK' },
  { name: 'Harpic', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Toilet Cleaner', 'Bathroom Cleaner'], country: 'UK' },
  { name: 'Mr. Muscle', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Floor Cleaner', 'Glass Cleaner', 'Bathroom Cleaner'], country: 'USA' },
  { name: 'Dettol', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning'], subCategories: ['Disinfectant', 'Floor Cleaner'], country: 'UK' },
  { name: 'ACI', brandType: 'National/Established Brand', categoryIds: ['cat-home-cleaning', 'cat-health-hygiene'], subCategories: ['Air Freshener', 'Disinfectant', 'Sanitizer'], country: 'Bangladesh' },

  // Baby Care
  { name: 'Pampers', brandType: 'National/Established Brand', categoryIds: ['cat-baby-care'], subCategories: ['Baby Diaper', 'Baby Wipes'], country: 'USA' },
  { name: 'Huggies', brandType: 'National/Established Brand', categoryIds: ['cat-baby-care'], subCategories: ['Baby Diaper', 'Baby Wipes'], country: 'USA' },
  { name: 'MamyPoko', brandType: 'National/Established Brand', categoryIds: ['cat-baby-care'], subCategories: ['Baby Diaper'], country: 'Japan' },
  { name: "Johnson's", brandType: 'National/Established Brand', categoryIds: ['cat-baby-care'], subCategories: ['Baby Shampoo', 'Baby Soap', 'Baby Lotion', 'Baby Oil', 'Baby Powder'], country: 'USA' },
  { name: 'Meril Baby', brandType: 'National/Established Brand', categoryIds: ['cat-baby-care'], subCategories: ['Baby Soap', 'Baby Lotion', 'Baby Oil', 'Baby Powder', 'Baby Shampoo'], country: 'Bangladesh' },
  { name: 'Savlon', brandType: 'National/Established Brand', categoryIds: ['cat-baby-care', 'cat-health-hygiene'], subCategories: ['Baby Wipes', 'Sanitizer', 'Personal Hygiene'], country: 'Bangladesh' },

  // Electronics & Home Appliances
  { name: 'Samsung', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-mobile-accessories', 'cat-home-appliances', 'cat-computer-it'], subCategories: ['Smartphone', 'Television', 'Refrigerator', 'Washing Machine', 'Air Conditioner', 'Tablet', 'Monitor', 'Smartwatch'], country: 'South Korea' },
  { name: 'LG', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Microwave Oven'], country: 'South Korea' },
  { name: 'Sony', brandType: 'National/Established Brand', categoryIds: ['cat-electronics'], subCategories: ['Television', 'Headphone', 'Earphone', 'Bluetooth Speaker'], country: 'Japan' },
  { name: 'Walton', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances', 'cat-kitchen-household', 'cat-automotive', 'cat-hardware-electrical'], subCategories: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Microwave Oven', 'Fan', 'Air Cooler', 'Electric Oven', 'Rice Cooker', 'Blender', 'Mixer Grinder', 'Electric Kettle', 'Iron', 'Water Heater', 'Other Electronics', 'Other Home Appliances'], country: 'Bangladesh' },
  { name: 'Singer', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Microwave Oven', 'Iron', 'Fan', 'Electric Oven'], country: 'Bangladesh' },
  { name: 'Vision', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances', 'cat-kitchen-household'], subCategories: ['Television', 'Refrigerator', 'Air Conditioner', 'Washing Machine', 'Fan', 'Rice Cooker', 'Blender', 'Mixer', 'Electric Kettle', 'Iron'], country: 'Bangladesh' },
  { name: 'Marcel', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Fan'], country: 'Bangladesh' },
  { name: 'Minister', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Refrigerator', 'Television', 'Air Conditioner', 'Washing Machine', 'Fan'], country: 'Bangladesh' },
  { name: 'Haier', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Refrigerator', 'Washing Machine', 'Air Conditioner', 'Television'], country: 'China' },
  { name: 'Hisense', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances'], subCategories: ['Television', 'Refrigerator', 'Air Conditioner'], country: 'China' },
  { name: 'Philips', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances', 'cat-kitchen-household', 'cat-hardware-electrical'], subCategories: ['Blender', 'Mixer', 'Mixer Grinder', 'Iron', 'Electric Kettle', 'LED Bulb', 'Water Purifier', 'Other Home Appliances'], country: 'Netherlands' },
  { name: 'Panasonic', brandType: 'National/Established Brand', categoryIds: ['cat-electronics', 'cat-home-appliances', 'cat-hardware-electrical'], subCategories: ['Refrigerator', 'Air Conditioner', 'Washing Machine', 'Blender', 'Iron'], country: 'Japan' },
  { name: 'Miyako', brandType: 'National/Established Brand', categoryIds: ['cat-home-appliances', 'cat-kitchen-household'], subCategories: ['Blender', 'Mixer', 'Electric Kettle', 'Rice Cooker', 'Iron', 'Microwave', 'Oven', 'Pressure Cooker', 'Cookware'], country: 'Japan' },
  { name: 'Kiam', brandType: 'National/Established Brand', categoryIds: ['cat-home-appliances', 'cat-kitchen-household', 'cat-hardware-electrical'], subCategories: ['Rice Cooker', 'Pressure Cooker', 'Cookware', 'Frying Pan', 'Blender', 'Electric Kettle'], country: 'Bangladesh' },

  // Mobile & IT
  { name: 'Xiaomi', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Redmi', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Realme', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Oppo', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Vivo', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Apple', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories', 'cat-computer-it'], country: 'USA' },
  { name: 'Nokia', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'Finland' },
  { name: 'Tecno', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Infinix', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'OnePlus', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },
  { name: 'Anker', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'USA' },
  { name: 'Baseus', brandType: 'National/Established Brand', categoryIds: ['cat-mobile-accessories'], country: 'China' },

  // Computer & IT
  { name: 'HP', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'USA' },
  { name: 'Dell', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'USA' },
  { name: 'Lenovo', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'China' },
  { name: 'Asus', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Taiwan' },
  { name: 'Acer', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Taiwan' },
  { name: 'MSI', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Taiwan' },
  { name: 'Logitech', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Switzerland' },
  { name: 'A4Tech', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Taiwan' },
  { name: 'Canon', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Japan' },
  { name: 'Epson', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Japan' },
  { name: 'Brother', brandType: 'National/Established Brand', categoryIds: ['cat-computer-it'], country: 'Japan' },

  // Clothing & Fashion
  { name: 'Aarong', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Yellow', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Sailor', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Ecstasy', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Cats Eye', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Richman', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Dorjibari', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Kay Kraft', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Rang', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },
  { name: 'Le Reve', brandType: 'National/Established Brand', categoryIds: ['cat-clothing-fashion'], country: 'Bangladesh' },

  // Footwear
  { name: 'Bata', brandType: 'National/Established Brand', categoryIds: ['cat-footwear'], country: 'Switzerland' },
  { name: 'Apex', brandType: 'National/Established Brand', categoryIds: ['cat-footwear'], country: 'Bangladesh' },
  { name: 'Bay', brandType: 'National/Established Brand', categoryIds: ['cat-footwear'], country: 'Bangladesh' },
  { name: 'Jennys', brandType: 'National/Established Brand', categoryIds: ['cat-footwear'], country: 'Bangladesh' },
  { name: 'Lotto', brandType: 'National/Established Brand', categoryIds: ['cat-footwear', 'cat-sports-fitness'], country: 'Italy' },
  { name: 'Nike', brandType: 'National/Established Brand', categoryIds: ['cat-footwear', 'cat-sports-fitness'], country: 'USA' },
  { name: 'Adidas', brandType: 'National/Established Brand', categoryIds: ['cat-footwear', 'cat-sports-fitness'], country: 'Germany' },
  { name: 'Puma', brandType: 'National/Established Brand', categoryIds: ['cat-footwear', 'cat-sports-fitness'], country: 'Germany' },
  { name: 'Reebok', brandType: 'National/Established Brand', categoryIds: ['cat-footwear', 'cat-sports-fitness'], country: 'USA' },
  { name: 'Skechers', brandType: 'National/Established Brand', categoryIds: ['cat-footwear'], country: 'USA' },

  // Kitchen & Household
  { name: 'RFL', brandType: 'National/Established Brand', categoryIds: ['cat-kitchen-household', 'cat-furniture', 'cat-hardware-electrical'], country: 'Bangladesh' },
  { name: 'Kiam', brandType: 'National/Established Brand', categoryIds: ['cat-home-appliances', 'cat-kitchen-household', 'cat-hardware-electrical'], country: 'Bangladesh' },
  { name: 'Miyako', brandType: 'National/Established Brand', categoryIds: ['cat-home-appliances', 'cat-kitchen-household'], country: 'Japan' },
  { name: 'Prestige', brandType: 'National/Established Brand', categoryIds: ['cat-kitchen-household'], country: 'India' },

  // Health & Hygiene
  { name: 'Square', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'Renata', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'Beximco', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'Incepta', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'Opsonin', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'SK+F', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },
  { name: 'Healthcare Pharmaceuticals', brandType: 'National/Established Brand', categoryIds: ['cat-health-hygiene'], country: 'Bangladesh' },

  // Stationery
  { name: 'Matador', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'Bangladesh' },
  { name: 'Pilot', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'Japan' },
  { name: 'Faber-Castell', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'Germany' },
  { name: 'Deli', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'China' },
  { name: 'Pentel', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'Japan' },
  { name: 'Maped', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'France' },
  { name: 'Kokuyo', brandType: 'National/Established Brand', categoryIds: ['cat-stationery-education'], country: 'Japan' },

  // Automotive
  { name: 'Toyota', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Japan' },
  { name: 'Honda', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Japan' },
  { name: 'Yamaha', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Japan' },
  { name: 'Suzuki', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Japan' },
  { name: 'Bajaj', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'India' },
  { name: 'TVS', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'India' },
  { name: 'Hero', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'India' },
  { name: 'Runner', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Bangladesh' },
  { name: 'Castrol', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'UK' },
  { name: 'Mobil', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'USA' },
  { name: 'Shell', brandType: 'National/Established Brand', categoryIds: ['cat-automotive'], country: 'Netherlands' },

  // Sports & Fitness
  { name: 'Yonex', brandType: 'National/Established Brand', categoryIds: ['cat-sports-fitness'], country: 'Japan' },
  { name: 'Cosco', brandType: 'National/Established Brand', categoryIds: ['cat-sports-fitness'], country: 'India' },
  { name: 'Nivia', brandType: 'National/Established Brand', categoryIds: ['cat-sports-fitness'], country: 'India' },

  // Furniture
  { name: 'Hatil', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },
  { name: 'Otobi', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },
  { name: 'Navana', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },
  { name: 'Regal', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },
  { name: 'Akhter', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },
  { name: 'Brothers Furniture', brandType: 'National/Established Brand', categoryIds: ['cat-furniture'], country: 'Bangladesh' },

  // Hardware & Electrical
  { name: 'Super Star', brandType: 'National/Established Brand', categoryIds: ['cat-hardware-electrical'], country: 'Bangladesh' },
  { name: 'Schneider Electric', brandType: 'National/Established Brand', categoryIds: ['cat-hardware-electrical'], country: 'France' },
  { name: 'Siemens', brandType: 'National/Established Brand', categoryIds: ['cat-hardware-electrical'], country: 'Germany' },
  { name: 'Havells', brandType: 'National/Established Brand', categoryIds: ['cat-hardware-electrical'], country: 'India' }
];

export const initialBrands: Brand[] = rawBrandList.map((b, idx) => ({
  id: `brand-${idx + 1}`,
  name: b.name,
  brandType: b.brandType,
  countryOfOrigin: b.country || 'Bangladesh',
  status: 'active',
  categoryIds: b.categoryIds || [],
  subCategories: b.subCategories || [],
  description: `${b.name} - ${b.brandType}`
}));

export const initialWarehouses: Warehouse[] = [
  { id: 'DLR-THAK-001', name: 'M/S Rahman Enterprise', code: 'DLR-THAK-001', division: 'রংপুর', district: 'ঠাকুরগাঁও', upazila: 'ঠাকুরগাঁও সদর', unionName: 'ঠাকুরগাঁও সদর', latitude: 26.0336, longitude: 88.4617, stockCount: 14500 },
  { id: 'DLR-SAID-002', name: 'M/S Karim Traders', code: 'DLR-SAID-002', division: 'রংপুর', district: 'নীলফামারী', upazila: 'সৈয়দপুর', unionName: 'সৈয়দপুর', latitude: 25.7785, longitude: 88.8974, stockCount: 8200 },
  { id: 'DLR-DIN-003', name: 'M/S Noor Traders', code: 'DLR-DIN-003', division: 'রংপুর', district: 'দিনাজপুর', upazila: 'দিনাজপুর সদর', unionName: 'দিনাজপুর সদর', latitude: 25.6279, longitude: 88.6332, stockCount: 6100 },
  { id: 'DLR-DHK-004', name: 'M/S Chowdhury & Sons', code: 'DLR-DHK-004', division: 'ঢাকা', district: 'ঢাকা', upazila: 'মিরপুর', unionName: 'মিরপুর-১০', latitude: 23.8069, longitude: 90.3687, stockCount: 9500 },
  { id: 'DLR-CTG-005', name: 'M/S Al-Madina Enterprise', code: 'DLR-CTG-005', division: 'চট্টগ্রাম', district: 'চট্টগ্রাম', upazila: 'কোতোয়ালী', unionName: 'আন্দরকিল্লা', latitude: 22.3390, longitude: 91.8320, stockCount: 7800 },
  { id: 'DLR-RAJ-006', name: 'M/S Padma Traders', code: 'DLR-RAJ-006', division: 'রাজশাহী', district: 'রাজশাহী', upazila: 'বোয়ালিয়া', unionName: 'সাহেব বাজার', latitude: 24.3750, longitude: 88.6050, stockCount: 5400 },
  { id: 'DLR-SYL-007', name: 'M/S Surma Agro & Enterprise', code: 'DLR-SYL-007', division: 'সিলেট', district: 'সিলেট', upazila: 'সিলেট সদর', unionName: 'জিন্দাবাজার', latitude: 24.8949, longitude: 91.8687, stockCount: 6300 }
];

export const initialCoupons: Coupon[] = [
  { code: 'GHORER2026', discountType: 'percentage', discountValue: 10, minOrderAmount: 1000, maxDiscount: 300, description: '১০% বিশেষ ডিসকাউন্ট (সর্বোচ্চ ৩০০ ৳)' },
  { code: 'EIDMELA', discountType: 'fixed', discountValue: 150, minOrderAmount: 1500, maxDiscount: 150, description: '১৫০ ৳ ফ্ল্যাট ছাড় ১৫০০ ৳ অর্ডারে' },
  { code: 'TOMOK50', discountType: 'fixed', discountValue: 50, minOrderAmount: 500, maxDiscount: 50, description: '৫০ ৳ ইনস্ট্যান্ট অফার' }
];

export const initialProducts: Product[] = [
  {
    id: 'prod-samsung-tv-43',
    title: 'Samsung LED TV 43 Inch Crystal 4K UHD Smart Television',
    titleBn: 'স্যামসাং এলইডি টিভি ৪৩ ইঞ্চি ক্রিস্টাল ৪কে স্মার্ট টেলিভিশন',
    slug: 'samsung-led-tv-43-inch-crystal-4k-uhd',
    categoryId: 'cat-electronics',
    categoryName: 'Electronics & Gadgets',
    subCategory: 'Television',
    brandId: 'brand-samsung',
    brandName: 'Samsung',
    sku: 'SAM-TV-43-LED',
    barcode: '88091234999',
    images: [
      'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1461151304267-38535e780c79?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Samsung 43 Inch Smart LED TV with Ultra HD 4K clarity, HDR10+, Smart Hub, and Dolby Digital Plus audio.',
    descriptionBn: 'স্যামসাং ৪৩ ইঞ্চি স্মার্ট এলইডি টিভি। ক্রিস্টাল আল্ট্রা এইচডি ৪কে ডিসপ্লে, স্মার্ট হাব এবং ডলবি ডিজিটাল প্লাস সাউন্ড।',
    mrp: 1500,
    dealerPrice: 1000,
    profit: 500,
    adminCost: 100,
    netProfit: 400,
    vendorCost: 950,
    serviceCharge: 60,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 1500,
    discountPrice: 1500,
    couponDiscount: 0,
    cashbackPct: 0,
    pvMode: 'auto',
    pvValue: 40,
    pvPoint: 40,
    paymentOptions: {
      nagad: true,
      bkash: true,
      rocket: true,
      bank: true,
      cod: true
    },
    weightKg: 8.5,
    dimensionsCm: '96x56x8',
    codAvailable: true,
    unit: 'Piece',
    tags: ['Samsung', 'LED TV', 'Smart TV', 'Electronics'],
    stock: 45,
    warehouseId: 'DLR-THAK-001',
    warehouseName: 'M/S Rahman Enterprise',
    tradeLicenseBusinessName: 'M/S Rahman Enterprise',
    tradeLicenseNumber: 'TRAD/THAK/2026/0192',
    dealerOwnerName: 'মোঃ আব্দুর রহমান',
    dealer_id: 'DLR-THAK-001',
    dealer_name: 'মোঃ আব্দুর রহমান',
    dealer_shop_name: 'M/S Rahman Enterprise',
    upazila: 'ঠাকুরগাঁও সদর',
    district: 'ঠাকুরগাঁও',
    zone_id: 'upz_435',
    zone_name: 'Thakurgaon Sadar Zone',
    zone_name_bn: 'ঠাকুরগাঁও সদর জোন',
    dealerStocks: [
      {
        dealerId: 'DLR-THAK-001',
        dealerOwnerName: 'মোঃ আব্দুর রহমান',
        tradeLicenseBusinessName: 'M/S Rahman Enterprise',
        tradeLicenseNumber: 'TRAD/THAK/2026/0192',
        contactPhone: '+8801711223344',
        address: 'পুরাতন বাসস্ট্যান্ড রোড, ঠাকুরগাঁও সদর, ঠাকুরগাঁও',
        division: 'রংপুর',
        district: 'ঠাকুরগাঁও',
        upazila: 'ঠাকুরগাঁও সদর',
        zoneId: 'upz_435',
        zoneName: 'Thakurgaon Sadar Zone',
        stock: 20,
        availableStock: 20
      },
      {
        dealerId: 'DLR-SAID-002',
        dealerOwnerName: 'মোঃ করিম উদ্দিন',
        tradeLicenseBusinessName: 'M/S Karim Traders',
        tradeLicenseNumber: 'TRAD/NIL/2026/4821',
        contactPhone: '+8801712334455',
        address: 'রেলওয়ে মার্কেট, সৈয়দপুর, নীলফামারী',
        division: 'রংপুর',
        district: 'নীলফামারী',
        upazila: 'সৈয়দপুর',
        zoneId: 'upz_425',
        zoneName: 'Saidpur Zone',
        stock: 10,
        availableStock: 10
      },
      {
        dealerId: 'DLR-DIN-003',
        dealerOwnerName: 'মোঃ নূরুল ইসলাম',
        tradeLicenseBusinessName: 'M/S Noor Traders',
        tradeLicenseNumber: 'TRAD/DIN/2026/3310',
        contactPhone: '+8801713445566',
        address: 'বাহাদুর বাজার, দিনাজপুর সদর, দিনাজপুর',
        division: 'রংপুর',
        district: 'দিনাজপুর',
        upazila: 'দিনাজপুর সদর',
        zoneId: 'upz_408',
        zoneName: 'Dinajpur Sadar Zone',
        stock: 15,
        availableStock: 15
      }
    ],
    rating: 4.9,
    reviewsCount: 32,
    reviews: [
      { id: 'rev-sam-1', userName: 'আসিফ ইকবাল', rating: 5, comment: 'ছবি ও সাউন্ড কোয়ালিটি অসাধারণ!', date: '২০২৬-০৮-১২', verifiedPurchase: true }
    ],
    variants: [],
    vendorId: 'ven-1',
    vendorShopName: 'M/S Rahman Enterprise',
    marketBazar: 'পুরাতন বাসস্ট্যান্ড মার্কেট',
    isApproved: true,
    createdAt: '2026-08-01'
  },
  {
    id: 'prod-aano-1500',
    title: 'AANO BAZAR Premium Cold Pressed Mustard Oil 5L',
    titleBn: 'আনো বাজার খাঁটি কাঠের ঘানি ভাঙা সরিষার তেল ৫ লিটার',
    slug: 'aano-bazar-pure-mustard-oil-5l',
    categoryId: 'cat-grocery',
    categoryName: 'Grocery & Food',
    subCategory: 'Cooking Oil',
    brandId: 'brand-3',
    brandName: 'AANO BAZAR',
    sku: 'AANO-OIL-1500',
    barcode: '88091234000',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800'
    ],
    description: '100% pure cold-pressed mustard oil with authentic pungent aroma and rich natural nutrients.',
    descriptionBn: '১০০% বিশুদ্ধ কাঠের ঘানিতে ভাঙা খাঁটি সরিষার তেল। ঝাঁঝালো গন্ধ ও প্রাকৃতিক পুষ্টিগুণ সমৃদ্ধ।',
    mrp: 1500,
    dealerPrice: 1000,
    profit: 500,
    adminCost: 100,
    netProfit: 400,
    vendorCost: 950,
    serviceCharge: 60,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 1500,
    discountPrice: 1500,
    couponDiscount: 0,
    cashbackPct: 0,
    pvMode: 'auto',
    pvValue: 40,
    pvPoint: 40,
    paymentOptions: {
      nagad: true,
      bkash: true,
      rocket: true,
      bank: true,
      cod: true
    },
    weightKg: 5.0,
    dimensionsCm: '20x20x35',
    codAvailable: true,
    unit: 'L',
    tags: ['Mustard Oil', 'Cooking Oil', 'AANO BAZAR', 'Pure Cold Pressed'],
    stock: 120,
    warehouseId: 'DLR-THAK-001',
    warehouseName: 'M/S Rahman Enterprise',
    tradeLicenseBusinessName: 'M/S Rahman Enterprise',
    tradeLicenseNumber: 'TRAD/THAK/2026/0192',
    dealerOwnerName: 'মোঃ আব্দুর রহমান',
    dealer_id: 'DLR-THAK-001',
    dealer_name: 'মোঃ আব্দুর রহমান',
    dealer_shop_name: 'M/S Rahman Enterprise',
    upazila: 'ঠাকুরগাঁও সদর',
    district: 'ঠাকুরগাঁও',
    zone_id: 'upz_435',
    zone_name: 'Thakurgaon Sadar Zone',
    zone_name_bn: 'ঠাকুরগাঁও সদর জোন',
    rating: 5.0,
    reviewsCount: 48,
    reviews: [
      { id: 'rev-0', userName: 'কামরুল হাসান', rating: 5, comment: 'চমৎকার খাঁটি সরিষার তেল। দ্রুত ডেলিভারি পেলাম।', date: '২০২৬-০৮-১০', verifiedPurchase: true }
    ],
    variants: [],
    vendorId: 'ven-1',
    vendorShopName: 'M/S Rahman Enterprise',
    marketBazar: 'পুরাতন বাসস্ট্যান্ড মার্কেট',
    isApproved: true,
    createdAt: '2026-08-01'
  },
  {
    id: 'prod-1',
    title: 'Teer Premium Fortified Soybean Oil 5 Liter',
    titleBn: 'তীর প্রিমিয়াম ফর্টিফাইড সয়াবিন তেল ৫ লিটার',
    slug: 'teer-soybean-oil-5l',
    categoryId: 'cat-grocery',
    categoryName: 'Grocery & Food',
    subCategory: 'Cooking Oil',
    brandId: 'brand-3',
    brandName: 'Teer',
    sku: 'GBBD-TEER-001',
    barcode: '88091234001',
    images: [
      'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=800'
    ],
    videoUrl: 'https://www.youtube.com/watch?v=dummy-oil-video',
    description: 'Teer Fortified Soybean Oil enriched with Vitamin A & D for healthy daily cooking.',
    descriptionBn: 'ভিটামিন এ ও ডি সমৃদ্ধ তীর বিশুদ্ধ সয়াবিন তেল। দৈনন্দিন পরিবারের স্বাস্থ্যকর রান্নার নির্ভরযোগ্য পছন্দ।',
    mrp: 920,
    dealerPrice: 830,
    profit: 90,
    adminCost: 18,
    netProfit: 72,
    vendorCost: 810,
    serviceCharge: 60,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 920,
    discountPrice: 920,
    couponDiscount: 20,
    cashbackPct: 3,
    pvMode: 'auto',
    pvValue: 7.2,
    pvPoint: 7.2,
    weightKg: 5.2,
    dimensionsCm: '20x20x35',
    codAvailable: true,
    unit: 'L',
    tags: ['Soybean Oil', 'Cooking Oil', 'Teer', 'Essential Grocery'],
    stock: 150,
    warehouseId: 'DLR-SAID-002',
    warehouseName: 'M/S Karim Traders',
    tradeLicenseBusinessName: 'M/S Karim Traders',
    tradeLicenseNumber: 'TRAD/NIL/2026/4821',
    dealerOwnerName: 'মোঃ করিম উদ্দিন',
    dealer_id: 'DLR-SAID-002',
    dealer_name: 'মোঃ করিম উদ্দিন',
    dealer_shop_name: 'M/S Karim Traders',
    upazila: 'সৈয়দপুর',
    district: 'নীলফামারী',
    zone_id: 'upz_425',
    zone_name: 'Saidpur Zone',
    zone_name_bn: 'সৈয়দপুর জোন',
    rating: 4.9,
    reviewsCount: 52,
    reviews: [
      { id: 'rev-1', userName: 'মো হাসনাত', rating: 5, comment: 'অরিজিনাল তীর তেল, সঠিক সময়ে ডেলিভারি পেয়েছি।', date: '২০২৬-০৮-০৫', verifiedPurchase: true }
    ],
    variants: [
      { id: 'v-1-1', name: '5 Liter Jar', sku: 'GBBD-TEER-001-5L', barcode: '88091234001-5L', price: 920, stock: 150, weightKg: 5.2, dimensionsCm: '20x20x35' }
    ],
    vendorId: 'DLR-SAID-002',
    vendorShopName: 'M/S Karim Traders',
    marketBazar: 'রেলওয়ে বাজার সৈয়দপুর',
    isApproved: true,
    createdAt: '2026-06-15'
  },
  {
    id: 'prod-2',
    title: 'Fresh Premium Nazirshail Rice 25kg Bag',
    titleBn: 'ফ্রেশ প্রিমিয়াম নাজিরশাইল চাল ২৫ কেজি বস্তা',
    slug: 'fresh-nazirshail-rice-25kg',
    categoryId: 'cat-grocery',
    categoryName: 'Grocery & Food',
    subCategory: 'Rice',
    brandId: 'brand-2',
    brandName: 'Fresh',
    sku: 'GBBD-FRESH-RICE-002',
    barcode: '88091234002',
    images: [
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Fresh Brand Premium Auto Rice, clean, long grain Nazirshail rice.',
    descriptionBn: 'সরাসরি ফ্রেশ অটো মিল থেকে প্রাপ্ত ঝরঝরে লম্বা দানার প্রিমিয়াম নাজিরশাইল চাল। কঙ্কর ও ময়লামুক্ত।',
    mrp: 2150,
    dealerPrice: 1920,
    profit: 230,
    adminCost: 46,
    netProfit: 184,
    vendorCost: 1900,
    serviceCharge: 60,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 2150,
    discountPrice: 2150,
    pvMode: 'auto',
    pvValue: 18.4,
    pvPoint: 18.4,
    weightKg: 25.0,
    codAvailable: true,
    unit: 'kg',
    tags: ['Rice', 'Nazirshail', 'Fresh', 'Bulk Rice'],
    stock: 80,
    warehouseId: 'DLR-DIN-003',
    warehouseName: 'M/S Noor Traders',
    tradeLicenseBusinessName: 'M/S Noor Traders',
    tradeLicenseNumber: 'TRAD/DIN/2026/3310',
    dealerOwnerName: 'মোঃ নূরুল ইসলাম',
    dealer_id: 'DLR-DIN-003',
    dealer_name: 'মোঃ নূরুল ইসলাম',
    dealer_shop_name: 'M/S Noor Traders',
    upazila: 'দিনাজপুর সদর',
    district: 'দিনাজপুর',
    zone_id: 'upz_408',
    zone_name: 'Dinajpur Sadar Zone',
    zone_name_bn: 'দিনাজপুর সদর জোন',
    rating: 4.8,
    reviewsCount: 38,
    vendorId: 'DLR-DIN-003',
    vendorShopName: 'M/S Noor Traders',
    marketBazar: 'বাহাদুর বাজার দিনাজপুর',
    isApproved: true,
    variants: [],
    createdAt: '2026-06-18'
  },
  {
    id: 'prod-3',
    title: 'Pran Frooto Mango Juice 1 Liter',
    titleBn: 'প্রাণ ফ্রুটো ম্যাঙ্গো জুস ১ লিটার',
    slug: 'pran-frooto-mango-juice-1l',
    categoryId: 'cat-beverage',
    categoryName: 'Beverage',
    subCategory: 'Juice',
    brandId: 'brand-1',
    brandName: 'PRAN',
    sku: 'GBBD-PRAN-003',
    barcode: '88091234003',
    images: [
      'https://images.unsplash.com/photo-1546173159-315724a31696?auto=format&fit=crop&q=80&w=800'
    ],
    description: 'Refreshing real Rajshahi mango fruit juice drink by PRAN.',
    descriptionBn: 'রাজশাহীর পাকা আম দিয়ে তৈরি প্রাণ ফ্রুটো রিয়েল ম্যাঙ্গো রিফ্রেশিং জুস।',
    mrp: 120,
    dealerPrice: 95,
    profit: 25,
    adminCost: 5,
    netProfit: 20,
    vendorCost: 90,
    serviceCharge: 60,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 120,
    discountPrice: 120,
    pvMode: 'auto',
    pvValue: 2,
    pvPoint: 2,
    weightKg: 1.1,
    codAvailable: true,
    unit: 'L',
    tags: ['Beverage', 'Pran', 'Mango Juice'],
    stock: 200,
    warehouseId: 'DLR-CTG-005',
    warehouseName: 'M/S Al-Madina Enterprise',
    tradeLicenseBusinessName: 'M/S Al-Madina Enterprise',
    tradeLicenseNumber: 'TRAD/CCC/2026/1029',
    dealerOwnerName: 'আবুল কালাম',
    dealer_id: 'DLR-CTG-005',
    dealer_name: 'আবুল কালাম',
    dealer_shop_name: 'M/S Al-Madina Enterprise',
    upazila: 'কোতোয়ালী',
    district: 'চট্টগ্রাম',
    zone_id: 'upz_201',
    zone_name: 'Kotwali Zone',
    zone_name_bn: 'কোতোয়ালী জোন',
    rating: 4.7,
    reviewsCount: 29,
    vendorId: 'DLR-CTG-005',
    vendorShopName: 'M/S Al-Madina Enterprise',
    marketBazar: 'কোতোয়ালী নিউ মার্কেট লেন',
    isApproved: true,
    variants: [],
    createdAt: '2026-06-20'
  },
  {
    id: 'prod-clothing-tshirt',
    title: 'TOMSHOPBD Premium Organic Cotton T-Shirt',
    titleBn: 'টমশপবিডি প্রিমিয়াম অর্গানিক কটন টি-শার্ট',
    slug: 'tomshopbd-premium-organic-cotton-tshirt',
    categoryId: 'cat-clothing-fashion',
    categoryName: 'Clothing & Fashion',
    subCategory: 'T-Shirt',
    brandId: 'brand-other',
    brandName: 'TOMSHOPBD Fashion',
    sku: 'TSBD-TSHIRT-01',
    barcode: '88091234999',
    images: [
      'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'
    ],
    description: '100% premium combed organic cotton round-neck t-shirt with soft fabric and durable stitching.',
    descriptionBn: '১০০% প্রিমিয়াম কম্বড অর্গানিক কটন রাউন্ড-নেক টি-শার্ট। নরম ফেব্রিক, দীর্ঘস্থায়ী স্টিচিং ও কালার গ্যারান্টি।',
    mrp: 650,
    dealerPrice: 480,
    profit: 170,
    adminCost: 34,
    netProfit: 136,
    vendorCost: 450,
    serviceCharge: 30,
    deliveryCost: 60,
    vatTax: 5,
    discount: 0,
    discount_percent: 0,
    discount_scope: 'global',
    discount_source: 'Global',
    isDiscountOverridden: false,
    campaignPrice: 650,
    discountPrice: 650,
    pvMode: 'auto',
    pvValue: 13.6,
    pvPoint: 13.6,
    weightKg: 0.25,
    codAvailable: true,
    unit: 'pcs',
    tags: ['Clothing', 'Fashion', 'T-Shirt', 'Cotton', 'Men Fashion'],
    stock: 49,
    warehouseId: 'DLR-DHK-004',
    warehouseName: 'M/S Chowdhury & Sons',
    tradeLicenseBusinessName: 'M/S Chowdhury & Sons',
    tradeLicenseNumber: 'TRAD/DSCC/2026/8821',
    dealerOwnerName: 'কবির হোসেন চৌধুরী',
    dealer_id: 'DLR-DHK-004',
    dealer_name: 'কবির হোসেন চৌধুরী',
    dealer_shop_name: 'M/S Chowdhury & Sons',
    upazila: 'মিরপুর',
    district: 'ঢাকা',
    zone_id: 'upz_101',
    zone_name: 'Mirpur Zone',
    zone_name_bn: 'মিরপুর জোন',
    rating: 5.0,
    reviewsCount: 18,
    vendorId: 'DLR-DHK-004',
    vendorShopName: 'M/S Chowdhury & Sons',
    marketBazar: 'মিরপুর ১০ গোলচত্বর',
    isApproved: true,
    variants: [
      {
        id: 'var-tsbd-blk-s-220g',
        sku: 'TSBD-TSHIRT-01-BLK-S-220G',
        name: 'Black - S - 220g',
        color: 'Black',
        size: 'S',
        weight: '220g',
        weightGrams: 220,
        weightKg: 0.22,
        stock: 10,
        stockQuantity: 10,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'var-tsbd-blk-m-250g',
        sku: 'TSBD-TSHIRT-01-BLK-M-250G',
        name: 'Black - M - 250g',
        color: 'Black',
        size: 'M',
        weight: '250g',
        weightGrams: 250,
        weightKg: 0.25,
        stock: 10,
        stockQuantity: 10,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'var-tsbd-blk-l-270g',
        sku: 'TSBD-TSHIRT-01-BLK-L-270G',
        name: 'Black - L - 270g',
        color: 'Black',
        size: 'L',
        weight: '270g',
        weightGrams: 270,
        weightKg: 0.27,
        stock: 5,
        stockQuantity: 5,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'var-tsbd-wht-s-220g',
        sku: 'TSBD-TSHIRT-01-WHT-S-220G',
        name: 'White - S - 220g',
        color: 'White',
        size: 'S',
        weight: '220g',
        weightGrams: 220,
        weightKg: 0.22,
        stock: 8,
        stockQuantity: 8,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'var-tsbd-wht-m-250g',
        sku: 'TSBD-TSHIRT-01-WHT-M-250G',
        name: 'White - M - 250g',
        color: 'White',
        size: 'M',
        weight: '250g',
        weightGrams: 250,
        weightKg: 0.25,
        stock: 8,
        stockQuantity: 8,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'
      },
      {
        id: 'var-tsbd-wht-l-270g',
        sku: 'TSBD-TSHIRT-01-WHT-L-270G',
        name: 'White - L - 270g',
        color: 'White',
        size: 'L',
        weight: '270g',
        weightGrams: 270,
        weightKg: 0.27,
        stock: 8,
        stockQuantity: 8,
        price: 480,
        mrp: 650,
        priceAdjustment: 0,
        isAvailable: true,
        image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800'
      }
    ],
    createdAt: '2026-06-25'
  }
];
