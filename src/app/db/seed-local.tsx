import { seedDatabase } from "@/db/seeders/dev-seed";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";

// Opened by `npm run db:seed` (see package.json). Development builds only.
export default function SeedDatabaseRoute() {
  const router = useRouter();
  const { confirm } = useLocalSearchParams<{ confirm?: string }>();
  const started = useRef(false);
  const [message, setMessage] = useState("Preparing database seed...");

  useEffect(() => {
    if (started.current) return;

    if (!__DEV__) {
      setMessage("Database seeding is only available in development.");
      return;
    }

    if (confirm !== "seed") {
      setMessage("Invalid seed request.");
      return;
    }

    started.current = true;
    setMessage("Seeding database...");

    seedDatabase()
      .then((counts) => {
        setMessage(
          `Seeded ${counts.students} students, ${counts.classes} classes, ` +
            `${counts.enrollments} enrollments and ${counts.sessions} sessions.`
        );
        router.replace("/");
      })
      .catch((error: unknown) => {
        console.error("Database seed failed:", error);
        setMessage(
          `Database seed failed: ${error instanceof Error ? error.message : String(error)}`
        );
      });
  }, [confirm, router]);

  return (
    <View className="flex-1 items-center justify-center bg-white p-6">
      <Text>{message}</Text>
    </View>
  );
}
