# Merchandising: CMS-driven Home via Shopify Metaobjects

This project supports a content-managed Home screen using Shopify Storefront API metaobjects.

## 1) Metaobject types to create in Shopify Admin

Create these Metaobject definitions:

1. `home_page`
   - `sections` (List of Metaobject references)

2. `hero_slider`
   - `title` (Single line text, optional)
   - `slides` (List of Metaobject references to `hero_slide`)

3. `hero_slide`
   - `title` (Single line text, optional)
   - `image` (File reference, required)
   - `link` (URL or single line text, optional)

4. `collection_rail`
   - `title` (Single line text, optional)
   - `collection` (Collection reference, required)

5. `category_grid`
   - `title` (Single line text, optional)
   - `collections` (List of Collection references, required)

6. `promo_tiles`
   - `title` (Single line text, optional)
   - `tiles` (List of Metaobject references to `promo_tile`)

7. `promo_tile`
   - `title` (Single line text, optional)
   - `image` (File reference, required)
   - `link` (URL or single line text, optional)

## 2) Create the Home entry

- Create a `home_page` entry with handle `default`.
- Populate `sections` with references in the exact order you want sections to appear.
- Publish the entry.

The app calls `fetchHomeConfig("default")`; if this entry is missing/unpublished, Home falls back to the static product grid behavior.

## 3) Recommended image sizes

- Hero slide images: **1600 × 900** (16:9)
- Promo tiles: **1200 × 1200** (1:1)
- Category/collection images: **1200 × 675** (16:9)

Use compressed JPG/WebP where possible to keep mobile payloads small.

## 4) Section order and seasonal updates

### Change section order
- Edit `home_page.default` → reorder items in `sections` list → save/publish.
- No app release is required.

### Seasonal updates workflow
1. Duplicate current metaobject entries for new campaign assets.
2. Update hero slides/promo tiles/rail references.
3. Reorder `sections` if needed.
4. Publish changes at go-live time.
5. Roll back by restoring previous references/order.

## 5) Link behavior guidance

- For internal deep links, prefer app paths like `/product/<id>` or route paths your app handles.
- For external links, use full URLs (`https://...`).
- Validate links before publishing to avoid dead promo taps.

## 6) Troubleshooting

- If Home still shows fallback product grid:
  - ensure `home_page` definition exists
  - ensure handle is `default`
  - ensure `sections` references are published
  - ensure section metaobject types are exactly named:
    - `hero_slider`
    - `collection_rail`
    - `category_grid`
    - `promo_tiles`
