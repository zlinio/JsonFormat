import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { languagePreference } from "../../i18n";
import type { LanguagePreference } from "../../i18n/languagePreference";
import { PreferenceMenu } from "./PreferenceMenu";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [preference, setPreference] = useState(languagePreference.get);

  useEffect(() => {
    const followBrowser = () => {
      if (preference === "auto") void i18n.changeLanguage();
    };
    window.addEventListener("languagechange", followBrowser);
    return () => window.removeEventListener("languagechange", followBrowser);
  }, [i18n, preference]);

  return <PreferenceMenu<LanguagePreference> label={t("actions.language")} icon="language" value={preference}
    choices={[
      { value: "auto", label: t("actions.followBrowser") },
      { value: "zh-CN", label: "简体中文", lang: "zh-CN" },
      { value: "en", label: "English", lang: "en" },
    ]}
    onChange={value => {
      languagePreference.set(value);
      setPreference(value);
      void i18n.changeLanguage();
    }} />;
}
