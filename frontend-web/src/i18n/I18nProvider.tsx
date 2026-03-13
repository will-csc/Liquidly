import { useMemo, useState } from "react"
import { I18nContext, type I18nContextValue } from "./i18n"
import { translations, type Language } from "./translations"

const STORAGE_KEY = "language"

const getInitialLanguage = (): Language => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === "pt" || stored === "en" || stored === "es") return stored
  return "pt"
}

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage)

  const setLanguage = (next: Language) => {
    setLanguageState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  const value = useMemo<I18nContextValue>(() => {
    const t = (key: string, params?: Record<string, string | number>) => {
      const text = translations[language][key] ?? translations.en[key] ?? key
      return interpolate(text, params)
    }
    return { language, setLanguage, t }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
