import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation } from "react-router-dom"
import { Sparkles } from "lucide-react"
import { loadingBus } from "@/services/loadingBus"
import { useI18n } from "@/i18n/i18n"
import logoGreen from "@/assets/images/logo-green.png"

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const { t } = useI18n()
  const location = useLocation()
  const [apiVisible, setApiVisible] = useState(false)
  const [routeVisible, setRouteVisible] = useState(false)
  const showTimerRef = useRef<number | null>(null)
  const routeTimerRef = useRef<number | null>(null)
  const pendingRef = useRef(0)
  const apiVisibleRef = useRef(false)
  const routeKeyRef = useRef(`${location.pathname}${location.search}`)

  const setApiVisibleState = (next: boolean) => {
    apiVisibleRef.current = next
    setApiVisible(next)
  }

  const routeName = useMemo(() => {
    if (location.pathname === "/dashboard/projects") return t("nav.projects")
    if (location.pathname === "/dashboard/bom") return t("nav.bom")
    if (location.pathname === "/dashboard/report") return t("nav.report")
    if (location.pathname === "/dashboard/conversions") return t("nav.conversions")
    if (location.pathname.startsWith("/dashboard")) return t("nav.home")
    return t("common.loading")
  }, [location.pathname, t])

  const visible = apiVisible || routeVisible
  const title = routeVisible ? t("common.loadingRouteTitle", { page: routeName }) : t("common.loading")
  const subtitle = routeVisible
    ? t("common.loadingRouteSubtitle", { page: routeName })
    : t("common.loadingDataSubtitle")

  useEffect(() => {
    const unsubscribe = loadingBus.subscribe((nextPending) => {
      pendingRef.current = nextPending

      if (nextPending > 0) {
        if (apiVisibleRef.current) return
        if (showTimerRef.current) return
        showTimerRef.current = window.setTimeout(() => {
          showTimerRef.current = null
          if (pendingRef.current > 0) setApiVisibleState(true)
        }, 180)
        return
      }

      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
      setApiVisibleState(false)
    })
    return () => {
      unsubscribe()
      if (showTimerRef.current) {
        window.clearTimeout(showTimerRef.current)
        showTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const nextRouteKey = `${location.pathname}${location.search}`
    if (routeKeyRef.current === nextRouteKey) return

    routeKeyRef.current = nextRouteKey
    setRouteVisible(true)

    if (routeTimerRef.current) {
      window.clearTimeout(routeTimerRef.current)
    }

    routeTimerRef.current = window.setTimeout(() => {
      setRouteVisible(false)
      routeTimerRef.current = null
    }, 650)

    return () => {
      if (routeTimerRef.current) {
        window.clearTimeout(routeTimerRef.current)
        routeTimerRef.current = null
      }
    }
  }, [location.pathname, location.search])

  return (
    <>
      {children}
      {visible ? (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center overflow-hidden bg-background/60 backdrop-blur-md">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.12),_transparent_35%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.10),_transparent_30%)]" />
          <div className="relative w-full max-w-md rounded-[28px] border border-border/60 bg-card/95 p-6 shadow-elevated">
            <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/15 bg-primary/5 shadow-card">
                <div className="absolute inset-0 rounded-2xl border-2 border-primary/10 border-t-primary animate-spin" />
                <img src={logoGreen} alt="Liquidly" className="h-8 w-8 object-contain" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 text-primary">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em]">{t("common.loadingBadge")}</span>
                </div>
                <div className="mt-2 text-lg font-semibold text-foreground">{title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div>
              </div>
            </div>

            <div className="mt-5">
              <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-primary/35 via-primary to-primary/35 animate-pulse" />
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>{routeVisible ? routeName : t("common.loading")}</span>
                <span>{t("common.loadingShort")}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="h-2 rounded-full bg-primary/25 animate-pulse" />
              <div className="h-2 rounded-full bg-primary/40 animate-pulse [animation-delay:150ms]" />
              <div className="h-2 rounded-full bg-primary/25 animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
