<div align="center">

# KASA — AI Shopping Concierge for Kapruka

**කැස** · Emotionally intelligent, trilingual AI shopping concierge built on the Kapruka Model Context Protocol (MCP) for Sri Lanka's largest e-commerce platform.

[![Next.js](https://img.shields.io/badge/Next.js-16-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vercel AI SDK](https://img.shields.io/badge/Vercel%20AI%20SDK-6-000000?style=flat-square&logo=vercel)](https://sdk.vercel.ai/)
[![Kapruka MCP](https://img.shields.io/badge/Protocol-Kapruka%20MCP-6D28D9?style=flat-square)](https://mcp.kapruka.com)
[![Kapruka Agent Challenge](https://img.shields.io/badge/Kapruka%20Agent%20Challenge%202026-Builder-F59E0B?style=flat-square)](#-recognition)
[![License: MIT](https://img.shields.io/badge/License-MIT-10B981?style=flat-square)](LICENSE)

[Architecture](#-system-architecture) · [Engineering Highlights](#-core-engineering-highlights) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment)

</div>

---

## Overview

**KASA** (කැස) transforms e-commerce search and checkout on [Kapruka.com](https://www.kapruka.com) into a natural, empathetic conversation. Supporting **English**, **Sinhala (සිංහල)**, and **Tanglish**, KASA detects user mood and urgency, orchestrates live product search, delivery availability, cart management, guest checkout, and order tracking over the **Kapruka MCP** server, and degrades gracefully to a zero-API-key deterministic engine when LLM credentials are absent.

> **Recognition — Kapruka Agent Challenge 2026**
> Built and submitted as a live AI shopping agent on the Kapruka MCP for the **Kapruka Agent Challenge 2026** (700+ participating developers across Sri Lanka). Awarded the official **Builder Certificate of Participation** by Kapruka Holdings PLC (`REF · NHKZ4`, July 2026).

---

## System Architecture

```mermaid
flowchart TB
    subgraph Client["Client Layer — Next.js App Router and React 19"]
        ChatUI["Chat Workspace<br/>app/page.tsx"]
        CartUI["Cart Drawer and Checkout<br/>CartDrawer / CheckoutForm"]
        DashUI["Telemetry Dashboard<br/>app/dashboard/page.tsx"]
        Store["Zustand State Store<br/>messages, cart, mood, i18n"]
        ChatUI -->|Sync State| Store
        CartUI -->|Mutate Cart| Store
    end

    subgraph Server["API and Security Layer — Next.js Route Handlers"]
        RateLimit["Sliding-Window Rate Limiter<br/>and Input Sanitizer"]
        ChatAPI["POST /api/chat<br/>Streaming Orchestrator"]
        RestAPIs["REST Endpoints<br/>cart, delivery, order, suggestions, dashboard"]
        RateLimit -->|Validate Request| ChatAPI
        RateLimit -->|Validate Request| RestAPIs
    end

    subgraph Engine["Conversational AI Pipeline — app/lib/ai"]
        Intent["Intent and Emotion Extractor<br/>Mood, Urgency, Occasion"]
        Memory["Session Store and Memory Engine<br/>1h TTL In-Memory State"]
        Ranker["Product Ranker and Ghost Cart<br/>KASA Pick and Predictions"]
        LLM["Multi-Provider LLM Router<br/>Groq / Gemini / OpenAI / Zero-Key Fallback"]
        Parser["Structured Tag Streamer<br/>and Tone Enforcement"]
        Intent -->|Update Context| Memory
        Memory -->|Build Prompt| LLM
        Ranker -->|Enrich Results| Parser
        LLM -->|Stream Tokens| Parser
    end

    subgraph External["External Commerce Protocol"]
        MCPClient["Kapruka MCP Client<br/>JSON-RPC 2.0, SSE, Exponential Backoff"]
        KaprukaMCP["Kapruka MCP Server<br/>mcp.kapruka.com"]
        MCPClient -->|JSON RPC Over HTTPS| KaprukaMCP
    end

    Store -->|Streaming HTTP POST| RateLimit
    DashUI -->|Poll Metrics| RestAPIs
    ChatAPI -->|Extract Intent| Intent
    ChatAPI -->|Invoke Commerce Tools| MCPClient
    RestAPIs -->|Direct Tool Calls| MCPClient
    MCPClient -->|Products and Orders| Ranker
    Parser -->|Text and UI Tags Stream| ChatUI
```

### Conversational Request Flow

```mermaid
sequenceDiagram
    participant User as Shopper
    participant UI as Chat UI
    participant API as POST /api/chat
    participant AI as Intent and LLM Pipeline
    participant MCP as Kapruka MCP Client

    User->>UI: Send message in English, Sinhala, or Tanglish
    UI->>API: POST message, sessionId, language, cart, deliveryCity
    API->>API: Check rate limit and sanitize input
    API->>AI: Extract emotion, shopping intent, and memory updates
    AI-->>API: Structured intent with search queries and mood
    API->>MCP: Call Kapruka MCP tools for search, delivery, or tracking
    MCP-->>API: Product catalog, delivery status, or order payload
    API->>AI: Rank products, update Ghost Cart, and stream LLM reply
    AI-->>API: Token stream with structured UI tags
    API-->>UI: Stream prose plus PRODUCTS, DELIVERY, and QUICK_REPLIES tags
    UI-->>User: Render empathetic reply, product cards, and mood background
```

---

## Core Engineering Highlights

- **Multi-Provider LLM Routing with Zero-Key Fallback:** Dynamically resolves providers in priority order (**Groq Llama 3.3 70B** -> **Google Gemini 2.0 Flash** -> **OpenAI GPT-4o-mini**) via the Vercel AI SDK, and falls back seamlessly to a deterministic commerce engine when no API key is configured.
- **Resilient Kapruka MCP Client:** Implements JSON-RPC 2.0 session initialization (`Mcp-Session-Id`), Server-Sent Events (SSE) stream parsing, `429 Retry-After` handling, exponential backoff retries, response verification, and real-time telemetry tracking.
- **Emotion-Aware Commerce Pipeline:** Detects emotional context (`sad`, `urgent`, `excited`, `anxious`, `romantic`, `neutral`), adjusts visual mood backgrounds, enforces natural non-robotic tone, and prioritizes empathy before recommendations.
- **Trilingual Localization:** Native UI strings and conversational responses across **English**, **Sinhala (සිංහල)**, and **Tanglish**, paired with Web Speech API voice input.
- **Predictive Shopping UX:** Includes **KASA's Pick** product scoring, **Ghost Cart** pre-fetching for likely additions, **10-Second Decision** quick-pick mode, gift message cards, group-gift split links, and live conversation memory.
- **Production Hardening:** Enforces strict CSP and security headers (`X-Frame-Options`, `X-Content-Type-Options`, `Permissions-Policy`), sliding-window IP rate limiting, XSS input sanitization, 1-hour TTL ephemeral server sessions, and standalone multi-stage Docker packaging.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| **Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, Standalone Output) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict Mode) |
| **UI & Motion** | [React 19](https://react.dev/), [Framer Motion 12](https://www.framer.com/motion/), [Lucide React](https://lucide.dev/) |
| **State Management** | [Zustand 5](https://zustand.docs.pmnd.rs/) |
| **AI Orchestration** | [Vercel AI SDK 6](https://sdk.vercel.ai/) (`@ai-sdk/groq`, `@ai-sdk/google`, `@ai-sdk/openai`) |
| **Commerce Protocol** | [Kapruka MCP Server](https://mcp.kapruka.com) (JSON-RPC 2.0 + SSE) |
| **Validation** | [Zod 4](https://zod.dev/) |
| **Containerization** | Multi-stage Alpine `Dockerfile` & `docker-compose.yml` |

---

## Repository Structure

```text
kasa/
├── app/
│   ├── api/
│   │   ├── cart/sync/route.ts         # Cart synchronization and totals
│   │   ├── chat/
│   │   │   ├── route.ts               # Streaming AI + MCP orchestrator
│   │   │   └── parsed/route.ts        # Parsed chat response helper
│   │   ├── dashboard/route.ts         # Live session & MCP telemetry API
│   │   ├── delivery/check/route.ts    # City/date delivery validation
│   │   ├── order/create/route.ts      # Guest checkout order creation
│   │   └── suggestions/route.ts       # Context-aware suggestions API
│   ├── components/                    # 32 modular React UI components
│   │   ├── CartDrawer.tsx             # Slide-over shopping cart
│   │   ├── CategoryGrid.tsx           # Interactive Kapruka categories
│   │   ├── CheckoutForm.tsx           # Recipient & sender checkout flow
│   │   ├── ComparisonTable.tsx        # Side-by-side product comparison
│   │   ├── ErrorBoundary.tsx          # Graceful runtime error boundary
│   │   ├── MoodBackground.tsx         # Emotion-reactive ambient canvas
│   │   ├── NameCaptureCard.tsx        # First-turn personalization prompt
│   │   ├── ProductCard.tsx            # Ranked product cards & KASA's Pick
│   │   ├── TenSecondDecision.tsx      # Countdown impulse-pick widget
│   │   ├── VoiceInput.tsx             # Web Speech API microphone control
│   │   └── WelcomeScreen.tsx          # Localized onboarding workspace
│   ├── dashboard/
│   │   ├── page.tsx                   # Real-time telemetry dashboard UI
│   │   └── dashboard.css
│   ├── lib/
│   │   ├── ai/                        # Intent, memory, ranker, parser, ghost-cart, tone
│   │   ├── i18n/translations.ts       # English, Sinhala, and Tanglish packs
│   │   ├── mcp/                       # Kapruka MCP JSON-RPC/SSE client & types
│   │   ├── security/rate-limiter.ts   # Sliding-window limiter & sanitizer
│   │   └── store/chat-store.ts        # Zustand client store
│   ├── globals.css
│   ├── layout.tsx
│   ├── loading.tsx
│   └── page.tsx
├── public/                            # PWA manifest, icons, service worker
├── .env.example                       # Environment template
├── Dockerfile                         # Multi-stage production container
├── docker-compose.yml
├── next.config.ts                     # Security headers & image remotePatterns
├── CHANGELOG.md
├── CONTRIBUTING.md
├── DEPLOYMENT.md
├── INSTALL.md
├── LICENSE
└── SECURITY.md
```

---

## Getting Started

### Prerequisites

- **Node.js** `>= 18.18.0` (Node 20/22 LTS recommended)
- **npm** `>= 9.0.0`

### Local Installation

```bash
# 1. Clone the repository
git clone https://github.com/theekshana-sudeepa/kasa.git
cd kasa

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
```

Edit `.env.local` with at least one AI provider key (or leave blank to run in zero-key smart fallback mode):

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Optional* | [Groq](https://console.groq.com) API key (recommended, Llama 3.3 70B) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Optional* | [Google AI Studio](https://aistudio.google.com/apikey) API key (Gemini 2.0 Flash) |
| `OPENAI_API_KEY` | Optional* | [OpenAI](https://platform.openai.com/api-keys) API key (GPT-4o-mini) |
| `MCP_ENDPOINT` | Optional | Custom MCP endpoint (defaults to `https://mcp.kapruka.com/mcp`) |

> *Providers are evaluated in order: `GROQ_API_KEY` -> `GOOGLE_GENERATIVE_AI_API_KEY` -> `OPENAI_API_KEY` -> Zero-Key Fallback Engine.

### Development & Production Commands

```bash
# Run development server (http://localhost:3000)
npm run dev

# Verify lint and production build
npm run lint
npm run build

# Start production server
npm start
```

---

## API Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | `POST` | Streaming conversational endpoint emitting prose + structured UI tags (`<PRODUCTS>`, `<CATEGORIES>`, `<DELIVERY>`, `<ORDER>`, `<TRACKING>`, `<QUICK_REPLIES>`, `<MOOD>`, `<CHECKOUT_FORM/>`) |
| `/api/chat/parsed` | `POST` | Returns pre-parsed structured response payloads |
| `/api/cart/sync` | `POST` | Synchronizes cart items and calculates totals |
| `/api/delivery/check` | `POST` | Validates delivery coverage by Sri Lankan city and date |
| `/api/order/create` | `POST` | Submits guest checkout orders via Kapruka MCP |
| `/api/suggestions` | `POST` | Generates contextual next-best-action shopping prompts |
| `/api/dashboard` | `GET` | Exposes active session, mood distribution, Ghost Cart, and MCP telemetry |

---

## Deployment

KASA supports one-click cloud hosting and containerized self-hosting. See [DEPLOYMENT.md](DEPLOYMENT.md) for platform-specific instructions covering Docker, Vercel, Netlify, Railway, Render, AWS ECS, and Nginx + PM2.

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/theekshana-sudeepa/kasa)

### Quick Deploy with Docker

```bash
docker compose up -d --build
```

---

## Security & Privacy

- All API keys remain strictly server-side via environment variables — never exposed to client bundles.
- No database persistence of customer chats; server session state resides in ephemeral memory with automatic 1-hour TTL eviction.
- See [SECURITY.md](SECURITY.md) for security headers and responsible disclosure guidelines.

---

## License

This project is open-source software licensed under the [MIT License](LICENSE).

---

<div align="center">

**Engineered by [Theekshana Sudeepa](https://github.com/theekshana-sudeepa)**

[LinkedIn](https://www.linkedin.com/in/theekshana-sudeepa/) · [GitHub](https://github.com/theekshana-sudeepa) · [LexoraTech](https://lexoratech.com)

</div>
