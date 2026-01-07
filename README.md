# Platinum List - Stock Valuation Web App

A full-stack web application for tracking expected returns on a watchlist of stocks called the "Platinum List." The app calculates 5-year expected returns (IRRs) based on company estimates, fiscal year data, and exit multiples.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Database:** Vercel Postgres (PostgreSQL)
- **Stock Price API:** Yahoo Finance (via `yahoo-finance2` package)
- **Hosting:** Vercel

## Project Structure

```
Platinum-List-App/
├── api/                    # Vercel Serverless Functions
│   ├── companies/          # Company CRUD endpoints
│   ├── prices/             # Price refresh endpoints
│   ├── cron/               # Scheduled jobs
│   └── *.ts                # Other API endpoints
├── lib/                    # Shared server utilities
│   ├── models/             # Database models
│   ├── services/           # External services (Yahoo Finance)
│   ├── utils/              # IRR calculator, fiscal year utils
│   ├── db.ts               # Database connection
│   └── schema.sql          # PostgreSQL schema
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── pages/              # Page components
│   ├── utils/              # Client utilities
│   └── types/              # TypeScript types
├── vercel.json             # Vercel configuration
└── package.json
```

## Deployment to Vercel

### Prerequisites

- [Vercel account](https://vercel.com) (Pro plan recommended for extended timeouts)
- [Vercel CLI](https://vercel.com/cli) installed: `npm i -g vercel`

### Step 1: Connect Repository

```bash
# Link your project to Vercel
vercel link
```

### Step 2: Add Vercel Postgres

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Storage** tab
3. Click **Create Database** → **Postgres**
4. Follow the setup wizard
5. Environment variables will be automatically configured

### Step 3: Initialize Database

After creating the Postgres database, run the schema:

1. Go to Vercel Dashboard → Storage → Your Database → **Query**
2. Copy and paste the contents of `lib/schema.sql`
3. Click **Run Query**

### Step 4: Deploy

```bash
# Deploy to production
vercel --prod
```

### Step 5: Upgrade to Pro (Recommended)

For extended function timeouts (60+ seconds) and cron jobs:
- Vercel Dashboard → Settings → Billing → Upgrade to Pro

## Local Development

### Setup

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend runs on `http://localhost:3000`.

**Note:** For local development, you'll need to either:
1. Set up a local PostgreSQL database and configure `POSTGRES_URL`
2. Use Vercel's development features: `vercel dev`

### Using Vercel Dev (Recommended)

```bash
# Pull environment variables from Vercel
vercel env pull .env.local

# Start local development with Vercel
vercel dev
```

This runs the frontend and API functions locally with your production database.

## API Endpoints

### Companies

- `GET /api/companies` - List all companies with calculated IRRs
- `GET /api/companies/:ticker` - Get single company by ticker
- `POST /api/companies` - Create or update company (upsert by ticker)

### Prices

- `POST /api/prices/refresh-all` - Refresh prices for all companies
- `POST /api/companies/:ticker/refresh-price` - Refresh single company price
- `GET /api/companies/:ticker/quote` - Get stock quote

### Other

- `GET /api/search?q=AAPL` - Search ticker symbols
- `GET /api/submission-logs` - Get submission history
- `GET /api/edit-history` - Get edit comparisons

### Cron Jobs

- `GET /api/cron/refresh-prices` - Automated daily price refresh (9 AM ET, weekdays)

## Environment Variables

When using Vercel Postgres, these are automatically configured:
- `POSTGRES_URL` - Database connection string
- `POSTGRES_URL_NON_POOLING` - For migrations

Optional:
- `CRON_SECRET` - Secure cron endpoint authentication

## Features

- **Excel Paste Support:** Seamlessly paste tab-separated values from Excel into the estimates table
- **Fiscal Year Roll-Forward:** Automatically handles fiscal year transitions
- **IRR Calculation:** Calculates 5-year expected returns with partial year interpolation
- **Dynamic Column Headers:** Estimates table columns update based on fiscal year end date
- **Price Tracking:** Manual and automatic price refresh from Yahoo Finance
- **Submission Logging:** All submissions are logged with analyst initials and timestamps
- **Automated Cron Job:** Daily price refresh at market open (Pro plan required)

## Upgrading from Local Development

If migrating from the previous SQLite-based local setup:

1. Export your data from SQLite
2. Transform the data to PostgreSQL format
3. Import into Vercel Postgres using the Query console

## Notes

- Function timeout: 60 seconds (Pro plan), 10 seconds (Hobby plan)
- Cron jobs require Vercel Pro plan
- Stock prices refresh daily at 9 AM ET (14:00 UTC) on weekdays
- Companies need at least 6 years of estimates for 5-year IRR calculation
