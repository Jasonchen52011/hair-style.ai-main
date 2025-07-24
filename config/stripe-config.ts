// Stripe产品配置
export const STRIPE_PRODUCTS = {
  // "prod_SikhNUm5QhhQ7x": { // 测试产品ID
  "prod_SjPvsJrHNSaBOZ": {
    id: "prod_SjPvsJrHNSaBOZ",
    name: "50 Credits",
    description: "Perfect for trying out",
    price: 5.00,
    credits: 50,
    features: [
      "5 AI hairstyle generations",
      "High-quality results",
      "Credits never expire",
    ],
  },
  // "prod_SikttkRGqAS13E": { // 测试产品ID
  "prod_SjPvk5h4hq51yu": {
    id: "prod_SjPvk5h4hq51yu", 
    name: "100 Credits",
    description: "Great for regular use",
    price: 9,
    credits: 100,
    features: [
      "10 AI hairstyle generations",
      "All hairstyle options", 
      "High-quality results",
      "Credits never expire",
      "10% savings",
    ],
  },
  // "prod_Sikk0qfbCozkzi": { // 测试产品ID
  "prod_SjPvNGMg9hBfx5": {
    id: "prod_SjPvNGMg9hBfx5",
    name: "400 Credits",
    description: "Best value for enthusiasts",
    price: 32.00,
    credits: 400,
    features: [
      "40 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results", 
      "Credits never expire",
      "20% savings",
    ],
    popular: true, // Most Popular
  },
  // "prod_SiknTEhiFiuKsA": { // 测试产品ID
  "prod_SjPvsVYq2Ftv2j": {
    id: "prod_SjPvsVYq2Ftv2j",
    name: "800 Credits", 
    description: "For professionals",
    price: 56.00,
    credits: 800,
    features: [
      "80 AI hairstyle generations",
      "All hairstyle options",
      "High-quality results",
      "Credits never expire", 
      "30% savings",
      "Priority support",
    ],
  },
};

// 按价格排序的产品数组
export const STRIPE_PRODUCTS_ARRAY = [
  STRIPE_PRODUCTS["prod_SjPvsJrHNSaBOZ"],  // $5.00 - 50 Credits
  STRIPE_PRODUCTS["prod_SjPvk5h4hq51yu"],  // $9.50 - 100 Credits  
  STRIPE_PRODUCTS["prod_SjPvNGMg9hBfx5"],  // $32.00 - 400 Credits (Most Popular)
  STRIPE_PRODUCTS["prod_SjPvsVYq2Ftv2j"],  // $56.00 - 800 Credits
];

// 获取产品信息的辅助函数
export function getStripeProduct(productId: string) {
  return STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS];
}

// 验证产品ID是否有效
export function isValidStripeProductId(productId: string): boolean {
  return productId in STRIPE_PRODUCTS;
} 