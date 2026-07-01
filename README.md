<div align="center">

# 🛍️ KASA — AI Shopping Concierge for Kapruka

**කැස** · Your Personal AI Shopping Assistant for Sri Lanka's Largest E-Commerce Platform

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/Version-1.0.0-purple?style=flat-square)]()

[Live Demo](#deployment) · [Installation](#installation) · [Features](#-features) · [Documentation](#-documentation)

</div>

---

## 📖 About

**KASA** (කැස — Sinhala for *coin*) is an AI-powered shopping concierge for [Kapruka.com](https://www.kapruka.com), Sri Lanka's largest e-commerce platform. Built as a conversational shopping experience, KASA understands natural language in **English**, **Sinhala**, and **Tanglish** (Tamil-English mix), detects emotional context, and guides users from product discovery through checkout — all through a premium chat interface.

Unlike traditional chatbots, KASA reads the emotional context of your message. Whether you're panicking about a forgotten birthday, feeling romantic, or just need a phone charger — KASA responds with appropriate empathy, urgency, or practicality.

---

## ✨ Features

### 🧠 Emotional Intelligence
- **Mood detection** — Understands sad, urgent, excited, anxious, romantic, and neutral emotions
- **Empathy-first responses** — Leads with warmth before product suggestions
- **Adaptive tone** — Switches between playful, practical, and supportive based on context

### 🌐 Trilingual Support
- **English** — Full conversational support
- **Sinhala (සිංහල)** — Complete UI translation + AI responses in native script
- **Tanglish** — Tamil-English mix for natural South Asian communication

### 🛒 Full E-Commerce Flow
- **Product search & discovery** via Kapruka MCP integration
- **Smart product ranking** with KASA's Pick recommendations
- **Multi-item shopping cart** with real-time total calculation
- **Delivery checking** with city search and date validation
- **Secure checkout** with recipient/sender details
- **Order tracking** by order number
- **Category browsing** with rich UI cards

### 🎁 Gift Intelligence
- **Gift mode** — Tailored suggestions for occasions (birthday, wedding, anniversary, etc.)
- **Gift target awareness** — Knows if it's for amma, girlfriend, colleague, etc.
- **Gift message cards** — Personalized messages with the order
- **Group gift links** — Share and split costs with friends

### 🔮 Predictive Features
- **Ghost Cart** — Pre-fetches likely additions for instant responses
- **Smart Suggestions** — Context-aware next-best-action recommendations
- **Conversation Memory** — Remembers delivery city, budget, preferences across messages

### 🎨 Premium UI/UX
- **Glassmorphic design** with smooth animations (Framer Motion)
- **Dark/Light mode** with system preference detection
- **Mood-reactive backgrounds** that shift with conversation tone
- **Voice input** with Web Speech API
- **Responsive design** — Desktop, tablet, and mobile optimized
- **Real-time telemetry dashboard** at `/dashboard`

---

## 📸 Screenshots

> Add screenshots of the application here.

| Light Mode | Dark Mode |
|:---:|:---:|
| *Chat Interface — Light* | *Chat Interface — Dark* |

| Mobile View | Dashboard |
|:---:|:---:|
| *Responsive Mobile* | *Telemetry Dashboard* |

---

## 🏗️ Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) |
| **UI** | [React 19](https://react.dev/) |
| **Styling** | Vanilla CSS (Custom Design System) |
| **Animation** | [Framer Motion](https://www.framer.com/motion/) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **State** | [Zustand](https://zustand.docs.pmnd.rs/) |
| **AI SDK** | [Vercel AI SDK](https://sdk.vercel.ai/) |
| **AI Providers** | Groq (Llama 3.3), Google Gemini, OpenAI |
| **E-Commerce** | [Kapruka MCP Server](https://mcp.kapruka.com) |
| **Validation** | [Zod](https://zod.dev/) |

---

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Client (React)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │  Chat UI │ │  Cart    │ │Dashboard │            │
│  │  (page)  │ │  Drawer  │ │  (page)  │            │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘            │
│       │             │            │                   │
│  ┌────▼─────────────▼────────────▼─────┐            │
│  │         Zustand Store               │            │
│  │  (messages, cart, language, mood)    │            │
│  └────────────────┬────────────────────┘            │
└───────────────────┼─────────────────────────────────┘
                    │ HTTP/Streaming
┌───────────────────▼─────────────────────────────────┐
│                 API Routes (Server)                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │/api/chat │ │/api/cart │ │/api/dash │            │
│  └────┬─────┘ └──────────┘ └──────────┘            │
│       │                                              │
│  ┌────▼────────────────────────────────┐            │
│  │        AI Pipeline                  │            │
│  │  Intent → MCP Tools → AI Model     │            │
│  │  → Response Parser → Tone Enforce  │            │
│  └────┬────────────────────────────────┘            │
│       │                                              │
│  ┌────▼────────────────────────────────┐            │
│  │      Kapruka MCP Server             │            │
│  │  (Search, Cart, Delivery, Orders)   │            │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

---

## 📦 Installation

### Prerequisites

- **Node.js** ≥ 18.18.0
- **npm** ≥ 9.0.0 (or yarn/pnpm)

### Quick Start

```bash
# Clone the repository
git clone https://github.com/ThikkaBro/kasa.git
cd kasa

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API key (see Environment Variables below)

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note**: KASA works **without any API key** using its smart fallback engine. Add a key for full AI-powered conversations.

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | No* | [Groq](https://console.groq.com) API key (FREE — recommended) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No* | [Google AI Studio](https://aistudio.google.com/apikey) API key (FREE tier) |
| `OPENAI_API_KEY` | No* | [OpenAI](https://platform.openai.com/api-keys) API key (Paid) |
| `MCP_ENDPOINT` | No | Kapruka MCP endpoint (defaults to `https://mcp.kapruka.com/mcp`) |

> *At least one AI provider key is recommended for the full experience. KASA will use the first available key in order: Groq → Google → OpenAI.

---

## 🚀 Running the Application

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 📂 Folder Structure

```
kasa/
├── app/
│   ├── api/                    # API Routes
│   │   ├── chat/               # Main AI chat endpoint (streaming)
│   │   │   ├── route.ts
│   │   │   └── parsed/route.ts # Parsed response endpoint
│   │   ├── cart/sync/route.ts  # Cart synchronization
│   │   ├── dashboard/route.ts  # Telemetry dashboard API
│   │   ├── delivery/check/     # Delivery availability check
│   │   ├── order/create/       # Order creation
│   │   └── suggestions/        # Smart suggestions API
│   ├── components/             # React Components
│   │   ├── CartBadge.tsx       # Floating cart indicator
│   │   ├── CartDrawer.tsx      # Cart sidebar drawer
│   │   ├── CartSummary.tsx     # Cart total summary
│   │   ├── CategoryGrid.tsx    # Category browsing grid
│   │   ├── CheckoutForm.tsx    # Checkout details form
│   │   ├── ComparisonTable.tsx # Product comparison view
│   │   ├── Confetti.tsx        # Celebration animation
│   │   ├── DeliveryCard.tsx    # Delivery info card
│   │   ├── EmptyState.tsx      # Empty state placeholder
│   │   ├── GiftMessageCard.tsx # Gift message component
│   │   ├── GroupGiftLink.tsx   # Group gift sharing
│   │   ├── Header.tsx          # App header/nav
│   │   ├── KasaAvatar.tsx      # AI avatar icon
│   │   ├── KasaPickBadge.tsx   # "KASA's Pick" badge
│   │   ├── MoodBackground.tsx  # Mood-reactive background
│   │   ├── OrderCard.tsx       # Order confirmation card
│   │   ├── ProductCard.tsx     # Product display card
│   │   ├── ProductCarousel.tsx # Product carousel wrapper
│   │   ├── ProductModal.tsx    # Product detail modal
│   │   ├── QuickReplies.tsx    # Quick reply buttons
│   │   ├── SkeletonUI.tsx      # Loading skeletons
│   │   ├── SmartSuggestions.tsx # Context-aware suggestions
│   │   ├── TenSecondDecision.tsx# Quick decision prompt
│   │   ├── ThemeProvider.tsx   # Dark/light theme
│   │   ├── Toast.tsx           # Toast notifications
│   │   ├── TrackingCard.tsx    # Order tracking card
│   │   ├── TypingIndicator.tsx # AI typing animation
│   │   ├── VoiceInput.tsx      # Voice input button
│   │   └── WelcomeScreen.tsx   # Welcome/onboarding
│   ├── dashboard/              # Telemetry Dashboard
│   │   ├── page.tsx
│   │   └── dashboard.css
│   ├── lib/                    # Core Libraries
│   │   ├── ai/                 # AI Engine
│   │   │   ├── ghost-cart.ts       # Predictive cart
│   │   │   ├── intent-extractor.ts # Intent & emotion detection
│   │   │   ├── memory-engine.ts    # Conversation memory
│   │   │   ├── product-ranker.ts   # Product scoring/ranking
│   │   │   ├── response-parser.ts  # Response tag parser
│   │   │   ├── session-store.ts    # Server-side session state
│   │   │   ├── suggestion-engine.ts# Smart suggestions
│   │   │   ├── system-prompt.ts    # AI system prompt builder
│   │   │   ├── tone-enforcement.ts # Anti-robotic tone filter
│   │   │   └── tools.ts           # MCP tool definitions
│   │   ├── i18n/
│   │   │   └── translations.ts    # Sinhala/Tanglish/English
│   │   ├── mcp/
│   │   │   ├── client.ts          # Kapruka MCP client
│   │   │   └── types.ts           # TypeScript interfaces
│   │   └── store/
│   │       └── chat-store.ts      # Zustand state store
│   ├── globals.css             # Design system & styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Main chat page
├── .env.example                # Environment template
├── .gitignore
├── Dockerfile                  # Production Docker image
├── docker-compose.yml          # Docker Compose config
├── next.config.ts              # Next.js configuration
├── package.json
├── tsconfig.json
├── CHANGELOG.md
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── INSTALL.md
├── LICENSE
├── README.md
└── SECURITY.md
```

---

## 📡 API Documentation

### `POST /api/chat` — Main Chat Endpoint

Streaming endpoint that handles all conversational AI interactions.

**Request Body:**
```json
{
  "message": "Show me birthday cakes under Rs. 5000",
  "sessionId": "kasa-abc123",
  "language": "en",
  "cart": [],
  "giftMode": false,
  "deliveryCity": "Colombo",
  "deliveryDate": "2026-07-15"
}
```

**Response:** Server-Sent text stream with embedded structured tags:
- `<PRODUCTS>` — Product listings with images
- `<QUICK_REPLIES>` — Suggested quick actions
- `<DELIVERY>` — Delivery availability info
- `<ORDER>` — Order confirmation details
- `<TRACKING>` — Order tracking timeline
- `<CATEGORIES>` — Category listings
- `<CHECKOUT_FORM/>` — Trigger checkout form
- `<MOOD>` — Detected mood signal
- `<SMART_SUGGESTIONS>` — Next-best-action suggestions

### `GET /api/dashboard` — Telemetry Data

Returns real-time system metrics for the admin dashboard.

### `POST /api/suggestions` — Smart Suggestions

Returns context-aware suggestions based on conversation state.

### `POST /api/delivery/check` — Delivery Check

Checks delivery availability for a city/date/product combination.

### `POST /api/order/create` — Create Order

Creates a guest checkout order through the Kapruka MCP.

### `POST /api/cart/sync` — Cart Sync

Synchronizes cart state and computes totals.

---

## 🚢 Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment guides for:

- **Docker** — Multi-stage production build
- **Vercel** — Recommended, zero-config
- **Netlify** — Static export + serverless
- **Railway** — One-click deploy
- **Render** — Free tier available
- **DigitalOcean App Platform**
- **AWS** (ECS/Fargate)
- **VPS** (Ubuntu + Nginx)
- **Cloudflare Pages**

### Quick Deploy: Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ThikkaBro/kasa)

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|---------|
| **No AI responses** | Add at least one AI API key to `.env.local`. KASA works without one but uses limited fallback mode. |
| **MCP connection fails** | Check if `https://mcp.kapruka.com/mcp` is accessible. May be temporarily down. |
| **Build fails** | Run `npm install` to ensure all dependencies are installed. Check Node.js version ≥ 18.18. |
| **Voice input not working** | Requires HTTPS in production. Works on localhost during development. |
| **Images not loading** | Kapruka product images are loaded from external domains configured in `next.config.ts`. |

---

## ❓ FAQ

**Q: Do I need an API key to use KASA?**
A: No. KASA has a smart fallback engine that handles product search, cart, checkout, and order tracking without any AI key. Add one for full conversational AI capabilities.

**Q: Which AI provider is best?**
A: **Groq** (free) is recommended for the best balance of speed and quality. It uses Llama 3.3 70B.

**Q: Does KASA store my data?**
A: KASA stores conversation state in server memory only during the active session (1-hour TTL). No data is persisted to disk or external databases. Cart preferences are stored in the browser's localStorage.

**Q: Can I use this for other e-commerce platforms?**
A: The MCP client layer is abstracted and can be adapted to other MCP-compatible e-commerce APIs.

---

## 🗺️ Roadmap

- [ ] **Payment integration** — Direct payment processing within chat
- [ ] **Multi-vendor support** — Extend beyond Kapruka
- [ ] **User accounts** — Persistent profiles and order history
- [ ] **Push notifications** — Order status updates
- [ ] **AI-generated gift recommendations** — Vision-based matching
- [ ] **Tamil language support** — Full native Tamil UI and AI responses
- [ ] **PWA support** — Installable progressive web app
- [ ] **Analytics dashboard** — Conversion funnel tracking

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Credits

Developed and maintained by **[ThikkaBro](https://github.com/ThikkaBro)**

### Acknowledgments

- [Kapruka.com](https://www.kapruka.com) — Sri Lanka's premier e-commerce platform
- [Vercel AI SDK](https://sdk.vercel.ai/) — AI integration framework
- [Next.js](https://nextjs.org/) — React framework
- [Zustand](https://zustand.docs.pmnd.rs/) — State management
- [Framer Motion](https://www.framer.com/motion/) — Animation library
- [Lucide](https://lucide.dev/) — Icon library

---

<div align="center">

**Built with ❤️ in Sri Lanka**

</div>
