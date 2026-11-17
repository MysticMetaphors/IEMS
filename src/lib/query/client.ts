import { focusManager, QueryClient } from "@tanstack/react-query";
import { AppState, Platform } from "react-native";

/**
 * One cache for the whole app.
 *
 * All data comes from the on-device SQLite database, so:
 * - `networkMode: "always"` — queries must never pause because the phone is
 *   offline (the default would wait for a connection that is not needed).
 * - `retry: false` — a local query that fails will fail again; show the error
 *   (and the screen's "Try again") right away.
 * - `staleTime` is long on purpose: every write in the app invalidates the
 *   queries it affects (see `invalidate.ts`), so cached rows stay correct
 *   without refetching on every screen visit.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "always",
      retry: false,
      staleTime: 5 * 60_000,
      gcTime: 30 * 60_000,
      refetchOnReconnect: false,
    },
    mutations: {
      networkMode: "always",
    },
  },
});

// React Native has no "window focus". Treat the app coming back to the
// foreground as a focus so stale queries (e.g. "today's classes" after
// midnight) refresh. On web, TanStack's built-in listener is kept.
if (Platform.OS !== "web") {
  focusManager.setEventListener((handleFocus) => {
    const subscription = AppState.addEventListener("change", (state) => {
      handleFocus(state === "active");
    });

    return () => subscription.remove();
  });
}
