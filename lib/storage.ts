import { env } from "@/lib/env";
import { Platform } from "react-native";
import { MMKV } from "react-native-mmkv";

export const storage = new MMKV({
  id: "user",
  ...(Platform.OS !== "web" && {
    encryptionKey: env.EXPO_PUBLIC_ENCRYPTION_KEY,
  }),
});
