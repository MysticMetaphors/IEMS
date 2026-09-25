import DashboardLayout from "@/components/layout/dashboardLayout";
import { Stack } from "expo-router";

export default function DashboardLayoutRoute() {
  return (
    <DashboardLayout>
      <Stack screenOptions={{ headerShown: false }} />
    </DashboardLayout>
  );
}