import { ResetDatabaseButton } from "@/db/refresh-database/button";
import { Text, View } from "react-native";

export default function Assistant() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-black">
        Assistant
      </Text>
      <ResetDatabaseButton />
    </View>
  );
}