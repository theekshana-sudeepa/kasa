# Changelog

All notable changes to KASA are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] — 2026-07-01

### 🎉 Initial Production Release

#### Added

**Core Features**
- Conversational AI shopping powered by Groq (Llama 3.3), Google Gemini, or OpenAI
- Smart fallback engine that works without any API key
- Full Kapruka MCP integration (search, cart, delivery, orders, tracking)
- Streaming AI responses with real-time text rendering

**Emotional Intelligence**
- Mood detection from user messages (sad, urgent, excited, anxious, romantic, neutral)
- Empathy-first response strategy
- Mood-reactive background animations
- Tone enforcement filter to prevent robotic responses

**Trilingual Support**
- English (full support)
- Sinhala (සිංහල) — complete UI translation and AI responses
- Tanglish — Tamil-English mix support

**Shopping Features**
- Product search and discovery with image enrichment
- Smart product ranking with "KASA's Pick" recommendations
- Multi-item shopping cart with quantity management
- Category browsing with visual grid
- Product comparison tables
- Gift mode with occasion-aware suggestions
- Gift message cards
- Group gift link sharing
- Delivery city search and availability checking
- Checkout form with recipient/sender details
- Order creation through Kapruka MCP
- Order tracking by number

**Predictive Intelligence**
- Ghost Cart — pre-fetches likely cart additions
- Smart Suggestions — context-aware next-best-action buttons
- Conversation Memory — remembers city, budget, preferences, occasions

**UI/UX**
- Premium glassmorphic design system
- Dark/Light mode with system preference detection
- Framer Motion animations throughout
- Voice input with Web Speech API
- Responsive design (desktop, tablet, mobile)
- Typing indicators and skeleton loading states
- Toast notification system
- Scroll-to-bottom button
- Quick reply chips

**Developer Features**
- Real-time telemetry dashboard at `/dashboard`
- Session management with TTL-based cleanup
- MCP client with retry logic and circuit breaker patterns
- Comprehensive API routes for all features
- TypeScript strict mode throughout

**Production Readiness**
- Security headers in Next.js config
- Standalone build output for Docker deployment
- Docker multi-stage build with non-root user
- Comprehensive documentation suite
- MIT License

---

*Maintained by [Theekshana Sudeepa](https://github.com/theekshana-sudeepa)*
