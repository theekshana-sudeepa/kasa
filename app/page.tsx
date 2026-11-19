'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useChatStore } from './lib/store/chat-store';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import NameCaptureCard from './components/NameCaptureCard';
import TypingIndicator from './components/TypingIndicator';
import ProductCarousel from './components/ProductCarousel';
import QuickReplies from './components/QuickReplies';
import DeliveryCard from './components/DeliveryCard';
import OrderCard from './components/OrderCard';
import TrackingCard from './components/TrackingCard';
import CartBadge from './components/CartBadge';
import CategoryGrid from './components/CategoryGrid';
import MoodBackground from './components/MoodBackground';
import VoiceInput from './components/VoiceInput';
import SmartSuggestions from './components/SmartSuggestions';
import type { ChatMessage, Mood } from './lib/mcp/types';
import { parseAssistantResponse } from './lib/ai/response-parser';
import { ChevronDown, Gift, Package, LayoutGrid, ShoppingCart } from 'lucide-react';
import KasaAvatar from './components/KasaAvatar';
import { t } from './lib/i18n/translations';

// Lazy load heavy components — only loaded when needed
const CheckoutForm = dynamic(() => import('./components/CheckoutForm'), { ssr: false });
const ComparisonTable = dynamic(() => import('./components/ComparisonTable'), { ssr: false });
const CartDrawer = dynamic(() => import('./components/CartDrawer'), { ssr: false });
const CartSummary = dynamic(() => import('./components/CartSummary'), { ssr: false });
const TenSecondDecision = dynamic(() => import('./components/TenSecondDecision'), { ssr: false });
const GroupGiftLink = dynamic(() => import('./components/GroupGiftLink'), { ssr: false });
const GiftMessageCard = dynamic(() => import('./components/GiftMessageCard'), { ssr: false });

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
    userName,
    addMessage,
    setLoading,
    setCart,
    toggleGiftMode,
    setMood,
    setSmartSuggestions,
    setUserName,
  } = useChatStore();


  const [input, setInput] = useState('');
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  // Name capture state
  const [nameCapturePending, setNameCapturePending] = useState(false);
  const [pendingQuery, setPendingQuery] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Name extraction helper ──────────────────────────────────────
  /**
   * Try to extract a person's name from a raw text message.
   * Handles: "I'm Alex", "My name is Alex", "Alex", "Call me Alex"
   */
  function extractNameFromMessage(msg: string): string | null {
    const clean = msg.trim();
    // Direct name intro patterns
    const patterns = [
      /^(?:i[''']m|i am|my name is|call me|they call me|you can call me|it[''']s)\s+([a-z][a-z\-]{0,29})/i,
      /^([a-z][a-z\-]{0,29})(?:\s+here)?[.!]?$/i, // Single word reply like "Alex" or "Alex!"
    ];
    for (const p of patterns) {
      const m = clean.match(p);
      if (m && m[1]) {
        // Quick sanity: reject if it's a common non-name word
        const reject = /^(hi|hey|hello|yes|no|ok|okay|sure|skip|later|none|na|nah|bot|kasa)$/i;
        if (!reject.test(m[1])) return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      }
    }
    return null;
  }

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

    // ── Name capture intercept ──
    // If we don't know the user's name and this is their first message,
    // show a name-ask card FIRST, then fire the real query after.
    if (!userName && messages.length === 0 && !nameCapturePending) {
      // Add user message to chat
      addMessage({
        id: `user-${Date.now()}`,
        role: 'user',
        content: text.trim(),
        timestamp: Date.now(),
      });
      setInput('');
      // Hold the original query
      setPendingQuery(text.trim());
      // Inject the name-capture assistant message
      addMessage({
        id: `name-capture-${Date.now()}`,
        role: 'assistant',
        content: '__NAME_CAPTURE__',  // Special sentinel rendered as NameCaptureCard
        timestamp: Date.now(),
      });
      setNameCapturePending(true);
      return;
    }

    let effectiveText = text.trim();
    let resolvedUserName = userName;

    // ── If name capture is pending: user typed a name instead of using the card ──
    if (nameCapturePending) {
      const detectedName = extractNameFromMessage(effectiveText);
      if (detectedName) {
        resolvedUserName = detectedName;
        setUserName(detectedName);
        setNameCapturePending(false);
        // Remove name-capture message from UI
        useChatStore.setState((s) => ({
          messages: s.messages.filter((m) => !m.content.startsWith('__NAME_CAPTURE__')),
        }));
        // Continue with the held original query if present
        if (pendingQuery) {
          effectiveText = pendingQuery;
          setPendingQuery(null);
        } else {
          return;
        }
      }
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: effectiveText,
      timestamp: Date.now(),
    };
    addMessage(userMsg);
    setInput('');
    setLoading(true);

    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    // ── Passive name detection in ongoing chat ──
    // Catch: "by the way I'm Alex", "call me Sam"
    if (!resolvedUserName) {
      const detectedName = extractNameFromMessage(effectiveText);
      if (detectedName) {
        resolvedUserName = detectedName;
        setUserName(detectedName);
      }
    }

    const assistantMsgId = `assistant-${Date.now()}`;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: effectiveText,
          sessionId,
          language,
          cart,
          giftMode,
          deliveryCity,
          deliveryDate,
          userName: resolvedUserName || undefined,
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
        
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          fullText += chunk;
        } else if (done) {
          // Flush the decoder just in case
          const chunk = decoder.decode();
          if (chunk) fullText += chunk;
        }

        if (fullText) {
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
                    showCartSummary: parsedResponse.showCartSummary,
                    tenSecondDecision: parsedResponse.tenSecondDecision,
                    groupGift: parsedResponse.groupGift,
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
        
        if (done) break;
      }

    } catch {
      addMessage({
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Something went wrong on my end. If you haven't set an API key in .env.local, products won't load. Try again or browse by category!",
        timestamp: Date.now(),
        quickReplies: ['Try again', 'Browse categories', 'Show me gifts'],
      });
    } finally {
      setLoading(false);
    }
  }, [isLoading, sessionId, language, cart, giftMode, deliveryCity, deliveryDate, userName,
      nameCapturePending, pendingQuery, messages.length,
      addMessage, setLoading, setCart, setMood, setSmartSuggestions, setUserName]);

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
    <div className="app-shell">
      {/* ── Left Sidebar (desktop only, shown via CSS) ── */}
      <aside className="app-sidebar" aria-label="KASA branding panel">
        <div className="sidebar-brand">
          <div className="sidebar-logo">K</div>
          <div className="sidebar-name">KASA</div>
          <div className="sidebar-tagline">Sri Lanka&apos;s most intelligent shopping companion</div>
        </div>

        <div className="sidebar-features">
          <div className="sidebar-feature">
            <span className="sidebar-feature-icon">🎁</span>
            <span className="sidebar-feature-text">Smart gift finder</span>
          </div>
          <div className="sidebar-feature">
            <span className="sidebar-feature-icon">🚀</span>
            <span className="sidebar-feature-text">Same-day delivery</span>
          </div>
          <div className="sidebar-feature">
            <span className="sidebar-feature-icon">🧠</span>
            <span className="sidebar-feature-text">AI-powered search</span>
          </div>
          <div className="sidebar-feature">
            <span className="sidebar-feature-icon">📦</span>
            <span className="sidebar-feature-text">Live order tracking</span>
          </div>
        </div>

      </aside>

      {/* ── Main Chat Column ── */}
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
                  {/* ── Name Capture Card (special sentinel message) ── */}
                  {msg.content === '__NAME_CAPTURE__' ? (
                    <div className="message message-assistant">
                      <KasaAvatar />
                      <div>
                        <NameCaptureCard
                          onSubmit={(name) => {
                            setUserName(name);
                            setNameCapturePending(false);
                            // Remove the sentinel message
                            useChatStore.setState((s) => ({
                              messages: s.messages.filter((m) => m.content !== '__NAME_CAPTURE__'),
                            }));
                            // Fire the held query with the known name
                            if (pendingQuery) {
                              setPendingQuery(null);
                              sendMessage(pendingQuery);
                            }
                          }}
                          onSkip={() => {
                            setNameCapturePending(false);
                            useChatStore.setState((s) => ({
                              messages: s.messages.filter((m) => m.content !== '__NAME_CAPTURE__'),
                            }));
                            if (pendingQuery) {
                              setPendingQuery(null);
                              sendMessage(pendingQuery);
                            }
                          }}
                        />
                      </div>
                    </div>
                  ) : (
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
                  )}


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

      {/* ── Right Ambient Panel (very wide screens only) ── */}
      <div className="app-ambient-right" aria-hidden="true" />
    </div>
  );
}
