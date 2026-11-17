import ComingSoon from "@/components/coming-soon";
import { View } from "react-native";

export default function Assistant() {
  return (
    <View className="flex flex-1 w-full">
      <ComingSoon
        title="Assistant"
        description="We're building a smart assistant to help you manage your classes, students, and schedule. Check back soon."
      />
    </View>
  );
}
