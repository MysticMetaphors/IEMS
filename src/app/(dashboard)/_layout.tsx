import DashboardLayout from "@/components/layout/dashboardLayout";
import { Stack } from "expo-router";

// The screen shown when the dashboard is entered without a specific route,
// which is what happens right after signing in.
export const unstable_settings = { initialRouteName: "overview" };

export default function DashboardLayoutRoute() {
  // const router = useRouter();

  // useEffect(() => {
  //   let toggle = false;

  //   const interval = setInterval(() => {
  //     toggle = !toggle;

  //     router.push(toggle ? "/classes" : "/scheduling");
  //   }, 5000);

  //   return () => clearInterval(interval);
  // }, [router]);

  return (
    <DashboardLayout>
      <Stack initialRouteName="overview" screenOptions={{ headerShown: false, animation: "none", }} />
    </DashboardLayout>
  );
}