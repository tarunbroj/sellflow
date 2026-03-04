# Demo MVP (Mobile Only)

## Boss-demo MVP checklist (7–10 items)
- [ ] App launches successfully on iOS and Android dev builds using Expo.
- [ ] Home screen shows product grid with loading, empty, and error states.
- [ ] Product detail page (PDP) loads title, media, price, variant selection, and add-to-cart CTA.
- [ ] Cart supports add/remove/update quantity and shows subtotal.
- [ ] Account screen supports login flow (Customer Account API) and basic profile visibility.
- [ ] Checkout opens via Shopify Checkout Sheet and reaches payment/shipping steps.
- [ ] Basic UX polish is present (skeletons, retry CTAs, localized copy).
- [ ] Demo mode can run with test Storefront credentials and mock delivery status.
- [ ] No Admin API secrets are exposed in mobile client configuration.

## Scope definition

### IN scope
- Mobile UI flows for Home, PDP, Cart, Account/Login, Checkout.
- Shopify Storefront API integration for product/catalog/cart.
- Customer Account API login for customer-facing account experience.
- Demo-safe delivery tracking representation using mock data only.
- React Query states (loading/error/empty/success) for core screens.

### OUT of scope
- Shopify Admin API usage directly from mobile app.
- Production delivery backend integration (NestJS endpoints are future scope).
- Advanced analytics/observability pipeline.
- Full order management admin tooling.
- Real-time production push delivery updates.

## Screen-level acceptance criteria

### Home
- Product list renders from Storefront query.
- Loading skeleton grid is shown while data is pending.
- Empty state message is shown if zero products.
- Error state includes clear message and retry action.

### PDP (Product Detail Page)
- Product title, media, price, and description are visible.
- Variant selections update selected variant context.
- Add-to-cart works for single and multi-variant products.
- Back navigation to Home is reliable.

### Cart
- Cart line items are visible with quantity + price.
- Quantity update/remove actions update cart totals.
- Empty cart state is rendered when no lines exist.
- Checkout CTA opens Shopify checkout sheet.

### Account/Login
- Login launches OAuth flow through Customer Account API.
- Authenticated state shows customer profile basics.
- Logged-out state shows Login/Sign-up CTAs.
- Logout clears local auth tokens.

### Checkout
- Checkout sheet opens from cart with current cart context.
- Customer can reach shipping/payment steps in demo.
- Checkout cancellation returns user safely to app.
- Checkout failure paths show non-crashing error handling.

## Demo Mode

## Purpose
Demo Mode enables stakeholder walkthroughs without production backend dependencies.

## How to run with test tokens + mock delivery status
1. Set test env vars in local `.env`/EAS env:
   - `EXPO_PUBLIC_STORE_DOMAIN`
   - `EXPO_PUBLIC_STORE_TOKEN`
   - `EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT`
   - `EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN`
   - `EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT`
   - `EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID`
2. Start the app:
   - `npm install`
   - `npm run start`
   - `npm run ios` or `npm run android`
3. For delivery tracking views, use a mock payload strategy in UI hooks/components (example statuses: `Preparing`, `Out for delivery`, `Delivered`) until NestJS backend endpoints are live.
4. Keep all Admin credentials server-side only; mobile demo must use Storefront/public credentials.

## Demo Mode guardrails
- Never hardcode real production tokens in source files.
- Use clearly labeled test stores/tokens.
- Ensure screenshots/videos used in stakeholder demos do not contain customer PII.
