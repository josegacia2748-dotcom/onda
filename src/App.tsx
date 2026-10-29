import { useEffect, useRef } from "react";
import { BackIcon, HomeIcon, LibraryIcon, PaletteIcon, SearchIcon, XIcon } from "./components/Icons";
import { Player } from "./components/Player";
import { Sidebar } from "./components/Sidebar";
import { ThemePanel } from "./components/ThemePanel";
import { Views } from "./components/Views";
import { navigate, setOnline, setSearch, toggleThemePanel } from "./lib/actions";
import { inkFor } from "./lib/format";
import { togglePlay } from "./lib/player";
import { useStore } from "./lib/store";

const MOBILE_NAV = [
  { key: "home", label: "Inicio", icon: HomeIcon },
  { key: "search", label: "Buscar", icon: SearchIcon },
  { key: "library", label: "Biblioteca", icon: LibraryIcon },
] as const;

export const App = () => {
  const theme = useStore((s) => s.theme);
  const route = useStore((s) => s.route);
  const online = useStore((s) => s.online);
  const search = useStore((s) => s.search);
  const toast = useStore((s) => s.toast);
  const themeOpen = useStore((s) => s.themeOpen);
  const scrollRef = useRef<HTMLElement>(null);

  const routeKey = `${route.name}:${"id" in route ? route.id : ""}`;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent", theme.accent);
    root.style.setProperty("--accent-ink", inkFor(theme.accent));
    root.style.setProperty("--radius", `${theme.radius}px`);
    root.dataset.amoled = theme.amoled ? "true" : "false";
    root.dataset.motion = theme.motion ? "on" : "off";
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme.amoled ? "#000000" : "#08090b");
  }, [theme]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [routeKey]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== "Space") return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
      event.preventDefault();
      togglePlay();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="app">
      <Sidebar />

      <div className="shell">
        <header className="topbar">
          {route.name !== "home" && (
            <button
              type="button"
              className="icon-btn topbar-back"
              aria-label="Volver al inicio"
              onClick={() => navigate({ name: "home" })}
            >
              <BackIcon size={18} />
            </button>
          )}

          <div className="search-box">
            <SearchIcon size={17} />
            <input
              type="search"
              value={search}
              placeholder="¿Qué quieres escuchar?"
              aria-label="Buscar en el catálogo"
              onChange={(event) => {
                setSearch(event.target.value);
                if (event.target.value.trim()) navigate({ name: "search" });
              }}
              onFocus={() => {
                if (route.name !== "search") navigate({ name: "search" });
              }}
            />
            {search && (
              <button type="button" className="search-clear" aria-label="Limpiar búsqueda" onClick={() => setSearch("")}>
                <XIcon size={14} />
              </button>
            )}
          </div>

          <div className="topbar-right">
            <span className={`net-chip${online ? " is-online" : " is-offline"}`}>
              <span className="status-dot" />
              {online ? "En línea" : "Sin conexión"}
            </span>
            <button
              type="button"
              className="icon-btn theme-btn"
              aria-label="Personalizar tema"
              title="Personalizar tema"
              onClick={toggleThemePanel}
            >
              <PaletteIcon size={18} />
            </button>
          </div>
        </header>

        <main className="main-scroll" ref={scrollRef}>
          <Views />
        </main>
      </div>

      <ThemePanel />
      <Player />

      <nav className="mobile-nav" aria-label="Navegación">
        {MOBILE_NAV.map((item) => {
          const active = route.name === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`mobile-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate({ name: item.key })}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          className={`mobile-link${themeOpen ? " is-active" : ""}`}
          onClick={toggleThemePanel}
        >
          <PaletteIcon size={20} />
          <span>Tema</span>
        </button>
      </nav>

      {toast && (
        <div key={toast.id} className={`toast${toast.kind === "error" ? " is-error" : ""}`} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
};
