import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import type { Locale } from "../i18n/resources";

const choices: { code: Locale; label: string }[] = [
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    root.current?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="language-switcher" ref={root}>
      <button
        ref={trigger}
        className="icon-button"
        aria-label={t("actions.language")}
        title={t("actions.language")}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? "language-menu" : undefined}
        onClick={() => setOpen(value => !value)}
      >
        <Icon name="language" />
      </button>
      {open && (
        <div
          id="language-menu"
          className="language-menu"
          role="menu"
          aria-label={t("actions.language")}
          onKeyDown={event => {
            if (event.key === "Tab") {
              setOpen(false);
              return;
            }
            const items = Array.from(
              event.currentTarget.querySelectorAll<HTMLButtonElement>("button"),
            );
            const index = items.indexOf(document.activeElement as HTMLButtonElement);
            const next =
              event.key === "ArrowDown"
                ? (index + 1) % items.length
                : event.key === "ArrowUp"
                  ? (index + items.length - 1) % items.length
                  : event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? items.length - 1
                      : -1;
            if (next >= 0) {
              event.preventDefault();
              items[next]?.focus();
            }
          }}
        >
          {choices.map(choice => (
            <button
              key={choice.code}
              type="button"
              role="menuitemradio"
              aria-checked={i18n.resolvedLanguage === choice.code}
              lang={choice.code}
              tabIndex={i18n.resolvedLanguage === choice.code ? 0 : -1}
              onClick={() => {
                void i18n.changeLanguage(choice.code);
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <span>{choice.label}</span>
              {i18n.resolvedLanguage === choice.code && (
                <Icon name="check" width={15} height={15} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
