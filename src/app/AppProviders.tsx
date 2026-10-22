import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { useTheme } from "../shared/hooks/useTheme";
import { ToastProvider } from "../shared/components/ToastProvider";

const AppearanceContext = createContext<ReturnType<typeof useTheme> | null>(null);
const DraftContext = createContext<Map<string, string> | null>(null);

export function AppProviders({ children }: { children: ReactNode }) {
  const appearance = useTheme();
  const [drafts] = useState(() => new Map<string, string>());
  return <AppearanceContext.Provider value={appearance}>
    <DraftContext.Provider value={drafts}><ToastProvider>{children}</ToastProvider></DraftContext.Provider>
  </AppearanceContext.Provider>;
}

export function useAppearance() {
  const value = useContext(AppearanceContext);
  if (!value) throw new Error("AppProviders is required");
  return value;
}

// Route changes retain drafts only in this page's memory; nothing is persisted.
export function useToolDraft(id: string) {
  const drafts = useContext(DraftContext);
  if (!drafts) throw new Error("AppProviders is required");
  const [value, setValue] = useState(() => drafts.get(id) ?? "");
  const update = useCallback((next: string) => {
    if (next) drafts.set(id, next);
    else drafts.delete(id);
    setValue(next);
  }, [drafts, id]);
  return [value, update] as const;
}
