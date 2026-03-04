# PROJECT_CONTEXT.md

Quick AI memory for active development. Read this file **first** on every task before scanning the whole repository.

## 1) Project summary
- Mobile-first storefront built with **Expo + React Native**.
- Navigation uses **Expo Router** (`app/` file-based routing).
- Shopify **Storefront API** powers catalog/product/search/cart experiences.
- Shopify **Customer Account API** powers customer authentication and account data.
- A future backend integration is planned for delivery tracking + business logic.

## 2) Tech stack
- Expo / React Native
- Expo Router
- React Query (`@tanstack/react-query`)
- Shopify Storefront API (`@shopify/storefront-api-client`, `@shopify/hydrogen-react`)
- GraphQL Codegen (`@shopify/api-codegen-preset`)
- MMKV storage (`react-native-mmkv`)
- TypeScript
- Zod runtime environment validation

## 3) Key directories
- `app/` — route screens and layouts
- `components/` — reusable UI + feature components
- `components/shopify/` — cart provider/state machine/actions
- `shopify/` — Shopify API modules (product/search/order/user/cart/client)
- `lib/` — shared libraries (auth, storage, env, i18n, utils)
- `lib/api/` — backend API client scaffold + future hooks/types
- `styles/` — Unistyles theme config
- `types/` — generated Storefront GraphQL types
- `docs/` — execution docs (MVP definition, task workstreams)

## 4) Important entrypoints
- `app/_layout.tsx` — provider composition (query, theme, Shopify, cart)
- `app/(tabs)/_layout.tsx` — main tab routing
- `shopify/client.ts` — Storefront API client
- `lib/auth.ts` — customer auth/token refresh helpers
- `lib/storage.ts` — MMKV storage initialization
- `components/shopify/CartProvider.tsx` — cart orchestration/state
- `lib/env.ts` — runtime env schema validation
- `lib/api/client.ts` — backend HTTP wrapper scaffold

## 5) Environment variables currently used
Required now:
- `EXPO_PUBLIC_STORE_DOMAIN`
- `EXPO_PUBLIC_STORE_TOKEN`
- `EXPO_PUBLIC_ENCRYPTION_KEY`
- `EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT`
- `EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN`
- `EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT`
- `EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID`

New backend variable (optional until backend endpoints are integrated):
- `EXPO_PUBLIC_BACKEND_BASE_URL`

Notes:
- `EXPO_PUBLIC_*` values are available to client code.
- Never place Shopify Admin secrets in `EXPO_PUBLIC_*`.

## 6) Future backend architecture plan
- Backend target: **NestJS**.
- Backend responsibilities:
  - Shopify Admin API access (server-side only)
  - Webhook ingestion + verification
  - Delivery provider integration
  - Real-time delivery tracking/business logic
- Mobile app communicates with backend via REST API.

## 7) Where major changes should occur
- API abstraction layer → `lib/api/`
- Auth/session → `lib/auth.ts`
- Shopify queries → `shopify/*`
- UI screens/routes → `app/*`
- Cart logic → `components/shopify/*`
- Runtime config validation → `lib/env.ts`

## 8) Development commands
- `npm install`
- `npm run start`
- `npm run ios`
- `npm run android`
- `npm run web`
- `npm run test`
- `npm run lint`
- `npm run graphql-codegen`

## IMPORTANT RULE
On every future task, read `PROJECT_CONTEXT.md` first before scanning the entire repository.


## 9) Current implementation note
- Home screen now includes explicit loading/empty/error states in `app/(tabs)/index.tsx`.
