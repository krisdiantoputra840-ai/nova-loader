import * as React from "react"
import { ArrowDownToLine, ArrowLeft, Check, Clipboard, History, Monitor, Moon, Settings2, Sun } from "lucide-react"
import { motion, useInView, usePageInView, useReducedMotion } from "motion/react"
import { platforms } from "@/components/PlatformIcons"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from "@/components/ui/popover"

type Theme = "system" | "light" | "dark"
const THEME_KEY = "nova-loader-theme"
const themeOptions = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const

export function App() {
  const [url, setUrl] = React.useState("")
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      return saved === "light" || saved === "dark" ? saved : "system"
    } catch {
      return "system"
    }
  })
  const heroRef = React.useRef<HTMLElement>(null)
  const isHeroInView = useInView(heroRef, { initial: true, amount: 0.05 })
  const isPageInView = usePageInView()
  const prefersReducedMotion = useReducedMotion()
  const animateGlow = isHeroInView && isPageInView && !prefersReducedMotion
  const isSettingsPage = window.location.pathname === "/settings"
  const isHistoryPage = window.location.pathname === "/history"

  React.useEffect(() => {
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
    const applyTheme = () => {
      document.documentElement.classList.toggle("dark", theme === "dark" || (theme === "system" && systemTheme.matches))
    }

    applyTheme()
    systemTheme.addEventListener("change", applyTheme)
    return () => systemTheme.removeEventListener("change", applyTheme)
  }, [theme])

  const selectTheme = (nextTheme: Theme) => {
    setTheme(nextTheme)
    try {
      if (nextTheme === "system") localStorage.removeItem(THEME_KEY)
      else localStorage.setItem(THEME_KEY, nextTheme)
    } catch {
      // Theme selection still works for this session when storage is unavailable.
    }
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text) setUrl(text.trim())
    } catch {
      // Clipboard access depends on browser permission.
    }
  }

  const handleDownload = (event: React.FormEvent) => {
    event.preventDefault()
    if (!url.trim()) return
    // Download handling will be connected when the API supports it.
  }

  const themeChoices = themeOptions.map((option) => {
    const Icon = option.icon
    return (
      <Button
        key={option.value}
        type="button"
        variant="ghost"
        className="theme-option"
        aria-pressed={theme === option.value}
        onClick={() => selectTheme(option.value)}
      >
        <Icon size={17} strokeWidth={1.8} />
        <span>{option.label}</span>
        {theme === option.value && <Check className="theme-check" size={16} strokeWidth={2} aria-hidden="true" />}
      </Button>
    )
  })

  return (
    <div className="page-shell">
      <motion.div
        className="ambient-glow"
        aria-hidden="true"
        initial={false}
        animate={animateGlow
          ? { x: [0, -55, 30, 0], y: [0, 22, -18, 0], scale: [1, 1.06, 0.98, 1] }
          : { x: 0, y: 0, scale: 1 }}
        transition={animateGlow
          ? { duration: 14, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.25 }}
      />
      <motion.div
        className="ambient-glow ambient-glow-secondary"
        aria-hidden="true"
        initial={false}
        animate={animateGlow
          ? { x: [0, 38, -28, 0], y: [0, -22, 14, 0], scale: [1, 1.04, 0.98, 1] }
          : { x: 0, y: 0, scale: 1 }}
        transition={animateGlow
          ? { duration: 16, repeat: Infinity, ease: "easeInOut" }
          : { duration: 0.25 }}
      />
      <header className="site-header">
        <a className="brand" href="/" aria-label="Nova Loader home">
          <span className="brand-mark" aria-hidden="true"><img src="/logo-transparent.png" alt="" width="56" height="56" /></span>
          <span>nova<span className="brand-light">loader</span></span>
        </a>
        <nav className="nav-actions" aria-label="Utilities">
          <Button variant="ghost" size="icon" className="nav-action" asChild>
            <a href="/history" aria-label="History" title="History" aria-current={isHistoryPage ? "page" : undefined}>
                <History size={19} strokeWidth={1.8} />
            </a>
          </Button>
          <Button variant="ghost" size="icon" className="nav-action" asChild>
            <a href="/settings" aria-label="Settings" title="Settings" aria-current={isSettingsPage ? "page" : undefined}>
              <Settings2 size={19} strokeWidth={1.8} />
            </a>
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="nav-action" aria-label="Theme" title="Theme">
                <Sun size={19} strokeWidth={1.8} />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" sideOffset={10} className="nav-popover">
              <PopoverHeader>
                <PopoverTitle>Appearance</PopoverTitle>
                <PopoverDescription>Choose a theme.</PopoverDescription>
              </PopoverHeader>
              <div className="theme-options" role="group" aria-label="Theme">{themeChoices}</div>
            </PopoverContent>
          </Popover>
        </nav>
      </header>

      {isSettingsPage || isHistoryPage ? (
        <main className="settings-page">
          <a className="return-home" href="/"><ArrowLeft size={17} strokeWidth={1.8} aria-hidden="true" />Return to home</a>
          {isSettingsPage ? (
            <>
              <div className="settings-heading">
                <p className="settings-eyebrow">Preferences</p>
                <h1>Settings</h1>
                <p>Make Nova Loader feel right for you.</p>
              </div>
              <section className="settings-section" aria-labelledby="appearance-heading">
                <div>
                  <h2 id="appearance-heading">Appearance</h2>
                  <p>Choose how the app looks on this device.</p>
                </div>
                <div className="theme-options settings-theme-options" role="group" aria-label="Theme">{themeChoices}</div>
              </section>
            </>
          ) : (
            <div className="settings-heading">
              <p className="settings-eyebrow">Activity</p>
              <h1>History</h1>
              <p>Your downloads will appear here.</p>
              <section className="history-section" aria-label="Download history">
                <History size={24} strokeWidth={1.6} aria-hidden="true" />
                <span>No downloads yet.</span>
              </section>
            </div>
          )}
        </main>
      ) : <main className="hero" ref={heroRef}>
        <div className="hero-copy">
          <h1>Paste a link.<br />Get your media.</h1>
          <p>Download videos and music from the places you use every day.</p>
        </div>

        <form className="download-form" onSubmit={handleDownload}>
          <label htmlFor="media-url">Media link</label>
          <div className="form-row">
            <input
              id="media-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="Paste a video or music URL"
              autoComplete="url"
              required
            />
            <button className="paste-button" type="button" onClick={handlePaste}>
              <Clipboard size={16} strokeWidth={1.8} />
              <span>Paste</span>
            </button>
            <button className="download-button" type="submit">
              <ArrowDownToLine size={17} strokeWidth={2} />
              <span>Download</span>
            </button>
          </div>
        </form>

        <section className="platforms" aria-label="Supported platforms">
          <p>Works with</p>
          <ul>
            {platforms.map((platform) => {
              const Icon = platform.icon
              return (
                <li key={platform.id}>
                  <Icon className="platform-icon" aria-hidden="true" />
                  <span>{platform.name}</span>
                </li>
              )
            })}
          </ul>
        </section>
      </main>}
    </div>
  )
}

export default App
