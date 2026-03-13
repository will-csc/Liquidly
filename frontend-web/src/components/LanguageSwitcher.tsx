import { useI18n } from "@/i18n/i18n"
import type { Language } from "@/i18n/translations"

const options: { value: Language; labelKey: string }[] = [
  { value: "pt", labelKey: "language.portuguese" },
  { value: "en", labelKey: "language.english" },
  { value: "es", labelKey: "language.spanish" },
]

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useI18n()

  return (
    <div className="language-switcher">
      <select
        className="language-switcher__select"
        value={language}
        onChange={(e) => setLanguage(e.target.value as Language)}
        aria-label="Language"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {t(o.labelKey)}
          </option>
        ))}
      </select>
    </div>
  )
}

export default LanguageSwitcher
