# Altera Product Studio

AI-powered Shopify product creation for [Altera Home Design](https://alterahomedesign.com).

Upload product images → AI extracts specs, writes marketing copy, calculates pricing, generates a 10-scene photoshoot, and exports Shopify-ready CSV + ZIP.

## Stack

- **Backend**: Node.js + Express (API proxy for Claude & Gemini)
- **Frontend**: Vanilla HTML/JS (single file, no build step)
- **AI**: Claude Sonnet 4 (extraction + copywriting) + Gemini 2.0 Flash (image generation)
- **Deploy**: Render.com

## Setup

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USER/altera-product-studio.git
cd altera-product-studio
npm install
```

### 2. Set environment variables

Create a `.env` file or set in Render dashboard:

```
CLAUDE_API_KEY=sk-ant-...
GEMINI_API_KEY=AIzaSy...
```

### 3. Run locally

```bash
npm start
# → http://localhost:3000
```

### 4. Deploy to Render

1. Push to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com) → New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add Environment Variables:
   - `CLAUDE_API_KEY` = your Anthropic API key
   - `GEMINI_API_KEY` = your Google AI key
6. Deploy

Or use the `render.yaml` blueprint — click "New" → "Blueprint" and connect the repo.

## Features

- **Auto category detection**: 25 Altera collections mapped to Shopify categories
- **Creative naming**: AI generates 3 name options (city, feminine, abstract)
- **Title ↔ Description sync**: Changing the title auto-updates description and SEO
- **Dimensions format**: `110cm (43 3/8") length x 90cm (35 3/8") width x 85cm (33 1/2") height`
- **Pricing engine**: (Cost USD + Shipping) × FX Rate × Markup → rounded to $5
- **10-scene photoshoot**: Studio + lifestyle renders via Gemini, streams one by one
- **ZIP export**: Images + Shopify CSV + README in one download
- **Persistent settings**: Brand, FX rate, markup saved in localStorage

## API Routes

| Route | Method | Description |
|---|---|---|
| `/api/extract` | POST | Extract product data + generate marketing copy |
| `/api/photoshoot-scene` | POST | Generate single photoshoot scene |
| `/api/export-zip` | POST | Generate ZIP with images + CSV |
| `/api/health` | GET | Check API key status |
