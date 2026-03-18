import { SelectedOptionInput } from "@/types/storefront.types";
import { createStorefrontApiClient } from "@shopify/storefront-api-client";
import { UnknownOutputParams } from "expo-router";
import { env } from "@/lib/env";

export const client = createStorefrontApiClient({
  storeDomain: env.EXPO_PUBLIC_STORE_DOMAIN,
  publicAccessToken: env.EXPO_PUBLIC_STORE_TOKEN,
  apiVersion: "2025-04",
});

export const getProductOptions = (
  searchParams: UnknownOutputParams,
): SelectedOptionInput[] => {
  const selectedOptions: SelectedOptionInput[] = [];
  if (!searchParams) {
    return selectedOptions;
  }

  for (const name in searchParams) {
    if (searchParams.hasOwnProperty(name) && name !== "handle") {
      const value = searchParams[name];
      selectedOptions.push({ name, value });
    }
  }
  return selectedOptions;
};
