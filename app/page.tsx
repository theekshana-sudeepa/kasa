'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from './lib/store/chat-store';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import TypingIndicator from './components/TypingIndicator';
import ProductCarousel from './components/ProductCarousel';
import QuickReplies from './components/QuickReplies';
import DeliveryCard from './components/DeliveryCard';
import OrderCard from './components/OrderCard';
import TrackingCard from './components/TrackingCard';
import CartBadge from './components/CartBadge';
import CartDrawer from './components/CartDrawer';
import type { ChatMessage, Product } from './lib/mcp/types';
import { parseAssistantResponse } from './lib/ai/response-parser';

export default function Home() {
  const {
    messages,
    cart,
    language,
    giftMode,
    deliveryCity,
    deliveryDate,
    isLoading,
    sessionId,
    addMessage,
    setLoading,
    addToCart,
    setCart,
    toggleGiftMode,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          sessionId,
          language,
          cart,
          giftMode,
          deliveryCity,
          deliveryDate,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      // Create initial empty assistant message
      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      });

        // Poll server parsed endpoint periodically to pick up MCP results or post-LLM tool execution
        let parsedFound = false;
        const pollInterval = 700;
        const pollId = setInterval(async () => {
          try {
            const parsedRes = await fetch(`/api/chat/parsed?sessionId=${sessionId}`);
            if (!parsedRes.ok) return;
            const parsedJson = await parsedRes.json();
            const parsedResponse = parsedJson.parsed;
            if (parsedResponse && !parsedFound) {
              parsedFound = true;
              useChatStore.setState((state) => ({
                messages: state.messages.map((m) =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: parsedResponse.text || '',
                        products: parsedResponse.products,
                        quickReplies: parsedResponse.quickReplies,
                        delivery: parsedResponse.delivery,
                        order: parsedResponse.order,
                        tracking: parsedResponse.tracking,
                        comparison: parsedResponse.comparison,
                      }
                    : m
                ),
              }));

              if (parsedResponse.cartUpdate && parsedResponse.cartUpdate.length > 0) {
                setCart(parsedResponse.cartUpdate);
              }
              clearInterval(pollId as any);
            }
          } catch (err) {
            // ignore transient errors
          }
        }, pollInterval);

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        // Parse accumulated text and update message in real-time
        const parsedResponse = parseAssistantResponse(fullText);

        useChatStore.setState((state) => ({
          messages: state.messages.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: parsedResponse.text,
                  products: parsedResponse.products,
                  quickReplies: parsedResponse.quickReplies,
                  delivery: parsedResponse.delivery,
                  order: parsedResponse.order,
                  tracking: parsedResponse.tracking,
                  comparison: parsedResponse.comparison,
                }
              : m
          ),
        }));

        if (parsedResponse.cartUpdate && parsedResponse.cartUpdate.length > 0) {
          setCart(parsedResponse.cartUpdate);
        }
      }
      // stop polling parsed endpoint when stream finished
      try { clearInterval(pollId as any); } catch {}
    } catch (error) {
      console.error('Chat error:', error);
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Oops! I'm having trouble connecting. Please make sure the OPENAI_API_KEY is set in your .env.local file, then try again! 🙏",
        timestamp: Date.now(),
        quickReplies: ['Try again', 'Browse categories'],
      });
    } finally {
      setLoading(false);
    }
  }, [isLoading, sessionId, language, cart, giftMode, deliveryCity, deliveryDate, addMessage, setLoading, setCart]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart({
      product_id: product.product_id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image_url: product.image_url,
    });
  };

  const handleViewDetails = (product: Product) => {
    sendMessage(`Tell me more about "${product.name}"`);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const hasMessages = messages.length > 0;

  const handleCheckoutFlow = async () => {
    if (cart.length === 0) return;

    try {
      setLoading(true);

      // Sync cart to server to compute total
      const syncRes = await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      });
      const syncJson = await syncRes.json();

      // If delivery info missing, ask user
      let city = deliveryCity;
      let date = deliveryDate;
      if (!city) city = window.prompt('Enter delivery city (for delivery check):') || '';
      if (!date) date = window.prompt('Enter delivery date (YYYY-MM-DD):') || '';

      // Check delivery for first product
      const first = cart[0];
      const checkRes = await fetch('/api/delivery/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, date, product_id: first.product_id }),
      });
      const checkJson = await checkRes.json();

      if (checkJson.result && checkJson.result.available === false) {
        // Notify user via assistant message
        addMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: `Delivery unavailable to ${city} on ${date} for ${first.name}. Please choose another date or city.`, timestamp: Date.now(), });
        return;
      }

      // Collect recipient details
      const recipient_name = window.prompt('Recipient name:') || 'Recipient';
      const recipient_phone = window.prompt('Recipient phone:') || '0770000000';
      const recipient_address = window.prompt('Recipient address:') || 'Address';
      const sender_name = window.prompt('Your name:') || 'Sender';
      const sender_email = window.prompt('Your email:') || 'sender@example.com';
      const gift_message = window.prompt('Gift message (optional):') || '';

      // Create order
      const orderRes = await fetch('/api/order/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
          delivery_city: city,
          delivery_date: date,
          recipient_name,
          recipient_phone,
          recipient_address,
          sender_name,
          sender_email,
          gift_message,
        }),
      });

      const orderJson = await orderRes.json();

      if (orderJson.result) {
        const orderText = `Order created: ${JSON.stringify(orderJson.result)}`;
        addMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: orderText, timestamp: Date.now(), });
        // Clear cart locally
        setCart([]);
      } else {
        addMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: `Order failed: ${orderJson.error || 'unknown'}`, timestamp: Date.now(), });
      }
    } catch (err) {
      console.error('Checkout error', err);
      addMessage({ id: `assistant-${Date.now()}`, role: 'assistant', content: 'Checkout failed — please try again later.', timestamp: Date.now(), });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Header />

      <div className="chat-area">
        <div className="messages-container">
          {!hasMessages && (
            <WelcomeScreen onChipClick={(text) => sendMessage(text)} />
          )}

          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.role === 'user' ? (
                <div className="message message-user">
                  <div>
                    <div className="message-bubble">
                      <div className="message-content">{msg.content}</div>
                    </div>
                    <div className="message-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="message message-assistant">
                    <div className="message-avatar">🪞</div>
                    <div>
                      <div className="message-bubble">
                        <div className="message-content">
                          {msg.content.split('\n').filter(Boolean).map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                          {isLoading && messages[messages.length - 1]?.id === msg.id && !msg.content && (
                            <span style={{ color: 'var(--kasa-text-3)' }}>Thinking...</span>
                          )}
                        </div>
                      </div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <ProductCarousel
                      products={msg.products}
                      onAddToCart={handleAddToCart}
                      onViewDetails={handleViewDetails}
                    />
                  )}

                  {msg.delivery && (
                    <div style={{ paddingLeft: '42px' }}>
                      <DeliveryCard delivery={msg.delivery} />
                    </div>
                  )}

                  {msg.order && (
                    <div style={{ paddingLeft: '42px' }}>
                      <OrderCard order={msg.order} />
                    </div>
                  )}

                  {msg.tracking && (
                    <div style={{ paddingLeft: '42px' }}>
                      <TrackingCard tracking={msg.tracking} />
                    </div>
                  )}

                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <QuickReplies
                      replies={msg.quickReplies}
                      onSelect={(reply) => sendMessage(reply)}
                    />
                  )}
                </div>
              )}
            </div>
          ))}

          {isLoading && !messages.some(m => m.role === 'assistant' && m.id.startsWith('assistant-') && !m.content) && (
            <TypingIndicator />
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input-field"
            placeholder={
              language === 'si' ? 'ඔබේ පණිවිඩය ටයිප් කරන්න...'
              : language === 'tanglish' ? 'Type karanna...'
              : 'Type your message...'
            }
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <div className="chat-input-actions">
          <button className="chat-input-action" onClick={() => { toggleGiftMode(); }}>
            {giftMode ? '🎁 Gift ON' : '🎁 Gift Mode'}
          </button>
          <button className="chat-input-action" onClick={() => sendMessage('Track my order')}>
            📦 Track
          </button>
          <button className="chat-input-action" onClick={() => setCartDrawerOpen(true)}>
            🛒 Cart ({cart.reduce((s, i) => s + i.quantity, 0)})
          </button>
        </div>
      </div>

      <CartBadge onClick={() => setCartDrawerOpen(true)} />
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        onCheckout={() => { setCartDrawerOpen(false); handleCheckoutFlow(); }}
      />
    </div>
  );
}
