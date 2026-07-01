'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChatStore } from './lib/store/chat-store';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import CheckoutForm from './components/CheckoutForm';
import ComparisonTable from './components/ComparisonTable';
import CartSummary from './components/CartSummary';
import TypingIndicator from './components/TypingIndicator';
import ProductCarousel from './components/ProductCarousel';
import QuickReplies from './components/QuickReplies';
import DeliveryCard from './components/DeliveryCard';
import OrderCard from './components/OrderCard';
import TrackingCard from './components/TrackingCard';
import CartBadge from './components/CartBadge';
import CartDrawer from './components/CartDrawer';
import CategoryGrid from './components/CategoryGrid';
import TenSecondDecision from './components/TenSecondDecision';
import GroupGiftLink from './components/GroupGiftLink';
import GiftMessageCard from './components/GiftMessageCard';
import MoodBackground from './components/MoodBackground';
import VoiceInput from './components/VoiceInput';
import SmartSuggestions from './components/SmartSuggestions';
import type { ChatMessage, Mood } from './lib/mcp/types';
import { parseAssistantResponse } from './lib/ai/response-parser';
import { ChevronDown, Gift, Package, LayoutGrid, ShoppingCart } from 'lucide-react';
import KasaAvatar from './components/KasaAvatar';
import { t } from './lib/i18n/translations';

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
    mood,
    addMessage,
    setLoading,
    setCart,
    toggleGiftMode,
    setMood,
    setSmartSuggestions,
  } = useChatStore();


  const [input, setInput] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Show/hide scroll-to-bottom button
  useEffect(() => {
    const chatArea = chatAreaRef.current;
    if (!chatArea) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = chatArea;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShowScrollBtn(!isNearBottom && messages.length > 2);
    };

    chatArea.addEventListener('scroll', handleScroll);
    return () => chatArea.removeEventListener('scroll', handleScroll);
  }, [messages.length]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

      addMessage({
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
      });

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;

        const parsedResponse = parseAssistantResponse(fullText);

        // v4.0 — Sync mood from AI response
        if (parsedResponse.mood) {
          setMood(parsedResponse.mood);
        }

        // v4.0 — Sync smart suggestions
        if (parsedResponse.smartSuggestions && parsedResponse.smartSuggestions.length > 0) {
          setSmartSuggestions(parsedResponse.smartSuggestions);
        }

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
                  categories: parsedResponse.categories,
                  checkoutForm: parsedResponse.checkoutForm,
                  giftMessage: parsedResponse.giftMessage,
                  mood: parsedResponse.mood,
                  smartSuggestions: parsedResponse.smartSuggestions,
                }
              : m
          ),
        }));

        if (parsedResponse.cartUpdate && parsedResponse.cartUpdate.length > 0) {
          setCart(parsedResponse.cartUpdate);
        }
      }

    } catch {
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Aiyo! Something went wrong on my end. Make sure an API key is set in .env.local, or just try again — I'm resilient like that!",
        timestamp: Date.now(),
        quickReplies: ['Try again', 'Browse categories'],
      });
    } finally {
      setLoading(false);
    }
  }, [isLoading, sessionId, language, cart, giftMode, deliveryCity, deliveryDate, addMessage, setLoading, setCart, setMood, setSmartSuggestions]);

  const handleSend = () => sendMessage(input);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };


  const handleNewChat = () => {
    useChatStore.getState().newChat();
    setMood('neutral' as Mood);
    setSmartSuggestions([]);
  };

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Render markdown-like text (bold, italic, lists, links)
  const renderContent = (text: string) => {
    if (!text) return null;
    
    return text.split('\n').filter(Boolean).map((line, i) => {
      // Process inline formatting
      let processed: React.ReactNode = line;
      
      // Bold **text**
      const parts: React.ReactNode[] = [];
      const boldRegex = /\*\*(.+?)\*\*/g;
      let lastIdx = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIdx) {
          parts.push(line.slice(lastIdx, match.index));
        }
        parts.push(<strong key={`b-${i}-${match.index}`}>{match[1]}</strong>);
        lastIdx = match.index + match[0].length;
      }
      
      if (parts.length > 0) {
        if (lastIdx < line.length) parts.push(line.slice(lastIdx));
        processed = <>{parts}</>;
      }
      
      // Bullet points
      if (line.startsWith('• ') || line.startsWith('- ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <span style={{ color: 'var(--kasa-primary-400)', flexShrink: 0 }}>•</span>
            <span>{typeof processed === 'string' ? processed.slice(2) : processed}</span>
          </div>
        );
      }
      
      return <p key={i}>{processed}</p>;
    });
  };

  const hasMessages = messages.length > 0;

  const handleCheckoutFlow = () => {
    if (cart.length === 0) return;

    const cartSummary = cart
      .map((item) => `• ${item.name} x${item.quantity} — Rs. ${(item.price * item.quantity).toLocaleString()}`)
      .join('\n');
    const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const checkoutMessage = deliveryCity
      ? `I'd like to checkout with these items:\n${cartSummary}\nTotal: Rs. ${total.toLocaleString()}\nDelivery to: ${deliveryCity}${deliveryDate ? ` on ${deliveryDate}` : ''}`
      : `I'd like to checkout with these items:\n${cartSummary}\nTotal: Rs. ${total.toLocaleString()}`;

    sendMessage(checkoutMessage);
  };

  return (
    <div className="app-container">
      <MoodBackground mood={mood} />
      <Header onNewChat={handleNewChat} />

      <div className="chat-area" ref={chatAreaRef}>
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
                    <KasaAvatar />
                    <div>
                      <div className="message-bubble">
                        <div className="message-content">
                          {renderContent(msg.content)}
                          {isLoading && messages[messages.length - 1]?.id === msg.id && !msg.content && (
                            <span style={{ color: 'var(--kasa-text-3)', fontStyle: 'italic' }}>Thinking…</span>
                          )}
                        </div>
                      </div>
                      <div className="message-time">{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>

                  {msg.products && msg.products.length > 0 && (
                    <ProductCarousel products={msg.products} />
                  )}

                  {msg.comparison && msg.comparison.length > 0 && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px' }}>
                      <ComparisonTable products={msg.comparison} />
                    </div>
                  )}

                  {msg.tenSecondDecision && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px', margin: '16px 0' }}>
                      <TenSecondDecision 
                        product={msg.tenSecondDecision} 
                        onDecisionMade={(accepted) => {
                          if (accepted) {
                            sendMessage(`Awesome, I'll take it!`);
                          } else {
                            sendMessage(`No thanks, show me something else.`);
                          }
                        }}
                      />
                    </div>
                  )}

                  {msg.groupGift && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px', margin: '16px 0' }}>
                      <GroupGiftLink goal={msg.groupGift.goal} productName={msg.groupGift.productName} />
                    </div>
                  )}

                  {msg.giftMessage && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px', margin: '12px 0' }}>
                      <GiftMessageCard message={msg.giftMessage} />
                    </div>
                  )}

                  {msg.delivery && (
                    <div style={{ paddingLeft: '42px' }}>
                      <DeliveryCard delivery={msg.delivery} />
                    </div>
                  )}

                  {msg.showCartSummary && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px' }}>
                      <CartSummary />
                    </div>
                  )}

                  {msg.checkoutForm && (
                    <div style={{ paddingLeft: '42px', paddingRight: '42px' }}>
                      <CheckoutForm onSubmit={(details) => {
                        const { name, phone, address, senderName, senderEmail } = details;
                        sendMessage(`Deliver to ${name}, ${phone}, ${address} | Sender: ${senderName}, ${senderEmail}`);
                      }} />
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

                  {msg.categories && msg.categories.length > 0 && (
                    <CategoryGrid
                      categories={msg.categories}
                      onSelect={(categoryName) => sendMessage(`Show me ${categoryName}`)}
                    />
                  )}

                  {msg.quickReplies && msg.quickReplies.length > 0 && (
                    <QuickReplies
                      replies={msg.quickReplies}
                      onSelect={(reply) => sendMessage(reply)}
                    />
                  )}

                  {/* v4.0 — Smart Suggestions (last message only) */}
                  {msg.smartSuggestions && msg.smartSuggestions.length > 0 && msg.id === messages[messages.length - 1]?.id && (
                    <div style={{ paddingLeft: '42px', paddingRight: '16px' }}>
                      <SmartSuggestions
                        suggestions={msg.smartSuggestions}
                        onSelect={(text) => sendMessage(text)}
                      />
                    </div>
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

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button className="scroll-to-bottom" onClick={scrollToBottom} aria-label="Scroll to bottom">
            <ChevronDown size={18} />
          </button>
        )}
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <div className="chat-input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input-field"
            placeholder={t('input.placeholder', language)}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={isLoading}
          />
          <VoiceInput
            onTranscript={(text) => {
              setInput(text);
              sendMessage(text);
            }}
            disabled={isLoading}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <div className="chat-input-actions">
          <button
            className={`chat-input-action ${giftMode ? 'active' : ''}`}
            onClick={() => { toggleGiftMode(); }}
          >
            <Gift size={14} /> {giftMode ? t('input.giftOn', language) : t('input.gift', language)}
          </button>
          <button className="chat-input-action" onClick={() => sendMessage('Track my order')}>
            <Package size={14} /> {t('input.track', language)}
          </button>
          <button className="chat-input-action" onClick={() => sendMessage('Browse categories')}>
            <LayoutGrid size={14} /> {t('input.browse', language)}
          </button>
          <button className="chat-input-action" onClick={() => setCartDrawerOpen(true)}>
            <ShoppingCart size={14} /> {t('input.cart', language)} ({cart.reduce((s, i) => s + i.quantity, 0)})
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
