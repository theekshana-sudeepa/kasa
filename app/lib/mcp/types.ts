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
  // v4.0 — Product Intelligence
  kasaPick?: boolean;
  matchReason?: string;
  rankScore?: number;
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

// ── v4.0 — Smart Suggestion System ──────────────────────
export interface SmartSuggestion {
  text: string;
  emoji: string;
  type: 'action' | 'search' | 'navigate';
}

// ── v4.0 — Conversation Memory ──────────────────────────
export interface ConversationMemory {
  deliveryCity: string | null;
  deliveryDate: string | null;
  budget: { max: number; currency: string } | null;
  occasion: string | null;
  giftTarget: string | null;
  preferredCategories: string[];
  rejectedProducts: string[];
  mentionedNames: string[];
  senderInfo: { name: string; email: string } | null;
  recipientInfo: { name: string; phone: string; address: string } | null;
  lastSearchQueries: string[];
  conversationTone: string;
  userName?: string;
}

// ── v4.0 — Ghost Cart (Predictive) ─────────────────────
export interface GhostCartItem {
  product_id: string;
  name: string;
  price: number;
  currency: string;
  image_url: string;
  url: string;
  in_stock: boolean;
  prediction_confidence: number;
  predicted_at: number;
  delivery_precheck?: {
    city: string;
    available: boolean;
    fee: number;
  };
}

// ── v4.0 — Session Data ─────────────────────────────────
export interface SessionData {
  id: string;
  createdAt: number;
  lastActiveAt: number;
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  memory: ConversationMemory;
  ghostCart: GhostCartItem[];
  lastMood: string;
  lastIntent: string;
  messageCount: number;
}

// ── v4.0 — MCP Telemetry ────────────────────────────────
export interface MCPTelemetry {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTimeMs: number;
  lastResponseTimeMs: number;
  circuitBreakerOpen: boolean;
}

export type Mood = 'neutral' | 'warm' | 'excited' | 'urgent' | 'romantic' | 'calm';

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
  // v4.0
  mood?: Mood;
  smartSuggestions?: SmartSuggestion[];
}
