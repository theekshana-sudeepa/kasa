export interface Product {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  url: string;
  in_stock: boolean;
  description?: string;
  category?: string;
  rating?: number;
  variants?: string[];
}

export interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url: string;
}

export interface DeliveryInfo {
  city: string;
  date: string;
  available: boolean;
  fee: number;
  perishable_warning: boolean;
}

export interface OrderResult {
  order_number: string;
  payment_url: string;
  total: number;
  currency: string;
}

export interface TrackingStep {
  status: string;
  timestamp: string;
  description: string;
  completed: boolean;
}

export interface TrackingInfo {
  order_number: string;
  status: string;
  items: Array<{ name: string; quantity: number }>;
  recipient: string;
  timeline: TrackingStep[];
}

export interface City {
  name: string;
  aliases?: string[];
}

export interface Category {
  name: string;
  url: string;
  slug?: string;
  emoji?: string;
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}

export type Language = 'en' | 'si' | 'tanglish';

export interface SessionState {
  id: string;
  language: Language;
  cart: CartItem[];
  gift_mode: boolean;
  delivery_city: string | null;
  delivery_date: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  products?: Product[];
  delivery?: DeliveryInfo;
  order?: OrderResult;
  tracking?: TrackingInfo;
  comparison?: Product[];
  quickReplies?: string[];
  cartUpdate?: CartItem[];
  categories?: Category[];
  checkoutForm?: boolean;
  showCartSummary?: boolean;
  tenSecondDecision?: Product;
  groupGift?: { goal: number; productName: string };
  giftMessage?: string;
}
