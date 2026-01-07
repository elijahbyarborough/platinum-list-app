# Platinum List Stock Valuation Web App

## Overview
Build a local web application for tracking expected returns on a watchlist of stocks called the "Platinum List." The app has two main views: a **Submission Page** for entering/editing company estimates, and a **Dashboard** displaying all companies with their calculated 5-year expected returns (IRRs).

## Tech Stack
- **Frontend:** React with TypeScript
- **Backend:** Node.js with Express
- **Database:** SQLite (for local development, structured for easy migration to PostgreSQL later)
- **Stock Price API:** Yahoo Finance (unofficial) or Alpha Vantage free tier

---

## Data Model

### Company Table
```
- id (primary key)
- ticker (string, unique)
- company_name (string)
- fiscal_year_end_date (date) // e.g., 2026-12-31
- metric_type (enum: 'EPS', 'FCFPS', 'Distributable Earnings', 'P/B', 'P/NAV')
- current_stock_price (decimal, nullable)
- price_last_updated (timestamp, nullable)
- scenario (enum: 'base', 'bull', 'bear', default 'base') // for future use
- analyst_initials (enum: 'EY', 'TR', 'JM', 'BB', 'NM')
- created_at (timestamp)
- updated_at (timestamp)

// 11 years of metric estimates (store NULL for blank years)
- fy1_metric (decimal, nullable)
- fy2_metric (decimal, nullable)
- fy3_metric (decimal, nullable)
- fy4_metric (decimal, nullable)
- fy5_metric (decimal, nullable)
- fy6_metric (decimal, nullable)
- fy7_metric (decimal, nullable)
- fy8_metric (decimal, nullable)
- fy9_metric (decimal, nullable)
- fy10_metric (decimal, nullable)
- fy11_metric (decimal, nullable)

// 11 years of dividend per share estimates (store NULL for blank years)
- fy1_div (decimal, nullable)
- fy2_div (decimal, nullable)
- fy3_div (decimal, nullable)
- fy4_div (decimal, nullable)
- fy5_div (decimal, nullable)
- fy6_div (decimal, nullable)
- fy7_div (decimal, nullable)
- fy8_div (decimal, nullable)
- fy9_div (decimal, nullable)
- fy10_div (decimal, nullable)
- fy11_div (decimal, nullable)
```

NULL values represent years where the user did not provide estimates. The UI should display these as blank cells, never as "NULL" or "#N/A".

### Exit Multiples Table
```
- id (primary key)
- company_id (foreign key)
- time_horizon_years (integer) // e.g., 3, 5, 10
- multiple (decimal)
```

### Submission Log Table (for historical tracking later)
```
- id (primary key)
- company_id (foreign key)
- analyst_initials (enum: 'EY', 'TR', 'JM', 'BB', 'NM')
- submitted_at (timestamp)
- snapshot_data (JSON) // stores full estimate state at time of submission
```

---

## Submission Page

### Form Fields
1. **Ticker** (text input) - when entered, attempt to fetch company name from API
2. **Company Name** (text input, auto-populated but editable)
3. **Next Fiscal Year End Date** (date picker) - e.g., December 31, 2026
4. **Metric Type** (dropdown): EPS, FCFPS, Distributable Earnings, P/B, P/NAV
5. **Analyst** (dropdown): EY, TR, JM, BB, NM

### Estimates Input (Pasteable from Excel)
- Two input areas that accept tab-separated values pasted from Excel
- **Row 1: Metric estimates** (up to 11 values)
- **Row 2: Dividends per share** (up to 11 values)
- Users may paste fewer than 11 values; remaining columns stay blank
- After paste, display as an editable table with columns labeled dynamically based on fiscal year end date:
  - If FYE is December 31, 2026, columns are: FY 2026, FY 2027, FY 2028... FY 2036
  - Column headers auto-generate based on the entered fiscal year end date

### Exit Multiples Input
- For now, single input field: **5-Year Exit Multiple**
- Structure the backend to support multiple time horizons (3, 5, 10 years) for future expansion

### Submit Button
- Saves all data to database
- Records submission in log with analyst initials and timestamp
- If company already exists (by ticker), update existing record

---

## Dashboard Page

### Display
- Table showing all companies in the Platinum List
- Columns:
  - Ticker
  - Company Name
  - Current Price (with "last updated" timestamp on hover)
  - 5-Year Exit Multiple
  - 5-Year Expected Return (IRR) - formatted as percentage
  - Last Updated (date estimates were last submitted)
  - Analyst (initials of last person to update)

### Validation & Warnings
- If a company lacks sufficient estimates for the 5-year interpolated IRR (requires estimates through year 6), display a warning indicator instead of an IRR value (e.g., "—" with tooltip)
- Tooltip on hover: "Needs at least 6 years of estimates for 5-year IRR"
- These companies still appear in the table but sort to the bottom when sorting by IRR

### Functionality
- **Sort** by clicking column headers (especially IRR - highest to lowest, lowest to highest)
- **Refresh Prices** button - manually triggers stock price refresh for all companies
- Click on any row to navigate to the Submission Page pre-populated with that company's data for editing

---

## Calculation Logic

### Fiscal Year Roll-Forward
The app must handle fiscal year transitions automatically:
- Store the **next fiscal year end date** (e.g., December 31, 2026)
- When the current date passes that FYE date:
  - Year 1 estimates become stale (Year 1 is now historical)
  - The "current fiscal year" rolls forward by one
  - All year references shift: what was Year 2 is now Year 1, etc.
  - The fiscal year end date stored should be interpreted as "FY 2026 ends on this date"
- Example: If FYE is December 31, 2026, and today is December 15, 2026, then FY 2026 is Year 1. On January 1, 2027, FY 2027 becomes Year 1.

### Partial Year Interpolation
To calculate the "5-year forward" estimate on any given date:

1. Calculate **years remaining in current fiscal year**:
   - `yearFraction = (FYE date - today) / 365`
   
2. The **5-year forward metric** is interpolated:
   - If `yearFraction = 1.0` (start of fiscal year), use 100% of Year 5 estimate
   - If `yearFraction = 0.5` (mid-fiscal year), use 50% of Year 5 + 50% of Year 6
   - Formula: `interpolatedMetric = (yearFraction × Year5) + ((1 - yearFraction) × Year6)`

3. Same interpolation applies to the final year's dividend in the sum

### Expected Return (IRR) Calculation

```
Inputs:
- currentPrice: fetched from API
- interpolatedMetric: calculated as above for 5-year horizon
- exitMultiple: the 5-year exit multiple
- dividends[]: array of DPS for years 1-5 (with year 5 interpolated)

Calculations:
1. futurePrice = interpolatedMetric × exitMultiple

2. priceCAGR = (futurePrice / currentPrice)^(1/5) - 1

3. totalDividends = sum of dividends for years 1 through 5
   - Year 5 dividend is interpolated same as metric
   - totalDividends = div1 + div2 + div3 + div4 + (yearFraction × div5 + (1-yearFraction) × div6)

4. avgDividendYield = (totalDividends / 5) / currentPrice

5. expectedReturn = priceCAGR + avgDividendYield
```

---

## API Integration

### Stock Price Fetching
- Use Yahoo Finance unofficial API or Alpha Vantage
- Fetch current price by ticker symbol
- Store price and timestamp in database
- Only refresh when user clicks "Refresh Prices" button (not automatic)
- Handle errors gracefully (show "Price unavailable" if API fails)

### Company Name Lookup
- When user enters ticker on submission form, attempt to fetch company name
- Auto-populate but allow manual override

---

## UI/UX Requirements

1. **Excel Paste Experience**: The estimates input must seamlessly accept a paste from Excel. User copies up to 11 cells horizontally in Excel, pastes into the input, and it parses correctly. Fewer than 11 values is fine—remaining columns display as blank.

2. **Clean, Professional Design**: Use a component library like shadcn/ui or similar. Financial app aesthetic - clean tables, readable numbers, proper decimal formatting.

3. **Number Formatting**: 
   - Prices: $XXX.XX
   - IRR/Returns: XX.X%
   - Multiples: XX.Xx

4. **Blank Handling**: NULL values in the database must display as empty cells in the UI. Never show "NULL", "undefined", "N/A", or "#N/A".

5. **Responsive but Desktop-First**: Optimize for desktop use; mobile is secondary.

---

## Future Expansion Hooks (Build Structure Now, Don't Fully Implement)

1. **Bull/Base/Bear Scenarios**: The `scenario` field exists in the data model. UI only shows "base" for now, but the architecture supports adding scenario toggles later.

2. **Historical Tracking**: The submission log table captures snapshots. Don't build a historical view UI yet, but ensure every save creates a log entry.

3. **Multiple Time Horizons**: Exit multiples table supports multiple horizons. Dashboard only shows 5-year for now, but the calculation engine should be parameterized to accept any horizon.

4. **Web Deployment**: Use environment variables for configuration. No hardcoded localhost references in production code paths.

---

## File Structure Suggestion
```
/client
  /src
    /components
    /pages
      Dashboard.tsx
      SubmissionForm.tsx
    /hooks
    /utils
      calculations.ts  // IRR calculation logic
      fiscalYear.ts    // FY roll-forward logic
/server
  /routes
  /models
  /services
    stockPriceService.ts
  database.sqlite
```

---

## Acceptance Criteria

1. User can add a new company with up to 11 years of estimates by pasting from Excel
2. Pasting fewer than 11 values leaves remaining years blank (not errored)
3. User can set exit multiple for 5-year horizon
4. Dashboard displays all companies sorted by 5-year IRR
5. Companies with insufficient estimates for 5-year IRR show a warning instead of a value
6. Stock prices refresh only when manually triggered
7. Fiscal year labels update correctly based on entered FYE date
8. IRR calculation correctly interpolates for partial years
9. Editing an existing company updates the record and logs the change
10. Blank/NULL values display as empty cells throughout the UI
