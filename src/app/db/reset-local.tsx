import { resetDatabase } from "@/db/scripts/db-reset";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

export default function ResetDatabaseRoute() {
  const router = useRouter()
  const { confirm } = useLocalSearchParams<{ confirm?: string }>();
  const started = useRef(false);
  const [message, setMessage] = useState("Preparing database reset...");

  useEffect(() => {
    if (!__DEV__) {
      setMessage("Database reset is only available in development.");
      return;
    }

    if (confirm !== "reset" || started.current) {
      setMessage("Invalid reset request.");
      return;
    }

    started.current = true;

    resetDatabase()
      .then(() => {
        setMessage("Database reset completed successfully.")
        router.replace('/')
      })
      .catch((error: unknown) => {
        setMessage(
          `Database reset failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });
  }, [confirm]);


  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text>{message}</Text>
    </View>
  );
}