import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductCard from "@/components/ProductCard";
import { refreshUser } from "@/lib/auth";
import { storage } from "@/lib/storage";
import { getProducts } from "@/shopify/product";
import { Product as StorefrontProduct } from "@/types/storefront.types";
import { useLingui, Trans } from "@lingui/react/macro";
import { useQuery } from "@tanstack/react-query";
import { useShop } from "@shopify/hydrogen-react";
import { useMMKVString } from "react-native-mmkv";
import { Pressable, SafeAreaView, ScrollView, Text, View } from "react-native";
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

export default function Index() {
  const { i18n } = useLingui();
  const [accessToken] = useMMKVString("accessToken", storage);
  const { languageIsoCode, countryIsoCode } = useShop();

  useQuery({
    queryKey: ["user", accessToken],
    queryFn: async () => {
      await refreshUser();
      return true;
    },
  });

  const { isPending, isError, data, error, refetch, isRefetching } = useQuery({
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

  const productEdges = (data?.edges as ProductEdge[] | undefined) ?? [];

  return (
    <SafeAreaView style={styles.PageContainer}>
      <ScrollView style={styles.ScrollView} contentContainerStyle={styles.ScrollContent}>
        <View style={styles.ContentContainer}>
          <ScreenHeading />

          {isPending || isRefetching ? (
            <ProductGridSkeleton />
          ) : isError ? (
            <ErrorState
              message={
                error?.message
                  ? i18n._({
                      id: "home.products.fetch_error",
                      message: `An unexpected error occurred: ${error.message}`,
                    })
                  : i18n._({
                      id: "home.products.fetch_error_generic",
                      message: "An unexpected error occurred.",
                    })
              }
              onRetry={() => {
                void refetch();
              }}
            />
          ) : productEdges.length === 0 ? (
            <EmptyState />
          ) : (
            <View style={styles.ProductGrid}>
              {productEdges.map(({ node }) => (
                <ProductCard node={node} key={node.id} />
              ))}
            </View>
          )}
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
}));
