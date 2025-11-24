# Trading Platform – Product and Technical Spec (v0)

## 1. Overview

### 1.1 Concept

This project is a **paper-trading web application** where a user can:

- Search and track instruments (for example, AAPL, TSLA, BTC-USD).
- Place market and limit orders.
- View open orders, positions, and historical trades.
- Watch a simulated “live” price feed update over time.
- Track profit and loss (PnL) over time.

The app uses simulated market data (at least initially) and a realistic brokerage-style workflow so it looks and feels like a real trading platform, but without any real-money integrations.

### 1.2 Goals

- A project that to explore:
  - A realistic, data-heavy dashboard.
  - Non-trivial domain modeling (orders, executions, positions, PnL).
  - Clean backend layering and testing.
  - Proper use of a monorepo with shared packages and tooling.

### 1.3 Non-goals

- No real brokerage or exchange integration in the initial version.
- No real money or external payments.
- No high-frequency trading or very low latency guarantees (this comes after MVP).
- No complex order types (for example, stop-loss, OCO) in the initial MVP.

---

## 2. Tech Stack

### 2.1 Monorepo

Use pnpm workspaces with a monorepo layout:

- `apps/web` – React frontend.
- `apps/api` – Node.js + Express backend.
- `packages/shared` – shared TypeScript types and Zod schemas.

This allows frontend and backend to share domain types and validation logic while keeping each app isolated.

### 2.2 Frontend

- **React 18 + TypeScript**
  - Main UI library.
  - Function components with hooks.
- **Redux Toolkit + RTK Query**
  - Redux Toolkit for local client state (for example, currently selected symbol, UI filters, user preferences).
  - RTK Query for API interaction (caching, loading states, invalidation).
- **React Router**
  - Client-side routing for pages like `/dashboard`, `/watchlist`, `/instrument/:symbol`, `/orders`, `/trades`, `/settings`.
- **Tailwind CSS**
  - Utility-first styling for fast iteration and manageable styles.
- **Zod + React Hook Form**
  - Form validation for auth, order entry, and settings using shared schemas.
- **Jest + React Testing Library**
  - Component and hook tests.

### 2.3 Backend

- **Node.js + Express + TypeScript**
  - HTTP API for auth, market data, orders, portfolio, etc.
- **Postgres**
  - Primary relational database for users, accounts, instruments, orders, executions, positions, and price history.
- **ORM / Query Layer**
  - A typed layer such as Prisma or Kysely for schema migrations and query building.
- **Zod**
  - Runtime validation for request bodies and responses using schemas shared with the frontend.
- **Jest + Supertest**
  - Unit tests for domain logic (for example, order validation, PnL calculations).
  - Integration tests for API endpoints.

### 2.4 Tooling

- pnpm – package manager and workspace management.
- ESLint + TypeScript ESLint – static analysis.
- Prettier – code formatting.
- Docker Compose – local Postgres (and later API and web containers).

---

## 3. Product Scope (Step 1)

### 3.1 User roles

- **Trader (user)**
  - Signs up and logs in.
  - Manages watchlists.
  - Places orders.
  - Views positions, orders, trades, and portfolio summary.
  - Adjusts basic settings (for example, display name, time zone display, base currency view).

More advanced roles (for example, admin) can be added later, but are not required for the MVP.

### 3.2 Core domain concepts

These concepts will be modeled in Postgres, shared TypeScript types, and Zod schemas.

1. **Instrument**
   - A tradable asset such as a stock, ETF, index, or crypto pair.
   - Example fields: `id`, `symbol`, `name`, `type (instrument_type)`, `currency`.

2. **Quote**
   - The current market view for an instrument.
   - Example fields: `instrumentId`, `lastPrice`, `bidPrice`, `askPrice`, `updatedAt`.
   - For the MVP, quotes can be derived from the latest `price_ticks` row per instrument.

3. **Account**
   - A trading account with balances.
   - Example fields: `id`, `userId`, `name`, `baseCurrency`, `startingBalance`, `cashBalance`.

4. **Order**
   - An instruction to buy or sell an instrument.
   - Example fields: `id`, `accountId`, `instrumentId`, `side`, `orderType`, `quantity`, `limitPrice`, `status`, `filledQuantity`, `averageFillPrice`, `rejectionReason`.

5. **Execution (Fill)**
   - A record of a portion (or all) of an order being filled.
   - Example fields: `id`, `orderId`, `accountId`, `instrumentId`, `quantity`, `price`, `executedAt`.

6. **Position**
   - The aggregated holding of a specific instrument within an account.
   - Example fields: `id`, `accountId`, `instrumentId`, `quantity`, `averagePrice`, `realizedPnl`.

7. **Watchlist**
   - A user-defined list of instruments to track.
   - Example fields: `id`, `userId`, `name`; plus join rows in `watchlist_instruments` for membership and ordering.

8. **Portfolio Snapshot**
   - A timestamped summary of an account’s total value and cash for charts.
   - Example fields: `id`, `accountId`, `totalValue`, `cashBalance`, `createdAt`.

9. **Price Tick**
   - A timestamped price for an instrument, used for quotes and charts.
   - Example fields: `id`, `instrumentId`, `price`, `volume`, `tickTime`.

### 3.3 MVP feature set

Group features into three large areas: auth and accounts, market data and watchlists, and trading and portfolio.

#### 3.3.1 Auth and account basics

- User registration and login.
- After login, the user gets a default paper-trading account with:
  - Configurable `startingBalance` (for example, 100,000 USD).
  - `cashBalance` initialized to the starting balance.
- Basic account settings:
  - Update display name.
  - Show base currency and starting balance.

#### 3.3.2 Market data and watchlists

- **Instrument search**
  - Search instruments by symbol or name (backed by `instruments` table).
- **Watchlist management**
  - Create one or more named watchlists.
  - Add or remove instruments from a watchlist.
  - Order instruments within a watchlist.
- **Watchlist view**
  - Table with symbol, name, last price, price change and percentage, and quick actions like “Trade” or “Remove”.
- **Price updates (simulated)**
  - Backend job or loop that periodically inserts `price_ticks` rows per instrument.
  - Frontend uses polling (for example, RTK Query `refetch` every N seconds) to keep prices fresh in the UI.

#### 3.3.3 Trading: orders, positions, portfolio

- **Order ticket**
  - Available from the watchlist or instrument detail page.
  - Fields:
    - Side: `BUY` or `SELL`.
    - Type: `MARKET` or `LIMIT`.
    - Quantity.
    - Limit price (if type is `LIMIT`).
  - Validation via Zod:
    - Quantity must be positive.
    - Limit price must be positive when required.
    - For buy orders, ensure sufficient cash.
    - For sell orders, ensure sufficient position quantity.

- **Order handling rules (MVP)**
  - **Market orders**:
    - Fill immediately at the current simulated last price (from `price_ticks`).
  - **Limit orders**:
    - If the current price is equal to or better than the limit, fill immediately.
    - Otherwise keep the order in `NEW` status until the simulation engine determines a fill condition (for example, price crossing the limit).

- **Positions and portfolio**
  - Positions view:
    - For each instrument: symbol, quantity, average price, current price, unrealized PnL.
  - Account summary:
    - Cash balance.
    - Market value of positions.
    - Total account value (cash + positions).
    - Daily and total PnL (simple versions are acceptable for MVP).

- **Orders and executions**
  - Open orders tab:
    - Shows non-final orders (for example, `NEW`, `PARTIALLY_FILLED`).
    - Allows canceling eligible orders.
  - Order history tab:
    - Shows all orders with status, createdAt, and instrument.
  - Trades (executions) tab:
    - Shows individual fills: instrument, side, quantity, price, executed time.

### 3.4 Screens and pages

These map to React Router routes.

#### 3.4.1 Auth

- `/login`
- `/register`

Simple forms with validation and calls to `/api/auth/login` and `/api/auth/register`.

#### 3.4.2 Dashboard

- Route: `/dashboard`
- Content:
  - Account summary (cash, total value, PnL).
  - Positions table.
  - Watchlist preview with link to full watchlist page.
  - Optional small equity-curve chart using `portfolio_snapshots`.

#### 3.4.3 Watchlist

- Route: `/watchlist`
- Content:
  - Search bar for instruments.
  - Full watchlist table with symbol, name, last price, change, change percent.
  - Actions to trade or remove instrument.
  - Switch between different watchlists if users have more than one.

#### 3.4.4 Instrument detail

- Route: `/instrument/:symbol`
- Content:
  - Header: symbol, name, type, last price, change, change percent.
  - Price chart (for example, last hour of simulated 1-minute ticks).
  - Key stats: high, low, approximate volume.
  - Order ticket (buy / sell) embedded on the page.
  - Historical price section (table or extended chart).

#### 3.4.5 Orders and trades

- Route: `/orders`
  - Tabs:
    - Open orders.
    - Order history.
- Route: `/trades`
  - Table of executions.

#### 3.4.6 Settings

- Route: `/settings`
- Content:
  - Update display name.
  - View base currency and starting balance.
  - Optionally reset the account back to starting balance (danger operation).

### 3.5 Stretch goals

Potential v2 enhancements:

- WebSocket or Server-Sent Events streaming for quotes instead of polling.
- Multi-account support per user with account switching in the UI.
- Time-in-force on orders (for example, Good-Till-Canceled, Immediate-Or-Cancel).
- Candlestick charts with multiple timeframes.
- Simple risk metrics (approximate volatility, beta-like approximations).
- Strategy backtesting using historical data.

---

## 4. Data Model (Step 2 – Postgres Schema)

### 4.1 Conventions

- **Primary keys**
  - Use `uuid` for primary keys, generated with `gen_random_uuid()`.
- **Timestamps**
  - Most tables use:
    - `created_at timestamptz NOT NULL DEFAULT now()`
    - `updated_at timestamptz NOT NULL DEFAULT now()`
- **Enums**
  - Postgres enums for strongly typed fields:
    - `order_side` – `'BUY' | 'SELL'`
    - `order_type` – `'MARKET' | 'LIMIT'`
    - `order_status` – `'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED'`
    - `instrument_type` – `'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX'`

Example setup:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TYPE order_side AS ENUM ('BUY', 'SELL');
CREATE TYPE order_type AS ENUM ('MARKET', 'LIMIT');
CREATE TYPE order_status AS ENUM (
  'NEW',
  'PARTIALLY_FILLED',
  'FILLED',
  'CANCELED',
  'REJECTED'
);

CREATE TYPE instrument_type AS ENUM ('STOCK', 'CRYPTO', 'ETF', 'INDEX');
```

### 4.2 Tables

#### 4.2.1 `users`

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  password_hash text NOT NULL,
  display_name text NOT NULL,
  role text NOT NULL DEFAULT 'TRADER',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- Each user can have one or more accounts.
- `password_hash` stores a bcrypt or argon2 hash.

#### 4.2.2 `accounts`

```sql
CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL,
  base_currency text NOT NULL,
  starting_balance numeric(18, 2) NOT NULL,
  cash_balance numeric(18, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_accounts_user_id ON accounts (user_id);
```

- Represents a paper-trading account.
- `cash_balance` is updated as trades occur.

#### 4.2.3 `instruments`

```sql
CREATE TABLE instruments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol text NOT NULL UNIQUE,
  name text NOT NULL,
  instrument_type instrument_type NOT NULL,
  currency text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

- Stores the tradeable universe.
- `symbol` should be globally unique (`AAPL`, `BTC-USD`, etc.).

#### 4.2.4 `watchlists` and `watchlist_instruments`

```sql
CREATE TABLE watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, name)
);

CREATE TABLE watchlist_instruments (
  watchlist_id uuid NOT NULL REFERENCES watchlists (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  position_in_watchlist integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (watchlist_id, instrument_id)
);
```

- `watchlists` are owned by a user.
- `watchlist_instruments` is a join table with ordering info.

#### 4.2.5 `orders`

```sql
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments (id) ON DELETE RESTRICT,
  side order_side NOT NULL,
  order_type order_type NOT NULL,
  quantity numeric(18, 6) NOT NULL,
  limit_price numeric(18, 6),
  status order_status NOT NULL DEFAULT 'NEW',
  filled_quantity numeric(18, 6) NOT NULL DEFAULT 0,
  average_fill_price numeric(18, 6),
  rejection_reason text,
  client_order_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_account_id_created_at
  ON orders (account_id, created_at DESC);

CREATE INDEX idx_orders_instrument_id_created_at
  ON orders (instrument_id, created_at DESC);

CREATE INDEX idx_orders_status ON orders (status);
```

- Core trading instruction table.
- `filled_quantity` and `average_fill_price` are maintained as executions are inserted.
- `client_order_id` can be used by the frontend for idempotency or tracking.

#### 4.2.6 `executions`

```sql
CREATE TABLE executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments (id) ON DELETE RESTRICT,
  quantity numeric(18, 6) NOT NULL,
  price numeric(18, 6) NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_executions_account_id_executed_at
  ON executions (account_id, executed_at DESC);

CREATE INDEX idx_executions_instrument_id_executed_at
  ON executions (instrument_id, executed_at DESC);
```

- Each row represents a fill for an order.
- Source of truth for trade history and realized PnL.

#### 4.2.7 `positions`

```sql
CREATE TABLE positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  instrument_id uuid NOT NULL REFERENCES instruments (id) ON DELETE RESTRICT,
  quantity numeric(18, 6) NOT NULL,
  average_price numeric(18, 6) NOT NULL,
  realized_pnl numeric(18, 6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (account_id, instrument_id)
);

CREATE INDEX idx_positions_account_id ON positions (account_id);
```

- Summarizes the holdings per instrument per account.
- Unrealized PnL is derived on the fly using the latest price.

#### 4.2.8 `price_ticks`

```sql
CREATE TABLE price_ticks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  instrument_id uuid NOT NULL REFERENCES instruments (id) ON DELETE CASCADE,
  price numeric(18, 6) NOT NULL,
  volume numeric(18, 6),
  tick_time timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_price_ticks_instrument_time
  ON price_ticks (instrument_id, tick_time DESC);
```

- Stores price events used to derive quotes and to power charts.

#### 4.2.9 `portfolio_snapshots`

```sql
CREATE TABLE portfolio_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts (id) ON DELETE CASCADE,
  total_value numeric(18, 2) NOT NULL,
  cash_balance numeric(18, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_portfolio_snapshots_account_time
  ON portfolio_snapshots (account_id, created_at DESC);
```

- Used to render an equity curve on the dashboard and for historical portfolio analysis.

### 4.3 Relationships (summary)

- `users` → `accounts`: one-to-many.
- `accounts` → `orders`, `positions`, `executions`, `portfolio_snapshots`: one-to-many.
- `instruments` → `orders`, `positions`, `executions`, `price_ticks`: one-to-many.
- `users` → `watchlists`: one-to-many.
- `watchlists` ↔ `instruments`: many-to-many through `watchlist_instruments`.

---

## 5. API Design (REST)

Assume JWT-based auth:

- Requests include `Authorization: Bearer <token>`.
- Middleware verifies the token, extracts `userId`, and attaches it to the request as `authenticatedUserId`.

### 5.1 Auth endpoints

#### POST `/api/auth/register`

- **Request body**
  - `email: string`
  - `password: string`
  - `displayName: string`
- **Behavior**
  - Validate input with Zod.
  - Hash password.
  - Create user and default account in a transaction.
- **Response**
  - User info and a JWT.

#### POST `/api/auth/login`

- **Request body**
  - `email: string`
  - `password: string`
- **Behavior**
  - Validate input.
  - Verify credentials.
- **Response**
  - JWT and user info.

#### GET `/api/auth/me`

- **Behavior**
  - Returns current authenticated user and optionally default account id.

### 5.2 Instrument and market data endpoints

#### GET `/api/instruments`

- **Query parameters**
  - `search?: string`
  - `limit?: number` (default 20)
- **Response**
  - List of instruments (id, symbol, name, instrumentType, currency).

#### GET `/api/instruments/:instrumentId`

- **Response**
  - Instrument details.

#### GET `/api/instruments/:instrumentId/price-history`

- **Query parameters**
  - `interval?: '1m' | '5m' | '1h'` (or similar)
  - `from?: ISO timestamp`
  - `to?: ISO timestamp`
- **Response**
  - List of price points or aggregated candlesticks.

#### GET `/api/quotes`

- **Query parameters**
  - `instrumentIds: string` (comma-separated list of ids)
- **Response**
  - Map of instrument id to latest quote information (for example, lastPrice, updatedAt).

### 5.3 Watchlist endpoints

All require authentication.

#### GET `/api/watchlists`

- **Response**
  - List of watchlists (id, name).

#### POST `/api/watchlists`

- **Body**
  - `{ name: string }`
- **Response**
  - Created watchlist.

#### GET `/api/watchlists/:watchlistId`

- **Response**
  - Watchlist details and associated instruments, potentially including latest quotes.

#### POST `/api/watchlists/:watchlistId/instruments`

- **Body**
  - `{ instrumentId: string }`
- **Response**
  - Updated watchlist membership state.

#### DELETE `/api/watchlists/:watchlistId/instruments/:instrumentId`

- Removes an instrument from the watchlist.

### 5.4 Accounts and portfolio endpoints

#### GET `/api/accounts`

- **Response**
  - List of accounts owned by the current user.

#### GET `/api/accounts/:accountId/summary`

- **Response**
  - Account summary including:
    - `cashBalance`
    - `totalValue`
    - `unrealizedPnl`
    - `realizedPnl`
    - Possibly a small subset of positions.

#### GET `/api/accounts/:accountId/positions`

- **Response**
  - List of positions augmented with current prices and unrealized PnL.

#### GET `/api/accounts/:accountId/snapshots`

- **Query parameters**
  - `from?: ISO timestamp`
  - `to?: ISO timestamp`
- **Response**
  - List of portfolio snapshots (for equity curve charting).

### 5.5 Orders and trades endpoints

#### GET `/api/accounts/:accountId/orders`

- **Query parameters**
  - `status?: string` (for example, `OPEN`, `FILLED`, etc. – mapped to one or more `order_status` values)
  - Pagination: for example, `page?: number`, `pageSize?: number` or cursor-based.
- **Response**
  - Paged list of orders for that account.

#### POST `/api/accounts/:accountId/orders`

- **Body** (validated via shared Zod schema):

```ts
{
  instrumentId: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  quantity: number;
  limitPrice?: number;
  clientOrderId?: string;
}
```

- **Behavior**
  - Validate input with Zod.
  - Ensure account belongs to the authenticated user.
  - For BUY: verify sufficient cash based on order type.
  - For SELL: verify sufficient position quantity.
  - Insert order row.
  - For market orders or immediately-fillable limit orders:
    - Insert execution(s).
    - Update `orders`, `positions`, and `accounts` in a transaction.
- **Response**
  - Created order, including any immediate executions and final status.

#### POST `/api/orders/:orderId/cancel`

- **Behavior**
  - Check that the order belongs to the authenticated user (through its account).
  - Only allow cancel for `NEW` or `PARTIALLY_FILLED` orders.
  - Update status to `CANCELED`.
- **Response**
  - Updated order.

#### GET `/api/accounts/:accountId/trades`

- **Response**
  - Trade history (executions) for the account.

---

## 6. Shared Types and Validation

The project uses Zod schemas stored in `packages/shared` to define domain shapes and request payloads once, and then uses them in both backend and frontend.

### 6.1 Example: order creation schema

```ts
// packages/shared/src/orderSchemas.ts
import { z } from 'zod';

export const OrderSideSchema = z.enum(['BUY', 'SELL']);
export const OrderTypeSchema = z.enum(['MARKET', 'LIMIT']);

export const OrderCreateInputSchema = z.object({
  instrumentId: z.string().uuid(),
  side: OrderSideSchema,
  orderType: OrderTypeSchema,
  quantity: z.number().positive(),
  limitPrice: z.number().positive().optional(),
  clientOrderId: z.string().optional()
}).refine(
  (value) => value.orderType === 'MARKET' || value.limitPrice !== undefined,
  {
    message: 'Limit price is required for limit orders.',
    path: ['limitPrice']
  }
);

export type OrderCreateInput = z.infer<typeof OrderCreateInputSchema>;
```

### 6.2 Usage

- **Backend**
  - Controllers call `OrderCreateInputSchema.parse(request.body)` to validate input.
  - Parsed result is strongly typed as `OrderCreateInput` for service layers.
- **Frontend**
  - React Hook Form integrates with `OrderCreateInputSchema` for client-side validation.
  - TypeScript uses `OrderCreateInput` to ensure the UI builds valid payloads.

This approach keeps the contract between frontend and backend single-sourced, type-safe, and runtime-validated.

---

## 7. Document Classification

This markdown file functions as a combined Product and Technical Specification for the trading platform. It includes:

- **Product requirements** (feature scope, user flows, screens).
- **Domain model** (core concepts and relationships).
- **Database design** (Postgres schema).
- **API design** (REST endpoints and payloads).
- **Implementation details** (tech stack, shared validation strategy).