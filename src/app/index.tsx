import { useAuth } from "@/lib/auth/auth-context";
import { Redirect } from "expo-router";

export default function Index() {
  const { state } = useAuth();

  if (!state) return null;

  if (state.user) return <Redirect href="/(dashboard)/overview" />;

  return <Redirect href={state.hasAccount ? "/auth/login" : "/auth/register"} />;
}
