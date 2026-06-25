import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, CartItem, Language, Mood, SmartSuggestion } from '../mcp/types';

export interface OccasionMemory {
  person: string;
  type: string;
  date: string;
}

export interface UserMemory {
  lastDeliveryCity?: string | null;
  lastOrderDate?: string;
  upcomingOccasions?: OccasionMemory[];
  hasOrderedBefore?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  cart: CartItem[];
  language: Language;
  giftMode: boolean;
  deliveryCity: string | null;
  deliveryDate: string | null;
  isLoading: boolean;
  sessionId: string;
  userMemory: UserMemory;
  ghostContext: any;
  // v4.0
  mood: Mood;
  smartSuggestions: SmartSuggestion[];
  voiceMode: boolean;

  addMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setLanguage: (lang: Language) => void;
  toggleGiftMode: () => void;
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setDeliveryCity: (city: string) => void;
  setDeliveryDate: (date: string) => void;
  setCart: (cart: CartItem[]) => void;
  updateUserMemory: (memory: Partial<UserMemory>) => void;
  setGhostContext: (context: any) => void;
  // v4.0
  setMood: (mood: Mood) => void;
  setSmartSuggestions: (suggestions: SmartSuggestion[]) => void;
  toggleVoiceMode: () => void;
  newChat: () => void;
}

// Use a fixed session ID to avoid SSR/client mismatch
// It will be unique per tab since the store is created fresh each time
const SESSION_ID = 'kasa-' + Math.random().toString(36).slice(2, 10);

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      cart: [],
      language: 'en',
      giftMode: false,
      deliveryCity: null,
      deliveryDate: null,
      isLoading: false,
      sessionId: SESSION_ID,
      userMemory: {},
      ghostContext: null,
      mood: 'neutral' as Mood,
      smartSuggestions: [],
      voiceMode: false,

      addMessage: (msg) =>
        set((state) => ({
          messages: [...state.messages, msg],
        })),

  updateLastAssistantMessage: (content) =>
    set((state) => {
      const messages = [...state.messages];
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          messages[i] = { ...messages[i], content };
          break;
        }
      }
      return { messages };
    }),

  setLoading: (loading) => set({ isLoading: loading }),

  setLanguage: (lang) => set({ language: lang }),

  toggleGiftMode: () =>
    set((state) => ({ giftMode: !state.giftMode })),

  addToCart: (item) =>
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (c) => c.product_id === item.product_id
      );

      if (existingIndex >= 0) {
        const updatedCart = [...state.cart];
        updatedCart[existingIndex] = {
          ...updatedCart[existingIndex],
          quantity: updatedCart[existingIndex].quantity + item.quantity,
        };
        return { cart: updatedCart };
      }

      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter((item) => item.product_id !== productId),
    })),

  updateCartQuantity: (productId, quantity) =>
    set((state) => {
      if (quantity <= 0) {
        return {
          cart: state.cart.filter((item) => item.product_id !== productId),
        };
      }

      return {
        cart: state.cart.map((item) =>
          item.product_id === productId ? { ...item, quantity } : item
        ),
      };
    }),

  clearCart: () => set({ cart: [] }),

  setDeliveryCity: (city) => set({ deliveryCity: city }),

  setDeliveryDate: (date) => set({ deliveryDate: date }),

  setCart: (cart) => set({ cart }),

  updateUserMemory: (memory) =>
    set((state) => ({
      userMemory: { ...state.userMemory, ...memory },
    })),

  setGhostContext: (context) => set({ ghostContext: context }),

  setMood: (mood) => set({ mood }),

  setSmartSuggestions: (suggestions) => set({ smartSuggestions: suggestions }),

  toggleVoiceMode: () => set((state) => ({ voiceMode: !state.voiceMode })),

  newChat: () => set({
    messages: [],
    isLoading: false,
    mood: 'neutral' as Mood,
    smartSuggestions: [],
    deliveryCity: null,
    deliveryDate: null,
    giftMode: false,
    sessionId: 'kasa-' + Math.random().toString(36).slice(2, 10),
  }),
    }),
    {
      name: 'kasa-storage',
      // We only want to persist the userMemory, not active session stuff like current cart/messages
      partialize: (state) => ({ userMemory: state.userMemory }),
    }
  )
);
