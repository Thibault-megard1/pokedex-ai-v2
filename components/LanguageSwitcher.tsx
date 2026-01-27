"use client";

import { useLanguage } from "./LanguageProvider";
import { Lang, SUPPORTED_LANGS } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  const cycleLang = () => {
    const currentIndex = SUPPORTED_LANGS.indexOf(lang);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGS.length;
    setLang(SUPPORTED_LANGS[nextIndex]);
  };

  const langLabels: Record<Lang, string> = {
    fr: "FR",
    en: "EN",
    es: "ES",
  };

  return (
    <button
      onClick={cycleLang}
      className="px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-all flex items-center gap-1.5 border border-white/30"
      aria-label="Switch language"
      title={`Current: ${langLabels[lang]}`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span className="font-mono">{langLabels[lang]}</span>
    </button>
  );
}
