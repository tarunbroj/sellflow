# Parallel Workstreams

## A) UI implementation from Figma (no business logic changes)
- [ ] Build and apply shared visual primitives (section headers, state cards, action buttons).
- [x] Refactor `app/(tabs)/index.tsx` to align with new UI primitives and clear loading/empty/error states.
- [ ] Update PDP layout to match Figma spacing, typography, and CTA hierarchy.
- [ ] Update cart visual hierarchy (line item cards, totals block, checkout CTA treatment).
- [ ] Polish account/login visual states to match Figma (logged-in vs logged-out).

## B) Data layer hardening (Shopify queries, loading/error states, token refresh)
- [ ] Normalize Storefront query error handling (single utility for GraphQL errors).
- [ ] Standardize loading/empty/error UX states across Home/PDP/Cart/Account.
- [ ] Harden customer token refresh flow to avoid stale-token retry races.
- [ ] Add typed query result adapters to reduce `any` usage in screens/components.
- [ ] Add lightweight telemetry hooks for query failures (without logging sensitive payloads).

## C) QA smoke tests (Maestro flows + manual checklist)
- [ ] Create/refresh Maestro flow for Home → PDP → Add to Cart.
- [ ] Create/refresh Maestro flow for Cart → Checkout Sheet open/close.
- [ ] Create/refresh Maestro flow for Account login/logout happy path.
- [ ] Add manual checklist for loading/empty/error visual states on critical screens.
- [ ] Add release smoke checklist for iOS + Android demo build readiness.

## Notes
- Workstream A should not introduce API or business-logic behavior changes.
- Workstream B can use `lib/api/` scaffolding but must avoid direct Admin API from mobile.
- Workstream C should prioritize deterministic demo reliability over exhaustive test coverage.
