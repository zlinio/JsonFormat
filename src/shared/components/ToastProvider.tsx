import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { resources } from "../../i18n/resources";
import { Icon } from "./Icon";

type NoticeKey = keyof typeof resources.en.translation.notifications;
type Notice = { key: NoticeKey; filename?: string };
const NoticeContext = createContext<((key: NoticeKey, filename?: string) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [notice, setNotice] = useState<Notice | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const notify = useCallback((key: NoticeKey, filename?: string) => {
    setNotice({ key, filename });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setNotice(null), 3500);
  }, []);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return <NoticeContext.Provider value={notify}>
    {children}
    <div className={"toast" + (notice ? " is-visible" : "")} role="status" aria-live="polite">
      {notice && <><Icon name="check" width={17} height={17} />
        <span>{t(`notifications.${notice.key}`, { filename: notice.filename })}</span>
        <button type="button" className="icon-button" aria-label={t("actions.closeToast")} onClick={() => setNotice(null)}>
          <Icon name="close" width={15} height={15} />
        </button>
      </>}
    </div>
  </NoticeContext.Provider>;
}

export function useNotice() {
  const value = useContext(NoticeContext);
  if (!value) throw new Error("ToastProvider is required");
  return value;
}
