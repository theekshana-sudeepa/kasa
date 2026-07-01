# Installation Guide — KASA

Complete installation instructions for all platforms and package managers.

---

## Prerequisites

| Requirement | Version | Check Command |
|-------------|---------|---------------|
| **Node.js** | ≥ 18.18.0 | `node --version` |
| **npm** | ≥ 9.0.0 | `npm --version` |
| **Git** | Latest | `git --version` |

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/ThikkaBro/kasa.git
cd kasa
```

### 2. Install Dependencies

**Using npm (recommended):**
```bash
npm install
```

**Using yarn:**
```bash
yarn install
```

**Using pnpm:**
```bash
pnpm install
```

### 3. Configure Environment

```bash
# Copy the environment template
cp .env.example .env.local
```

Edit `.env.local` and add at least one AI provider key:

```bash
# Recommended: Groq (FREE)
# Get your key at: https://console.groq.com → API Keys
GROQ_API_KEY=gsk_your_key_here
```

> **Note**: KASA works without any API key using its smart fallback engine. Adding a key unlocks full AI-powered conversations.

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Production Build

```bash
# Build the production bundle
npm run build

# Start the production server
npm start
```

The production server starts on port 3000 by default. Change it with:

```bash
PORT=8080 npm start
```

---

## Docker Installation

See [DEPLOYMENT.md](DEPLOYMENT.md) for Docker-based installation.

```bash
# Quick start with Docker Compose
docker compose up -d
```

---

## Troubleshooting Installation

### `npm install` fails with peer dependency errors

```bash
npm install --legacy-peer-deps
```

### Node.js version too old

Install the latest LTS version:
```bash
# Using nvm (recommended)
nvm install --lts
nvm use --lts

# Or download from https://nodejs.org/
```

### Port 3000 already in use

```bash
# Use a different port
PORT=3001 npm run dev
```

### Build fails with TypeScript errors

```bash
# Clear the cache and rebuild
rm -rf .next
npm run build
```

---

## Next Steps

- Read the [README.md](README.md) for a project overview
- See [DEPLOYMENT.md](DEPLOYMENT.md) for deployment instructions
- Check [CONTRIBUTING.md](CONTRIBUTING.md) to start contributing
