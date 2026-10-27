import Button from "@/components/button";
import { ResetDatabaseButton } from "@/db/refresh-database/button";
import { testLocalNotification } from "@/lib/utils/notifications/test";
import { Text, View } from "react-native";

export default function Assistant() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-black">
        Assistant
      </Text>
      <ResetDatabaseButton />
      <Button
        label="Test notification"
        onPress={() => {
          testLocalNotification().catch(console.error);
        }}
      />
    </View>
  );
}