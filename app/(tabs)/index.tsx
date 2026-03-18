import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import { refreshUser } from "@/lib/auth";
import { storage } from "@/lib/storage";
import {
  fetchCollectionRailProducts,
  fetchHomeConfig,
  HomeCollectionRef,
  HomeConfig,
  HomePromoTile,
  HomeSection,
} from "@/shopify/home";
import { getProducts } from "@/shopify/product";
import { Product as StorefrontProduct } from "@/types/storefront.types";
import { Image } from "expo-image";
import { useLingui, Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@shopify/hydrogen-react";
import { useRouter } from "expo-router";
import { useMMKVString } from "react-native-mmkv";
import { Linking, Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
import { StyleSheet } from "react-native-unistyles";

const SKELETON_COUNT = 8;

type ProductEdge = {
  node: StorefrontProduct;
};

function ScreenHeading() {
  return (
    <View style={styles.HeadingContainer}>
      <Text style={styles.Heading}>
        <Trans>Products</Trans>
      </Text>
      <Text style={styles.Subheading}>
        <Trans>Discover your featured Shopify catalog.</Trans>
      </Text>
    </View>
  );
}

function ProductGridSkeleton() {
  return (
    <View style={styles.ProductGrid}>
      {Array.from({ length: SKELETON_COUNT }, (_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </View>
  );
}

function EmptyState() {
  return (
    <View style={styles.StateCard}>
      <Text style={styles.StateTitle}>
        <Trans>No products yet</Trans>
      </Text>
      <Text style={styles.StateMessage}>
        <Trans>Please check your Shopify products or filters and try again.</Trans>
      </Text>
    </View>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <View style={styles.StateCard}>
      <Text style={styles.StateTitle}>
        <Trans>Unable to load products</Trans>
      </Text>
      <Text style={styles.StateMessage}>{message}</Text>
      <Pressable
        style={({ pressed }) => [styles.RetryButton, { opacity: pressed ? 0.8 : 1 }]}
        onPress={onRetry}
      >
        <Text style={styles.RetryButtonText}>
          <Trans>Try again</Trans>
        </Text>
      </Pressable>
    </View>
  );
}

function SectionTitle({ title }: { title?: string }) {
  if (!title) return null;

  return <Text style={styles.SectionTitle}>{title}</Text>;
}

export default function Index() {
  const { i18n } = useLingui();
  const router = useRouter();
  const [accessToken] = useMMKVString("accessToken", storage);
  const { languageIsoCode, countryIsoCode } = useShop();

  useQuery({
    queryKey: ["user", accessToken],
    queryFn: async () => {
      await refreshUser();
      return true;
    },
  });

  const fallbackProductsQuery = useQuery({
    queryKey: ["products", accessToken, countryIsoCode, languageIsoCode],
    queryFn: async () => {
      const response = await getProducts(
        countryIsoCode,
        languageIsoCode,
        accessToken,
      );

      if (response.errors?.length) {
        const graphQlMessage = response.errors[0]?.message;
        throw new Error(graphQlMessage ?? "Failed to fetch products.");
      }

      return response.data.products;
    },
  });

  const homeConfigQuery = useQuery<HomeConfig | null>({
    queryKey: ["home-config", "default"],
    queryFn: async () => fetchHomeConfig("default"),
  });

  const collectionRailHandles =
    homeConfigQuery.data?.sections
      .filter((section): section is Extract<HomeSection, { type: "collection_rail" }> =>
        section.type === "collection_rail",
      )
      .map((section) => section.collection.handle) ?? [];

  const railsProductsQuery = useQuery({
    enabled: collectionRailHandles.length > 0,
    queryKey: [
      "home-rail-products",
      collectionRailHandles.join(","),
      countryIsoCode,
      languageIsoCode,
    ],
    queryFn: async () =>
      fetchCollectionRailProducts({
        handles: collectionRailHandles,
        countryCode: countryIsoCode,
        languageCode: languageIsoCode,
      }),
  });

  const productEdges =
    (fallbackProductsQuery.data?.edges as ProductEdge[] | undefined) ?? [];

  const hasCmsSections = Boolean(homeConfigQuery.data?.sections?.length);
  const canRenderCms = hasCmsSections && !homeConfigQuery.isError;

  const openLink = async (href?: string) => {
    if (!href) return;

    if (href.startsWith("/")) {
      router.push(href as never);
      return;
    }

    await Linking.openURL(href);
  };

  const renderHeroSlider = (
    section: Extract<HomeSection, { type: "hero_slider" }>,
  ) => (
    <View style={styles.SectionBlock} key={section.id}>
      <SectionTitle title={section.title} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.HorizontalSectionRow}>
        {section.slides.map((slide) => (
          <Pressable
            key={slide.id}
            onPress={() => {
              void openLink(slide.link);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.HeroSlide]}
          >
            <Image source={{ uri: slide.imageUrl }} style={styles.HeroImage} />
            {slide.title ? <Text style={styles.HeroTitle}>{slide.title}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  const renderCollectionRail = (
    section: Extract<HomeSection, { type: "collection_rail" }>,
  ) => {
    const products = railsProductsQuery.data?.[section.collection.handle] ?? [];

    return (
      <View style={styles.SectionBlock} key={section.id}>
        <SectionTitle title={section.title} />
        {railsProductsQuery.isPending ? (
          <ProductGridSkeleton />
        ) : products.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.HorizontalSectionRow}>
            {products.map((product) => (
              <View style={styles.RailCard} key={product.id}>
                <ProductCard node={product} />
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.StateMessage}>
            <Trans>No products available for this collection.</Trans>
          </Text>
        )}
      </View>
    );
  };

  const renderCategoryGrid = (
    section: Extract<HomeSection, { type: "category_grid" }>,
  ) => (
    <View style={styles.SectionBlock} key={section.id}>
      <SectionTitle title={section.title} />
      <View style={styles.CategoryGrid}>
        {section.collections.map((collection: HomeCollectionRef) => (
          <Pressable
            key={collection.id}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }, styles.CategoryCard]}
            onPress={() => {
              router.push({
                pathname: "/(tabs)/search/[query]",
                params: { query: collection.title },
              });
            }}
          >
            {collection.imageUrl ? (
              <Image source={{ uri: collection.imageUrl }} style={styles.CategoryImage} />
            ) : null}
            <Text style={styles.CategoryText}>{collection.title}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderPromoTiles = (
    section: Extract<HomeSection, { type: "promo_tiles" }>,
  ) => (
    <View style={styles.SectionBlock} key={section.id}>
      <SectionTitle title={section.title} />
      <View style={styles.PromoGrid}>
        {section.tiles.map((tile: HomePromoTile) => (
          <Pressable
            key={tile.id}
            onPress={() => {
              void openLink(tile.link);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }, styles.PromoCard]}
          >
            <Image source={{ uri: tile.imageUrl }} style={styles.PromoImage} />
            {tile.title ? <Text style={styles.PromoTitle}>{tile.title}</Text> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  const renderCmsSections = () =>
    homeConfigQuery.data?.sections.map((section) => {
      switch (section.type) {
        case "hero_slider":
          return renderHeroSlider(section);
        case "collection_rail":
          return renderCollectionRail(section);
        case "category_grid":
          return renderCategoryGrid(section);
        case "promo_tiles":
          return renderPromoTiles(section);
      }
    });

  const renderFallbackHome = () => {
    if (fallbackProductsQuery.isPending) {
      return <ProductGridSkeleton />;
    }

    if (fallbackProductsQuery.isError) {
      return (
        <ErrorState
          message={
            fallbackProductsQuery.error?.message
              ? i18n._({
                  id: "home.products.fetch_error",
                  message: `An unexpected error occurred: ${fallbackProductsQuery.error.message}`,
                })
              : i18n._({
                  id: "home.products.fetch_error_generic",
                  message: "An unexpected error occurred.",
                })
          }
          onRetry={() => {
            void fallbackProductsQuery.refetch();
          }}
        />
      );
    }

    if (productEdges.length === 0) {
      return <EmptyState />;
    }

    return (
      <View style={styles.ProductGrid}>
        {productEdges.map(({ node }) => (
          <ProductCard node={node} key={node.id} />
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.PageContainer}>
      <ScrollView style={styles.ScrollView} contentContainerStyle={styles.ScrollContent}>
        <View style={styles.ContentContainer}>
          <ScreenHeading />
          {canRenderCms ? renderCmsSections() : renderFallbackHome()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  PageContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  ScrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  ScrollContent: {
    paddingBottom: 20,
  },
  ContentContainer: {
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  HeadingContainer: {
    gap: 4,
    marginBottom: 8,
  },
  Heading: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  Subheading: {
    fontSize: 14,
    color: theme.colors.icon,
  },
  ProductGrid: {
    gap: 8,
    paddingVertical: 16,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  StateCard: {
    width: "100%",
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.icon,
    backgroundColor: theme.colors.background,
    gap: 10,
  },
  StateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  StateMessage: {
    fontSize: 14,
    color: theme.colors.icon,
  },
  RetryButton: {
    alignSelf: "flex-start",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.text,
  },
  RetryButtonText: {
    color: theme.colors.background,
    fontWeight: "600",
  },
  SectionBlock: {
    marginTop: 16,
    gap: 8,
  },
  SectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  HorizontalSectionRow: {
    gap: 8,
    paddingVertical: 8,
  },
  HeroSlide: {
    width: 300,
    gap: 6,
  },
  HeroImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
  },
  HeroTitle: {
    color: theme.colors.text,
    fontWeight: "600",
  },
  RailCard: {
    width: 220,
  },
  CategoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  CategoryCard: {
    width: "48%",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: theme.colors.icon,
    backgroundColor: theme.colors.background,
  },
  CategoryImage: {
    width: "100%",
    aspectRatio: 1.8,
  },
  CategoryText: {
    padding: 10,
    color: theme.colors.text,
    fontWeight: "600",
  },
  PromoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  PromoCard: {
    width: "48%",
    gap: 6,
  },
  PromoImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 10,
  },
  PromoTitle: {
    color: theme.colors.text,
    fontWeight: "600",
  },
}));
