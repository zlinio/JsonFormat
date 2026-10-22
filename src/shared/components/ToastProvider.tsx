import { createContext, useCallback, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { resources } from "../../i18n/resources";
import type { Theme } from "../lib/theme";
import { Toaster } from "./ui/sonner";

type NoticeKey = keyof typeof resources.en.translation.notifications;
type Notice = { key: NoticeKey; filename?: string };
const NoticeContext = createContext<((key: NoticeKey, filename?: string) => void) | null>(null);
const noticeId = "toolbox-notice";

function NoticeMessage({ notice }: { notice: Notice }) {
  const { t } = useTranslation();
  return <span>{t(`notifications.${notice.key}`, { filename: notice.filename })}</span>;
}

export function ToastProvider({ children, theme }: { children: ReactNode; theme: Theme }) {
  const { t } = useTranslation();
  const notify = useCallback((key: NoticeKey, filename?: string) => {
    const show = key === "copyFallback" ? toast.warning : toast.success;
    show(<NoticeMessage notice={{ key, filename }} />, { id: noticeId, toasterId: "toolbox" });
  }, []);
  useEffect(() => () => { toast.dismiss(noticeId); }, []);

  return <NoticeContext.Provider value={notify}>
    {children}
    <Toaster id="toolbox" theme={theme} position="bottom-center" closeButton duration={3500} visibleToasts={1}
      customAriaLabel={t("actions.notifications")} containerAriaLabel={t("actions.notifications")}
      toastOptions={{ closeButtonAriaLabel: t("actions.closeToast") }} />
  </NoticeContext.Provider>;
}

export function useNotice() {
  const value = useContext(NoticeContext);
  if (!value) throw new Error("ToastProvider is required");
  return value;
}
