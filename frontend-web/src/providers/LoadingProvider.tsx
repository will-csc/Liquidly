import { useEffect, useRef, useState } from "react"
import { loadingBus } from "@/services/loadingBus"
import { useI18n } from "@/i18n/i18n"

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n()
  const [visible, setVisible] = useState(false)
  const showTimerRef = useRef<number | null>(null)
  const pendingRef = useRef(0)
  const visibleRef = useRef(false)

  const setVisibleState = (next: boolean) => {
    visibleRef.current = next
    setVisible(next)
  }

  useEffect(() => {
    const unsubscribe = loadingBus.subscribe((nextPending) => {
      pendingRef.current = nextPending

      if (nextPending > 0) {
        if (visibleRef.current) return
        if (showTimerRef.current) return
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null
          if (pendingRef.current > 0) setVisibleState(true)
        }, 350)
        return
      }

      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
      setVisibleState(false)
    })
    return () => {
      unsubscribe()
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
    }
  }, [])

  return (
    <>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-[2000] bg-black/30 backdrop-blur-[2px] flex items-center justify-center">
          <div className="bg-card text-foreground border border-border rounded-2xl px-6 py-5 shadow-elevated flex items-center gap-4">
            <div className="h-9 w-9 rounded-full border-4 border-primary/25 border-t-primary animate-spin" />
            <div className="flex flex-col">
              <div className="text-base font-semibold">{t("common.loading")}</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
