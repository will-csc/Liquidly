import { createContext, useContext } from "react"
import type { Language } from "./translations"

export type I18nContextValue = {
  language: Language
  setLanguage: (language: Language) => void
  t: (key: string, params?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18nContextValue | null>(null)

export const useI18n = () => {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error("useI18n must be used within I18nProvider")
  return ctx
}
