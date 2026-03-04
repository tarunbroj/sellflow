import { CountryCode, LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";
import { Product as StorefrontProduct } from "@/types/storefront.types";
import { client } from "./client";

export type HomeSectionType =
  | "hero_slider"
  | "collection_rail"
  | "category_grid"
  | "promo_tiles";

export interface HomeHeroSlide {
  id: string;
  title?: string;
  imageUrl: string;
  imageAlt?: string;
  link?: string;
}

export interface HomeCollectionRef {
  id: string;
  title: string;
  handle: string;
  imageUrl?: string;
  imageAlt?: string;
}

export interface HomePromoTile {
  id: string;
  title?: string;
  imageUrl: string;
  imageAlt?: string;
  link?: string;
}

export type HomeSection =
  | {
      id: string;
      type: "hero_slider";
      title?: string;
      slides: HomeHeroSlide[];
    }
  | {
      id: string;
      type: "collection_rail";
      title: string;
      collection: HomeCollectionRef;
    }
  | {
      id: string;
      type: "category_grid";
      title?: string;
      collections: HomeCollectionRef[];
    }
  | {
      id: string;
      type: "promo_tiles";
      title?: string;
      tiles: HomePromoTile[];
    };

export interface HomeConfig {
  id: string;
  handle: string;
  sections: HomeSection[];
}

interface RawField {
  key: string;
  value?: string | null;
  type?: string | null;
  reference?: any;
  references?: { nodes?: any[] | null } | null;
}

interface RawMetaobject {
  id: string;
  type: string;
  handle: string;
  fields: RawField[];
}

const HOME_CONFIG_QUERY = `#graphql
  query HomeConfig($type: String!, $handle: String!) {
    metaobjectByHandle(handle: { type: $type, handle: $handle }) {
      id
      type
      handle
      fields {
        key
        type
        value
        reference {
          ... on Collection {
            id
            title
            handle
            image {
              url
              altText
            }
          }
          ... on MediaImage {
            id
            image {
              url
              altText
            }
          }
          ... on Metaobject {
            id
            type
            handle
            fields {
              key
              type
              value
              reference {
                ... on Collection {
                  id
                  title
                  handle
                  image {
                    url
                    altText
                  }
                }
                ... on MediaImage {
                  id
                  image {
                    url
                    altText
                  }
                }
              }
              references(first: 20) {
                nodes {
                  ... on Collection {
                    id
                    title
                    handle
                    image {
                      url
                      altText
                    }
                  }
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                    }
                  }
                  ... on Metaobject {
                    id
                    type
                    handle
                    fields {
                      key
                      type
                      value
                      reference {
                        ... on MediaImage {
                          id
                          image {
                            url
                            altText
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        references(first: 20) {
          nodes {
            ... on Collection {
              id
              title
              handle
              image {
                url
                altText
              }
            }
            ... on Metaobject {
              id
              type
              handle
              fields {
                key
                type
                value
                reference {
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const getField = (fields: RawField[], key: string): RawField | undefined =>
  fields.find((field) => field.key === key);

const asString = (field?: RawField) => field?.value ?? undefined;

const asCollection = (reference: any): HomeCollectionRef | undefined => {
  if (!reference?.handle || !reference?.id || !reference?.title) {
    return undefined;
  }

  return {
    id: reference.id,
    handle: reference.handle,
    title: reference.title,
    imageUrl: reference.image?.url,
    imageAlt: reference.image?.altText,
  };
};

const asCollectionList = (field?: RawField): HomeCollectionRef[] =>
  (field?.references?.nodes ?? [])
    .map((item) => asCollection(item))
    .filter((item): item is HomeCollectionRef => Boolean(item));

const asMediaImage = (reference: any) => ({
  url: reference?.image?.url as string | undefined,
  alt: reference?.image?.altText as string | undefined,
});

const asMetaobjects = (field?: RawField): RawMetaobject[] =>
  (field?.references?.nodes ?? []).filter(
    (node): node is RawMetaobject => Boolean(node?.id && node?.fields),
  );

const normalizeHeroSlider = (section: RawMetaobject): HomeSection | null => {
  const slidesField = getField(section.fields, "slides");
  const slides = asMetaobjects(slidesField)
    .map((slide): HomeHeroSlide | null => {
      const imageField = getField(slide.fields, "image");
      const image = asMediaImage(imageField?.reference);
      if (!image.url) return null;

      return {
        id: slide.id,
        title: asString(getField(slide.fields, "title")),
        link: asString(getField(slide.fields, "link")),
        imageUrl: image.url,
        imageAlt: image.alt,
      };
    })
    .filter((slide): slide is HomeHeroSlide => Boolean(slide));

  if (slides.length === 0) return null;

  return {
    id: section.id,
    type: "hero_slider",
    title: asString(getField(section.fields, "title")),
    slides,
  };
};

const normalizeCollectionRail = (section: RawMetaobject): HomeSection | null => {
  const collection = asCollection(getField(section.fields, "collection")?.reference);
  if (!collection) return null;

  return {
    id: section.id,
    type: "collection_rail",
    title: asString(getField(section.fields, "title")) ?? collection.title,
    collection,
  };
};

const normalizeCategoryGrid = (section: RawMetaobject): HomeSection | null => {
  const collections = asCollectionList(getField(section.fields, "collections"));
  if (collections.length === 0) return null;

  return {
    id: section.id,
    type: "category_grid",
    title: asString(getField(section.fields, "title")),
    collections,
  };
};

const normalizePromoTiles = (section: RawMetaobject): HomeSection | null => {
  const tiles = asMetaobjects(getField(section.fields, "tiles"))
    .map((tile): HomePromoTile | null => {
      const image = asMediaImage(getField(tile.fields, "image")?.reference);
      if (!image.url) return null;

      return {
        id: tile.id,
        title: asString(getField(tile.fields, "title")),
        link: asString(getField(tile.fields, "link")),
        imageUrl: image.url,
        imageAlt: image.alt,
      };
    })
    .filter((tile): tile is HomePromoTile => Boolean(tile));

  if (tiles.length === 0) return null;

  return {
    id: section.id,
    type: "promo_tiles",
    title: asString(getField(section.fields, "title")),
    tiles,
  };
};

const normalizeSection = (section: RawMetaobject): HomeSection | null => {
  switch (section.type) {
    case "hero_slider":
      return normalizeHeroSlider(section);
    case "collection_rail":
      return normalizeCollectionRail(section);
    case "category_grid":
      return normalizeCategoryGrid(section);
    case "promo_tiles":
      return normalizePromoTiles(section);
    default:
      return null;
  }
};

export const fetchHomeConfig = async (handle = "default"): Promise<HomeConfig | null> => {
  const response = await client.request<{
    data?: { metaobjectByHandle?: RawMetaobject | null };
    errors?: { message?: string }[];
  }>(HOME_CONFIG_QUERY, {
    variables: {
      type: "home_page",
      handle,
    },
  });

  if (response.errors?.length) {
    throw new Error(response.errors[0]?.message ?? "Failed to fetch home config");
  }

  const homeMetaobject = response.data?.metaobjectByHandle;
  if (!homeMetaobject) {
    return null;
  }

  const sectionsField = getField(homeMetaobject.fields, "sections");
  const sections = asMetaobjects(sectionsField)
    .map((section) => normalizeSection(section))
    .filter((section): section is HomeSection => Boolean(section));

  if (sections.length === 0) {
    return null;
  }

  return {
    id: homeMetaobject.id,
    handle: homeMetaobject.handle,
    sections,
  };
};

export const fetchCollectionRailProducts = async ({
  handles,
  countryCode,
  languageCode,
  accessToken,
}: {
  handles: string[];
  countryCode: CountryCode;
  languageCode: LanguageCode;
  accessToken?: string | null;
}): Promise<Record<string, StorefrontProduct[]>> => {
  const uniqueHandles = Array.from(new Set(handles)).filter(Boolean);
  if (uniqueHandles.length === 0) {
    return {};
  }

  const results = await Promise.all(
    uniqueHandles.map(async (handle) => {
      const response = await client.request<{
        data?: {
          collection?: {
            handle: string;
            products?: { edges?: { node: StorefrontProduct }[] };
          } | null;
        };
        errors?: { message?: string }[];
      }>(
        `#graphql
        query CollectionRailProducts($handle: String!, $first: Int!) @inContext(country: ${countryCode}, language: ${languageCode} ${accessToken ? `, buyer: { customerAccessToken: "${accessToken}" }` : ""}) {
          collection(handle: $handle) {
            handle
            products(first: $first) {
              edges {
                node {
                  id
                  title
                  variantsCount {
                    count
                  }
                  selectedOrFirstAvailableVariant {
                    id
                  }
                  priceRange {
                    minVariantPrice {
                      amount
                      currencyCode
                    }
                  }
                  featuredImage {
                    altText
                    height
                    width
                    url
                  }
                }
              }
            }
          }
        }
      `,
        {
          variables: {
            handle,
            first: 8,
          },
        },
      );

      if (response.errors?.length) {
        return [handle, [] as StorefrontProduct[]] as const;
      }

      const products = response.data?.collection?.products?.edges?.map((edge) => edge.node) ?? [];
      return [handle, products] as const;
    }),
  );

  return Object.fromEntries(results);
};
