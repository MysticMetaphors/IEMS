import DashboardLayout from "@/components/layout/dashboardLayout";
import { Stack } from "expo-router";

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
      <Stack screenOptions={{ headerShown: false, animation: "none", }} />
    </DashboardLayout>
  );
}