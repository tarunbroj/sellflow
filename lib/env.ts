import { z } from "zod";

const requiredEnvSchema = z.object({
  EXPO_PUBLIC_STORE_DOMAIN: z.string().min(1),
  EXPO_PUBLIC_STORE_TOKEN: z.string().min(1),
  EXPO_PUBLIC_ENCRYPTION_KEY: z.string().min(1),
  EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT: z.string().url(),
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN: z.string().min(1),
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT: z.string().url(),
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID: z.string().min(1),
  EXPO_PUBLIC_BACKEND_BASE_URL: z.string().url().optional(),
});

const rawEnv = {
  EXPO_PUBLIC_STORE_DOMAIN: process.env.EXPO_PUBLIC_STORE_DOMAIN,
  EXPO_PUBLIC_STORE_TOKEN: process.env.EXPO_PUBLIC_STORE_TOKEN,
  EXPO_PUBLIC_ENCRYPTION_KEY: process.env.EXPO_PUBLIC_ENCRYPTION_KEY,
  EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT:
    process.env.EXPO_PUBLIC_CUSTOMER_STORE_ENDPOINT,
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN:
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_TOKEN,
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT:
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_API_ENDPOINT,
  EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID:
    process.env.EXPO_PUBLIC_CUSTOMER_ACCOUNT_SHOP_ID ||
    process.env.EXPO_PUBLIC_CUSTOMER_SHOP_ID,
  EXPO_PUBLIC_BACKEND_BASE_URL: process.env.EXPO_PUBLIC_BACKEND_BASE_URL,
};

const parsedEnv = requiredEnvSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const issueLines = parsedEnv.error.issues.map((issue) => {
    const field = issue.path.join(".");
    return `- ${field}: ${issue.message}`;
  });

  throw new Error(
    [
      "Invalid/missing required Expo environment variables.",
      "Fix the following variables before starting the app:",
      ...issueLines,
      "Expected canonical names are documented in README.md and PROJECT_CONTEXT.md.",
    ].join("\n"),
  );
}

export const env = parsedEnv.data;
