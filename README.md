# Platinum List - Stock Valuation Web App

A full-stack web application for tracking expected returns on a watchlist of stocks called the "Platinum List." The app calculates 5-year expected returns (IRRs) based on company estimates, fiscal year data, and exit multiples.

## Tech Stack

- **Frontend:** React 18 + TypeScript + Vite + shadcn/ui + Tailwind CSS
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (easily migratable to PostgreSQL)
- **Stock Price API:** Yahoo Finance (via `yahoo-finance2` package)

## Project Structure

```
Platinum-List-App/
├── client/          # React frontend application
├── server/          # Express backend API
├── database.sqlite  # SQLite database (created on first run)
└── SPEC.md          # Detailed specification
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

1. **Clone the repository** (if applicable)

2. **Install server dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Install client dependencies:**
   ```bash
   cd ../client
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm run dev
   ```
   The server will start on `http://localhost:3001` and automatically initialize the database on first run.

2. **Start the frontend development server:**
   ```bash
   cd client
   npm run dev
   ```
   The client will start on `http://localhost:3000` and proxy API requests to the backend on port 3001.

3. **Open your browser:**
   Navigate to `http://localhost:3000`

## Usage

### Adding a Company

1. Click "Add New Company" on the dashboard
2. Enter the ticker symbol (e.g., "AAPL")
3. The company name will be auto-fetched from Yahoo Finance
4. Select the fiscal year end date
5. Choose the metric type (EPS, FCFPS, etc.)
6. Select the analyst initials
7. Enter the 5-year exit multiple
8. Paste estimates from Excel:
   - Copy a row of metrics from Excel (up to 11 values, tab-separated)
   - Click in the "Metrics" row of the estimates table
   - Paste (Cmd+V / Ctrl+V)
   - Repeat for dividends row
9. Click "Save Company"

### Editing a Company

1. Click on any company row in the dashboard table
2. Make your changes
3. Click "Save Company"

### Refreshing Stock Prices

1. Click "Refresh Prices" on the dashboard
2. Prices will be updated for all companies from Yahoo Finance

### Sorting

Click on any column header to sort by that field. Click again to reverse the sort order.

## Features

- **Excel Paste Support:** Seamlessly paste tab-separated values from Excel into the estimates table
- **Fiscal Year Roll-Forward:** Automatically handles fiscal year transitions
- **IRR Calculation:** Calculates 5-year expected returns with partial year interpolation
- **Dynamic Column Headers:** Estimates table columns update based on fiscal year end date
- **Price Tracking:** Manual price refresh from Yahoo Finance API
- **Submission Logging:** All submissions are logged with analyst initials and timestamps

## API Endpoints

### Companies

- `GET /api/companies` - List all companies with calculated IRRs
- `GET /api/companies/:ticker` - Get single company by ticker
- `POST /api/companies` - Create or update company (upsert by ticker)

### Prices

- `POST /api/prices/refresh-all` - Refresh prices for all companies
- `POST /api/companies/:ticker/refresh-price` - Refresh single company price

## Environment Variables

Create a `.env` file in the `server` directory (optional):

```
PORT=3001
```

Create a `.env` file in the `client` directory (optional):

```
VITE_API_URL=http://localhost:3001/api
```

## Database

The SQLite database (`database.sqlite`) is automatically created in the project root on first server run. The schema includes:

- **companies** - Company data with 11 years of metrics and dividends
- **exit_multiples** - Exit multiples by time horizon
- **submission_logs** - Historical submission snapshots

## Development

### Backend Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Run production build

### Frontend Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Notes

- Stock prices are only refreshed manually (not automatic)
- Companies need at least 6 years of estimates for 5-year IRR calculation
- NULL/blank values are displayed as empty cells, never as "NULL" or "N/A"
- The app is optimized for desktop use

## Future Enhancements

- Bull/Base/Bear scenario support (structure in place)
- Historical tracking UI (logging in place)
- Multiple time horizon views (3, 5, 10 years)
- Web deployment configuration

