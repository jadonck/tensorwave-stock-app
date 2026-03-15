# Tech Stock Explorer

Built for the TensorWave Software Engineering Internship Code Challenge. This is a Next.js application that displays stock market data for 15 tech companies using the Alpha Vantage API.

## Features

- **Homepage**: Browse through 15 different tech stock cards that include company logos, names, and sector

- **Stock Detail Pages**: Includes both company overview and historical price data (within 30 trading days) with all necessary data included

- **Interactive Price Chart**: 30 day price trend line chart with coloring based on performance over the period

- **Responsive Design**: Fully responsive layout that allows for ease of use on any platform or device

- **Loading Animation**: Animated loading screen shown to allow for proper buffer in between API fetches

- **Caching**: Checks for live price data first through Alpha Vantage, if API key is out of uses for the time being, it will fallback onto already cached data

- **Data Timestamp**: Each individual stock page will show the date of the most up to date stock data that is displayed to avoid confusion on the data shown. Useful if a key is unavailable for use and cannot fetch any live data

- **Invalid Stock Search**: Navigating to a stock that is not included in the list of 15 will take you to a screen that informs you the stock is not included. There is also an arrow to redirect back to the main menu


## Getting Started

> **Note:** The following instructions are  for Windows. If using Mac or Linux, you can replace `copy` with `cp`.

### Prerequisites

- Node.js version 18+
- An Alpha Vantage API key, free at
(https://www.alphavantage.co/support/#api-key)

### Installation

```bash
git clone https://github.com/jadonck/tensorwave-stock-app.git
cd tensorwave-stock-app
npm install
```

### Environment Setup (for API key)

Copy the example env file and add your API key:

```bash
copy .env.example .env.local
```

Once done, open `.env.local` and replace `your_api_key_here` with your personal Alpha Vantage API key.

> **Note:** Even without an API key, the app will still function, it will simply have outdated stock data and information. The API key creates the ability to have up to date and live information on click.

### Run Development Server

```bash
npm run dev
```

After running, you can now paste (http://localhost:3000) into the browser.

### Run Tests (optional)

```bash
npm test
```

These are the testbenches I created with Claude used to test all functionality of my application without wasting limited API fetches. The tests cover formatting, API integration, component rendering, and edge cases.

## Handling the API Rate Limit

### The Problem

The main issue I ran into during the duration of this assignment was with the free tier version of the Alpha Vantage API Key. The free tier allows for only **25 requests per day**, as well as a strict **1 request per second** restriction. With 15 stocks requiring 2 API calls each (company overview and time series daily), viewing all live stock data in a single sitting is not possible.

### The Solution

I solved this problem by realizing I need to mitigate any unnecessary fetches made by the API key. This included preloading the home page with stored data. This removed any need for an initial fetch. I also created a dynamic cache which stores up to date data on these 15 stocks as of March 13th, 2026. This data is shown to the user when there is no API key in use, or when an API key has reached its limit. When a key is being used and is actively retrieving up to date information, it will write over the existing cache.


1. **If the API works** — updates the cache and displays fresh data

2. **If the API fails or does not exist** — falls back to the most recent cached data

The cached data is stored as JSON files in the `.cache/` directory. 


- **With an API key**, clicking any stock will attempt to fetch the latest data and updates the cache

- **If the key runs out**, remaining stocks fall back to cached data, no errors are shown on the webpage and no blank data is shown. (However the error will be shown in the command prompt with a brief message)

- **"Data as of" label**: each separate page shows the date of the most recent data point, so it is always transparent when the data is from and there is no confusion

### Rate Limit Solution

The app includes a 2 second delay between API calls to abide by the Alpha Vantage rate limit of 1 request per second. When using the cache, the delay is reduced to half a second for a smoother transition.

## Tech Stack

- **Framework:** Next.js 16 (App Router and Server Components)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts (AreaChart with gradient fill)
- **Testing:** Jest 30 + React Testing Library (105 tests across 5 suites)
- **API:** Alpha Vantage (Company Overview + Time Series Daily)

## Test Suite

The project includes 105 tests across 5 test files:

| File | Tests | Description |
|------|-------|-------------|
| `alphavantage-utils.test.ts` | 20 | Formatting functions (currency, numbers, market cap, percentages, N/A fallbacks) |
| `alphavantage-api.test.ts` | 13 | API integration with mocked fetch (success, errors, rate limits, caching, URL params) |
| `components.test.tsx` | 17 | Component rendering (StockLogo, HomePage cards, PriceHistoryChart) |
| `edge-cases.test.tsx` | 48 | Edge cases with predetermined data (null overview, empty fields, trillion market cap, flat/down trends, penny stocks, zero % change, single data point) |
| `stocks.test.ts` | 7 | Stock metadata validation (15 stocks, no duplicates, valid URLs, required fields) |

## Project Structure

```
app/
├── page.tsx                    # Homepage
├── globals.css                 # Styling
└── stocks/[symbol]/
    ├── page.tsx                # Stock detail page
    └── loading.tsx             # Loading animation
components/
├── PriceHistoryChart.tsx       # Price Chart
└── StockLogo.tsx               # Logos with fallbacks
lib/
├── alphavantage.ts             # API client, caching, and formatters
└── stocks.ts                   # Stock metadata
__tests__/
├── alphavantage-utils.test.ts  # Formatting utility tests
├── alphavantage-api.test.ts    # API integration tests
├── components.test.tsx         # Component rendering tests
├── edge-cases.test.tsx         # Edge case and special value tests
└── stocks.test.ts              # Stock metadata validation
.cache/                         # Populated cache for stocks
```

## Development Process

This project was developed with the assistance of Claude (AI) for code generation and test creation. All design decisions, architectural choices, manual testing, and bug identification were performed by me. I directed and guided each feature, reviewed all generated code, and ensured correctness through trial and error while testing.