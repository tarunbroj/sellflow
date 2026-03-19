# Selfflow / Sellflow Architecture Memory

> Last updated: 2026-03-18 (rev 5)
> Purpose: persistent, incrementally updatable architecture and security memory for this repository.

## 0) Safety Check (secrets/risky files before sharing)

### Findings
- `android/app/debug.keystore` exists in the repo. This is a debug signing key and should never be reused for production signing. Treat as non-secret for debug only, but do **not** use in release workflows.
- No `.env` files, `.pem`, `.p12`, `.key`, or `.jks` files were found in the repository root tree scan.
- The current setup intentionally uses `EXPO_PUBLIC_*` variables for Shopify/customer endpoints and tokens, which means these values are available in the client bundle by design. This is acceptable for Storefront public tokens, but **not** acceptable for Admin API secrets.

### Redaction/rotation guidance
- If any real production credentials were ever inserted into `EXPO_PUBLIC_*`, rotate them and move sensitive credentials to a server-side backend.
- Keep only non-sensitive/public client IDs/tokens in Expo public env vars.
- Ensure release signing keys are kept outside git (CI secret vault, secure storage).

---

## 1) Project identity (framework, runtime, package manager)

## Framework/runtime identification
This is a **React Native + Expo** application using **Expo Router** for file-based routing, with optional web support (React Native Web), not Next.js/Remix/Hydrogen app-runtime.

### Evidence
- `expo`, `react-native`, `expo-router` dependencies in `package.json`.
- Entrypoint `index.ts` imports `expo-router/entry`.
- Mobile native folders exist (`android/`, `ios/`) consistent with Expo prebuild/native projects.
- App routes are in `app/` with Expo Router conventions (`_layout.tsx`, dynamic routes `[id].tsx`, route groups `(tabs)`).

## Shopify stack
- Uses `@shopify/hydrogen-react` and `@shopify/storefront-api-client` inside RN app.
- GraphQL codegen config (`.graphqlrc.ts`) targets **Storefront API** with `ApiType.Storefront`.
- Checkout uses `@shopify/checkout-sheet-kit` for native checkout flow.

## Package manager and scripts
- Package manager standardized on **npm** (`package-lock.json` retained, `bun.lock` removed).
- Main scripts:
  - `npm run start` → `expo start`
  - `npm run android` / `npm run ios` / `npm run web`
  - `npm run lint` → `expo lint`
  - `npm run test` → `jest --watchAll`
  - `npm run graphql-codegen`

---

## 2) How to run (dev/build/test)


## Working memory rule
- Read `PROJECT_CONTEXT.md` first for quick context before deeper repository scans.

---

## Recommended local setup
1. Install Node 18+ (prefer matching Expo SDK 53 guidance).
2. Install deps: `npm install` (or keep one package manager strategy and remove extra lockfile drift).
3. Configure env vars (currently expected with `EXPO_PUBLIC_*` names).
4. Start:
   - Dev server: `npm run start`
   - iOS: `npm run ios`
   - Android: `npm run android`
   - Web: `npm run web`

## Validation commands
- Lint: `npm run lint`
- Tests: `npm test` (watch mode by default)
- GraphQL types: `npm run graphql-codegen`

---

## 3) Repo map (directory responsibilities)

## Top-level directory map
- `app/` — Expo Router route tree (screens, layouts, dynamic routes).
- `components/` — UI and feature components (cart/product/header/filter etc).
- `components/shopify/` — cart provider/state machine/actions.
- `shopify/` — Shopify API query helpers (product/search/order/user/cart/client/home).
- `lib/` — shared libs (auth/session/storage/env/i18n/utils).
- `styles/` — Unistyles theme setup.
- `types/` — generated storefront types + schema artifacts.
- `locales/` — i18n message catalogs.
- `android/`, `ios/` — native platform projects for Expo build/runtime.
- `.maestro/` — mobile E2E flow scripts.
- `docs/` — operational docs for MVP scope and task workstreams.

## Route/entry map (main navigation)
- Root layout: `app/_layout.tsx`
- Tabs layout: `app/(tabs)/_layout.tsx`
- Main tabs:
  - `app/(tabs)/index.tsx` (product listing/home)
  - `app/(tabs)/cart.tsx`
  - `app/(tabs)/profile.tsx` (auth/account entry)
- Additional routes:
  - `app/product/[id].tsx`
  - `app/order/[id].tsx`
  - `app/orders.tsx`
  - `app/account.tsx`

## How to navigate the code
1. Start at `app/_layout.tsx` to understand provider wiring (React Query, ShopifyProvider, CartProvider, i18n, theme).
2. Follow route entry in `app/(tabs)/_layout.tsx` then inspect each screen.
3. For data access, go to `shopify/*.ts`.
4. For auth/session, inspect `lib/auth.ts` and `lib/storage.ts`.
5. For cart behavior, inspect `components/shopify/CartProvider.tsx` + `useCartAPIStateMachine.ts`.

---

## 4) Data flow (Shopify + backend + auth/session)

- Home is CMS-driven via Storefront Metaobjects (`home_page` + section metaobjects) with fallback to static catalog grid when config is unavailable.

## Storefront product/search/cart flow
- `ShopifyProvider` is configured in root layout with:
  - `EXPO_PUBLIC_STORE_DOMAIN`
  - `EXPO_PUBLIC_STORE_TOKEN`
- Storefront calls are made via `shopify/client.ts` using `createStorefrontApiClient`.
- Product/search queries are done in `shopify/product.ts` and `shopify/search.ts`.
- Cart uses cart state machine/provider in `components/shopify/*`.

## Customer account flow
- OAuth via `expo-auth-session` in `app/(tabs)/profile.tsx` and `lib/auth.ts`.
- Tokens (`idToken`, `accessToken`, `refreshToken`) persisted in MMKV (`lib/storage.ts`).
- Customer shop scheme env supports canonical `EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID` and legacy alias `EXPO_PUBLIC_CUSTOMER_SHOP_ID`.
- Customer account GraphQL requests go to `EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT` in `shopify/user.ts` and `shopify/order.ts` with `Authorization: accessToken` header.

## Auth/session observations
- Refresh flow exists (`refreshUser`) but some query flows call refresh and then reuse stale closure token values; consider centralizing token refresh + retry.
- Logout in `app/account.tsx` calls revocation endpoint with query param `id_token_hint`.

---

## 5) Key modules & hotspots

## Size snapshot (current)
- Total tracked files: ~138.
- Type counts (selected):
  - `.tsx`: 41 files / 5,658 lines
  - `.ts`: 20 files / 10,886 lines (includes generated storefront types)
  - `.js`: 5 files / 70 lines

## Biggest modules (LOC, TS/TSX/JS/JSX)
1. `types/storefront.types.d.ts` (~8,991 lines, generated)
2. `components/shopify/CartProvider.tsx` (~539)
3. `components/shopify/useCartAPIStateMachine.ts` (~460)
4. `components/BottomSheetProvider.tsx` (~369)
5. `components/Header.tsx` (~334)

## Most imported internal modules (quick reference density)
- `@/lib/storage` (highest import frequency)
- `@/lib/utils`
- `@/lib/auth`

Interpretation: storage/auth/cart modules are central touchpoints and highest risk for regressions.

---

## 6) Security & vulnerability notes

## Current security posture risks
1. **Client-exposed env vars by design (`EXPO_PUBLIC_*`)**
   - Safe for Storefront public token.
   - Unsafe for Admin API credentials or private backend secrets.

2. **GraphQL query string interpolation with token/user input context**
   - In `shopify/product.ts` and `shopify/search.ts`, access tokens are interpolated directly into query string contexts.
   - Prefer GraphQL variables + fixed query shape to reduce injection/formatting risks.

3. **MMKV encryption key handling**
   - `lib/storage.ts` now requires `EXPO_PUBLIC_ENCRYPTION_KEY` via runtime env validation (no insecure fallback key).

4. **Potential sensitive logging**
   - Removed several residual debug logs from UI paths (`app/(tabs)/cart.tsx`, `components/FilterDropdown.tsx`); continue avoiding logs that may expose customer/session context.

5. **Mixed client/server boundary not enforced**
   - No dedicated server layer in this repo; all calls are from client/mobile runtime.
   - Any future Admin API usage must be proxied through your backend.

6. **Auth refresh logic robustness**
   - Some query retry paths may call refresh but retry with stale token closure values.
   - Build a centralized fetch wrapper with token refresh mutex/retry once.

## Audit status
- Attempted: `npm audit --package-lock-only --omit=dev`
- Result: failed due registry advisory endpoint 403 in this environment.
- Action: run audit in your CI/local network and review critical/high findings:
  - `npm audit --omit=dev`
  - `npm audit fix --omit=dev` (careful with lockfile diff)

---

## 7) Integration plan + file touch list

## Default recommended architecture for “my Shopify + my server data”

### A) Shopify integration choice
- **Default**: continue using Storefront API client-side for catalog/cart/read operations.
- **If you need privileged operations** (orders management, discounts, inventory admin actions): use Admin API via your backend only.

### B) Custom backend integration (recommended pattern)
1. Add backend base URL env var (public only if non-secret endpoint):
   - `EXPO_PUBLIC_BACKEND_BASE_URL=https://api.yourdomain.com`
2. Build a dedicated API client module:
   - New file: `lib/api/client.ts` (fetch wrapper: auth header injection, timeout, retry, refresh integration, typed errors).
3. Feature-specific modules:
   - `lib/api/shopifyProxy.ts` for server-proxied Shopify Admin actions.
   - `lib/api/customData.ts` for your business data.
4. React Query hooks:
   - `lib/api/hooks/useCustomerProfile.ts`
   - `lib/api/hooks/useOrders.ts`
   - etc., replacing direct fetch in UI routes.

### C) Env var/secrets strategy
- Keep in app (public): Storefront public token, public domain, non-sensitive client IDs.
- Move to backend secrets: Admin token, webhook signing secret, private service tokens, DB creds.
- For mobile tokens: keep MMKV + strong `EXPO_PUBLIC_ENCRYPTION_KEY` (or derive via secure provisioning approach).

### D) Where to implement changes
- **Authentication/session behavior**: `lib/auth.ts`, `lib/storage.ts`, `app/(tabs)/profile.tsx`, `app/account.tsx`
- **Storefront queries and schema evolution**: `shopify/client.ts`, `shopify/product.ts`, `shopify/search.ts`, `.graphqlrc.ts`, `types/*`
- **Customer/order data fetch abstraction**: `shopify/user.ts`, `shopify/order.ts` (or migrate into `lib/api/*`)
- **Cart behavior**: `components/shopify/CartProvider.tsx`, `components/shopify/useCartActions.tsx`
- **UI surfaces consuming data**: `app/(tabs)/index.tsx`, `app/(tabs)/cart.tsx`, `app/orders.tsx`, `app/account.tsx`

### E) Minimal smoke test checklist (after integration)
- App starts on iOS + Android dev builds.
- Product list loads with Storefront token.
- Search works and returns products.
- Add/remove cart item works.
- Login + token refresh + logout works.
- Orders/account screens load from intended source.
- Backend-proxied endpoint failures show safe UI errors (no token leakage).

### F) Suggested testing strategy
- Unit:
  - query builder/helpers, auth token refresh helper, API client error mapping.
- Integration:
  - React Query hooks with mocked network (MSW or fetch mocks).
- E2E:
  - Use `.maestro` flows for login, browse, cart, checkout, account.

---

## 8) TODO / open questions

- [ ] Confirm whether your production app should use Storefront only or also Admin API.
- [ ] Confirm your backend stack (Node/Nest/Go/etc.) and auth method (JWT/session).
- [x] Decide on single package manager (`npm`) and remove extra lockfile drift (`bun.lock` removed).
- [x] Remove/guard PII logging in account screen.
- [x] Add strict env validation at startup (zod schema for required vars).
- [ ] Add secure refresh-token retry wrapper to prevent race conditions.
- [ ] Define webhook requirements (if needed) and verify HMAC validation in backend.

---

## 9) Change log (dated entries)

- **2026-03-04**: Initial architecture/security baseline created from repository scan. Included framework identification, route map, module hotspots, security review, audit attempt notes, and integration plan.


- **2026-03-04 (rev 2)**: Added `PROJECT_CONTEXT.md`, standardized package manager to npm, added runtime env validation (`lib/env.ts`), scaffolded backend API client (`lib/api/client.ts`), and removed account PII debug logging.

- **2026-03-04 (rev 3)**: Added `docs/DEMO_MVP.md` and `docs/TASKS.md`; updated `app/(tabs)/index.tsx` with explicit UI states for loading/empty/error and retry behavior while keeping Storefront-only mobile scope.

- **2026-03-04 (rev 4)**: Added Shopify Home CMS integration via `shopify/home.ts` (metaobject-driven section config), added `docs/MERCHANDISING.md`, and updated Home screen to render CMS sections dynamically with fallback to existing product-grid behavior.

- **2026-03-18 (rev 5)**: Performed local verification sweep, standardized env naming compatibility for customer shop ID aliasing, removed residual debug logs, and hardened Home rail query to use GraphQL variables for context instead of string interpolation.
