# Deployment Guide — KASA

Step-by-step deployment instructions for every major platform.

---

## Table of Contents

- [Environment Variables](#environment-variables)
- [Docker](#docker)
- [Vercel](#vercel-recommended)
- [Netlify](#netlify)
- [Railway](#railway)
- [Render](#render)
- [Cloudflare Pages](#cloudflare-pages)
- [DigitalOcean](#digitalocean-app-platform)
- [AWS](#aws-ecsfargate)
- [VPS (Ubuntu + Nginx)](#vps-ubuntu--nginx)
- [Common Issues](#common-deployment-issues)

---

## Environment Variables

All deployments require the same environment variables. Set these in your platform's dashboard or `.env` file:

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Recommended | Groq API key (FREE — best option) |
| `GOOGLE_GENERATIVE_AI_API_KEY` | Alternative | Google Gemini API key |
| `OPENAI_API_KEY` | Alternative | OpenAI API key |
| `MCP_ENDPOINT` | No | Defaults to `https://mcp.kapruka.com/mcp` |

### Build & Start Commands

| Command | Value |
|---------|-------|
| **Install** | `npm install` |
| **Build** | `npm run build` |
| **Start** | `npm start` |
| **Port** | `3000` (default) |

---

## Docker

### Using Dockerfile

```bash
# Build the production image
docker build -t kasa:latest .

# Run the container
docker run -d \
  --name kasa \
  -p 3000:3000 \
  -e GROQ_API_KEY=your_key_here \
  kasa:latest
```

### Using Docker Compose

```bash
# Start in production mode
docker compose up -d

# View logs
docker compose logs -f kasa

# Stop
docker compose down
```

### Custom Configuration

Create a `docker-compose.override.yml` for local overrides:

```yaml
services:
  kasa:
    ports:
      - "8080:3000"
    environment:
      - GROQ_API_KEY=your_dev_key_here
```

---

## Vercel (Recommended)

Vercel is the recommended deployment platform for Next.js applications.

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/ThikkaBro/kasa)

### Manual Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy (follow prompts)
vercel

# Deploy to production
vercel --prod
```

### Configuration

1. Go to your project dashboard on [vercel.com](https://vercel.com)
2. Navigate to **Settings → Environment Variables**
3. Add your API keys
4. Redeploy to apply changes

### Custom Domain

1. Go to **Settings → Domains**
2. Add your domain (e.g., `kasa.yourdomain.com`)
3. Update DNS records as shown
4. SSL is automatically provisioned

---

## Netlify

### Deploy via Git

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site" → "Import an existing project"**
3. Connect your GitHub repository
4. Configure build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
5. Add environment variables in **Site settings → Environment variables**
6. Deploy

### Deploy via CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login and deploy
netlify login
netlify init
netlify deploy --prod
```

> **Note**: Netlify requires the `@netlify/plugin-nextjs` plugin for full Next.js support. Add it in `netlify.toml`:
> ```toml
> [[plugins]]
> package = "@netlify/plugin-nextjs"
> ```

---

## Railway

### One-Click Deploy

1. Go to [railway.app](https://railway.app)
2. Click **"New Project" → "Deploy from GitHub Repo"**
3. Select your repository
4. Railway auto-detects the Next.js framework
5. Add environment variables in the **Variables** tab
6. Deploy completes automatically

### CLI Deploy

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

---

## Render

### Deploy Steps

1. Go to [render.com](https://render.com)
2. Click **"New" → "Web Service"**
3. Connect your GitHub repository
4. Configure:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm start`
   - **Environment:** `Node`
5. Add environment variables
6. Deploy

### Free Tier Notes

- Free tier services spin down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid plan for always-on deployment

---

## Cloudflare Pages

### Deploy Steps

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages**
2. Click **"Create application" → "Pages" → "Connect to Git"**
3. Select your repository
4. Configure:
   - **Build command:** `npm run build`
   - **Build output directory:** `.next`
5. Add environment variables in **Settings → Environment variables**

> **Note**: Full Next.js support on Cloudflare Pages requires the `@cloudflare/next-on-pages` adapter. Check [Cloudflare docs](https://developers.cloudflare.com/pages/framework-guides/nextjs/) for setup.

---

## DigitalOcean App Platform

### Deploy Steps

1. Go to [cloud.digitalocean.com](https://cloud.digitalocean.com) → **Apps**
2. Click **"Create App"**
3. Connect your GitHub repository
4. DigitalOcean auto-detects Next.js
5. Configure:
   - **Build command:** `npm run build`
   - **Run command:** `npm start`
   - **HTTP Port:** `3000`
6. Add environment variables under **App-Level Environment Variables**
7. Deploy

---

## AWS (ECS/Fargate)

### Using Docker on AWS

```bash
# Build and push to ECR
aws ecr get-login-password | docker login --username AWS --password-stdin YOUR_ECR_URL
docker build -t kasa:latest .
docker tag kasa:latest YOUR_ECR_URL/kasa:latest
docker push YOUR_ECR_URL/kasa:latest
```

### ECS Task Definition (minimal)

```json
{
  "family": "kasa",
  "containerDefinitions": [{
    "name": "kasa",
    "image": "YOUR_ECR_URL/kasa:latest",
    "portMappings": [{ "containerPort": 3000 }],
    "environment": [
      { "name": "GROQ_API_KEY", "value": "your_key" }
    ],
    "memory": 512,
    "cpu": 256
  }]
}
```

### With AWS Amplify

```bash
# Install Amplify CLI
npm install -g @aws-amplify/cli

# Initialize and deploy
amplify init
amplify add hosting
amplify publish
```

---

## VPS (Ubuntu + Nginx)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### 2. Deploy Application

```bash
# Clone and build
cd /var/www
git clone https://github.com/ThikkaBro/kasa.git
cd kasa
npm install
cp .env.example .env.local
# Edit .env.local with your API keys
nano .env.local

# Build for production
npm run build

# Start with PM2
pm2 start npm --name "kasa" -- start
pm2 save
pm2 startup
```

### 3. Nginx Configuration

```nginx
# /etc/nginx/sites-available/kasa
server {
    listen 80;
    server_name kasa.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/kasa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 4. SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d kasa.yourdomain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run
```

### 5. Domain Configuration

Add an A record in your DNS provider:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | kasa | YOUR_SERVER_IP | 3600 |

---

## Common Deployment Issues

### Build fails with "out of memory"

Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max_old_space_size=4096" npm run build
```

### Port already in use

```bash
# Change the port
PORT=8080 npm start
```

### API keys not working after deploy

1. Verify environment variables are set correctly (no quotes around values)
2. Redeploy after adding/changing variables
3. Check the deployment logs for provider initialization errors

### MCP connection timeout

The Kapruka MCP server (`https://mcp.kapruka.com/mcp`) may occasionally be slow. The client has built-in retry logic (3 attempts with exponential backoff).

### Images not loading in production

Verify `next.config.ts` includes all required image domains. The production build requires explicit domain whitelisting.

### Voice input not working in production

Web Speech API requires HTTPS. Ensure your deployment uses SSL/TLS.

### Streaming responses cut off

Some reverse proxies buffer responses. Disable buffering in Nginx:
```nginx
proxy_buffering off;
```

---

## Health Check

After deployment, verify these endpoints:

| Endpoint | Expected |
|----------|----------|
| `GET /` | Returns the main chat UI (200) |
| `GET /dashboard` | Returns the telemetry dashboard (200) |
| `GET /api/dashboard` | Returns JSON telemetry data (200) |

---

*Deployment guide maintained by [ThikkaBro](https://github.com/ThikkaBro)*
