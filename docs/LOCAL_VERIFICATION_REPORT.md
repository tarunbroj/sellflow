# Local Verification Report

Date: 2026-03-18 (UTC)
Scope: Expo + Shopify mobile app repo health/readiness sweep.

## 1) What was checked

### Environment + config validation
- Verified env variables referenced in code and docs.
- Checked naming consistency across README, PROJECT_CONTEXT, ARCHITECTURE, and runtime code.
- Confirmed startup env validation behavior and error messaging (`lib/env.ts`).

### Repository health checks
- `npm install`
- `npm install --legacy-peer-deps`
- `npm run lint`
- `npm run test -- --watchAll=false`
- `npm run graphql-codegen`
- `npx tsc --noEmit`
- Route/entrypoint structure checks (`index.ts`, `app/` route tree)

### Shopify integration sanity checks
- Storefront client wiring and token/domain usage.
- Customer Account API endpoint/token wiring.
- Home CMS metaobject integration (`shopify/home.ts`, `app/(tabs)/index.tsx`).
- Cart provider wiring in root layout.
- GraphQL variable safety for Home config query and collection rail query context.

### UI + app boot readiness checks (static)
- Root provider setup in `app/_layout.tsx`.
- Tab routing in `app/(tabs)/_layout.tsx`.
- Home loading/empty/error/fallback logic.
- Product, cart, profile/account routes present.
- Obvious null-guard/runtime assumption review in modified paths.

## 2) What passed
- Expo entrypoint exists and imports runtime env validation early (`index.ts` imports `./lib/env`).
- Route tree is intact (`app/_layout.tsx`, tabs, product/cart/profile/order/account routes).
- Cart provider is still wired under `ShopifyProvider` in root layout.
- Home config query now uses GraphQL variables for metaobject handle/type and dynamic section normalization.
- Home collection rail query now uses GraphQL variables for `country`/`language` context and handle/first params.
- Env validation now supports canonical customer shop ID plus legacy alias and throws actionable startup error text when required env vars are invalid/missing.
- Residual debug logs were removed from cart/filter UI paths.

## 3) What failed (in this environment)
- `npm install` failed with peer-resolution conflict (`@shopify/hydrogen-react` expecting React 18 while repo uses React 19).
- `npm install --legacy-peer-deps` moved past peer resolution but failed due registry/network policy (`403 Forbidden` for package tarball fetch).
- `npm run lint` failed because dependencies/CLI are unavailable (`expo: not found`).
- `npm run test` failed because dependencies are unavailable (`jest: not found`).
- `npm run graphql-codegen` failed because dependencies are unavailable (`graphql-codegen: not found`).
- `npx tsc --noEmit` produced broad dependency/config errors due missing installed toolchain (`expo/tsconfig.base`, packages, types).

## 4) What was fixed automatically
1. **Env naming consistency + compatibility**
   - Canonicalized around `EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID` and added compatibility for legacy `EXPO_PUBLIC_CUSTOMER_SHOP_ID` in runtime env parsing.
   - Updated docs to list both (canonical + legacy alias) clearly.

2. **Startup failure clarity**
   - `lib/env.ts` now uses `safeParse` and throws explicit, actionable messages listing invalid/missing env keys (without exposing values).

3. **GraphQL safety improvement**
   - Refactored Home collection rail query context in `shopify/home.ts` to use GraphQL variables for `country` and `language` instead of string interpolation.

4. **Debug logging cleanup**
   - Removed `console.log` statements in `app/(tabs)/cart.tsx` and `components/FilterDropdown.tsx`.

5. **Docs/state-of-truth updates**
   - Updated `ARCHITECTURE.md` and `PROJECT_CONTEXT.md` with current env/cms facts and verification outcomes.

## 5) Remaining blockers / manual verification required

### High-priority blockers
1. **Dependency installability in your local environment**
   - Resolve npm install constraints:
     - peer conflict around `@shopify/hydrogen-react` vs React 19
     - registry access restrictions (403) in this environment
2. **Run full lint/test/codegen once deps install successfully**
   - Current environment cannot verify runtime/lint/test/codegen pass due missing install.

### Manual functional verification to perform locally
- Confirm Home CMS metaobjects render in intended order.
- Confirm fallback Home grid appears when `home_page.default` is absent.
- Confirm auth/login redirect scheme works with your configured shop ID.
- Confirm checkout sheet, cart actions, and account screens in iOS/Android dev build.

## 6) Exact commands to run locally

### Install + checks
```bash
npm install
# if needed for peer conflicts in your local environment:
# npm install --legacy-peer-deps

npm run lint
npm run test -- --watchAll=false
npm run graphql-codegen
npx tsc --noEmit
```

### Run app (dev build, not Expo Go)
```bash
npm run start
npm run ios
npm run android
```

### Home CMS verification
1. Create/publish `home_page` metaobject entry with handle `default`.
2. Add section references (`hero_slider`, `collection_rail`, `category_grid`, `promo_tiles`) in desired order.
3. Relaunch app and validate section rendering order + links.

## 7) Environment variables expected

Required (canonical):
- EXPO_PUBLIC_STORE_TOKEN
- EXPO_PUBLIC_STORE_DOMAIN
- EXPO_PUBLIC_ENCRYPTION_KEY
- EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID
- EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT
- EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN
- EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT

Legacy alias (supported for compatibility):
- EXPO_PUBLIC_CUSTOMER_SHOP_ID

Optional:
- EXPO_PUBLIC_BACKEND_BASE_URL

Security note: this report intentionally does not display secret values.


## 8) Dev build readiness notes
- This app is **not intended for Expo Go** due to native dependencies (notably Shopify Checkout Sheet Kit and Unistyles).
- Required native/dev-build-sensitive modules include:
  - `@shopify/checkout-sheet-kit`
  - `react-native-mmkv`
  - `react-native-reanimated`
  - `react-native-gesture-handler`
  - `react-native-unistyles`
- Use development builds on simulator/emulator/device (`npm run ios` / `npm run android`) after dependencies install successfully.
