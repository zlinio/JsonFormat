import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";
import { languagePreference } from "../i18n";
import type { LanguagePreference } from "../i18n/languagePreference";

const choices: { code: LanguagePreference; label?: string }[] = [
  { code: "auto" },
  { code: "zh-CN", label: "简体中文" },
  { code: "en", label: "English" },
];

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [preference, setPreference] = useState(languagePreference.get);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const followBrowser = () => {
      if (preference === "auto") void i18n.changeLanguage();
    };
    window.addEventListener("languagechange", followBrowser);
    return () => window.removeEventListener("languagechange", followBrowser);
  }, [i18n, preference]);

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
              aria-checked={preference === choice.code}
              lang={choice.code === "auto" ? undefined : choice.code}
              tabIndex={preference === choice.code ? 0 : -1}
              onClick={() => {
                languagePreference.set(choice.code);
                setPreference(choice.code);
                void i18n.changeLanguage();
                setOpen(false);
                trigger.current?.focus();
              }}
            >
              <span>{choice.code === "auto" ? t("actions.followBrowser") : choice.label}</span>
              {preference === choice.code && (
                <Icon name="check" width={15} height={15} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
