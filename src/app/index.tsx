import KPI from "@/components/dashboard/KPI";
import DashboardLayout from "@/components/layout/dashboardLayout";
// import { Text, View } from "react-native";

export default function Index() {
  return (
    <DashboardLayout>
      {/* <View className="flex-1 items-center justify-center">
        <Text className="text-2xl font-bold text-black">
          Overview
        </Text>
      </View> */}

      <KPI />
    </DashboardLayout>
  );
}