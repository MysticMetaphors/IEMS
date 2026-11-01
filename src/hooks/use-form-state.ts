import { useCallback, useEffect, useState } from "react";

export function useFormState<T extends object>( build: () => T, open: boolean, resetKey: string ) {
  const [form, setForm] = useState<T>(build);
  const set = useCallback(
    <K extends keyof T>(key: K, value: T[K]) => setForm((prev) => ({ ...prev, [key]: value })),
    []
  );

  useEffect(() => {
    if (open) setForm(build());
  }, [open, resetKey]);

  return [form, set, setForm] as const;
}