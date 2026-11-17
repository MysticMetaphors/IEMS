import { useFocusEffect } from "expo-router";
import { useCallback, useRef } from "react";

/**
 * Runs `refresh` each time the screen comes back into focus, but not the
 * first time (the query already loads when the screen mounts).
 *
 * The cached rows stay on screen while `refresh` runs, so coming back to a
 * screen never shows the loading placeholders again.
 */
export function useRefreshOnFocus(refresh: () => unknown) {
  const hasBeenFocused = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (hasBeenFocused.current) {
        void refresh();
      } else {
        hasBeenFocused.current = true;
      }
    }, [refresh])
  );
}
