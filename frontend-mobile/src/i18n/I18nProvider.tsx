import AsyncStorage from "@react-native-async-storage/async-storage"
import React, { useEffect, useMemo, useState } from "react"
import { I18nContext, setCurrentLanguage, type I18nContextValue } from "./i18n"
import { translations, type Language } from "./translations"

const STORAGE_KEY = "liquidly.language"

const isLanguage = (v: string | null): v is Language => v === "pt" || v === "en" || v === "es"

const interpolate = (template: string, params?: Record<string, string | number>) => {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, k: string) => {
    const v = params[k]
    return v === undefined ? `{${k}}` : String(v)
  })
}

export const I18nProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<Language>("pt")

  useEffect(() => {
    ;(async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY)
        if (isLanguage(stored)) {
          setLanguageState(stored)
          setCurrentLanguage(stored)
        }
      } catch {
        return
      }
    })()
  }, [])

  const value = useMemo<I18nContextValue>(() => {
    const setLanguage = (next: Language) => {
      setLanguageState(next)
      setCurrentLanguage(next)
      void AsyncStorage.setItem(STORAGE_KEY, next)
    }

    const t = (key: string, params?: Record<string, string | number>) => {
      const text = translations[language][key] ?? translations.en[key] ?? key
      return interpolate(text, params)
    }

    return { language, setLanguage, t }
  }, [language])

  useEffect(() => {
    setCurrentLanguage(language)
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
