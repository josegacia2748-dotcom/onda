import { navigate, setLibraryTab, toggleThemePanel } from "../lib/actions";
import { useStore } from "../lib/store";
import { DownloadIcon, HeartIcon, HomeIcon, LibraryIcon, PaletteIcon, PlusIcon, SearchIcon } from "./Icons";

const NAV = [
  { key: "home", label: "Inicio", icon: HomeIcon },
  { key: "search", label: "Buscar", icon: SearchIcon },
  { key: "library", label: "Tu biblioteca", icon: LibraryIcon },
] as const;

export const Sidebar = () => {
  const route = useStore((s) => s.route);
  const online = useStore((s) => s.online);
  const likedCount = useStore((s) => s.liked.length);
  const downloadCount = useStore((s) => s.downloads && Object.values(s.downloads).filter((v) => v === "done").length);
  const playlists = useStore((s) => s.playlists);
  const themeOpen = useStore((s) => s.themeOpen);

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
        <span className="brand-name">Onda</span>
      </div>

      <nav className="side-nav" aria-label="Principal">
        {NAV.map((item) => {
          const active = route.name === item.key;
          const Icon = item.icon;
          return (
            <button
              key={item.key}
              type="button"
              className={`side-link${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => navigate({ name: item.key })}
            >
              <Icon size={19} />
              <span>{item.label}</span>
              {item.key === "library" && likedCount > 0 && <span className="side-badge">{likedCount}</span>}
            </button>
          );
        })}
      </nav>

      <div className="side-section">
        <p className="side-label">Tu música</p>
        <button
          type="button"
          className="side-link side-link-sm"
          onClick={() => {
            setLibraryTab("liked");
            navigate({ name: "library" });
          }}
        >
          <HeartIcon size={16} />
          <span>Me gusta</span>
          <span className="side-count">{likedCount}</span>
        </button>
        <button
          type="button"
          className="side-link side-link-sm"
          onClick={() => {
            setLibraryTab("downloads");
            navigate({ name: "library" });
          }}
        >
          <DownloadIcon size={16} />
          <span>Descargas</span>
          <span className="side-count">{downloadCount}</span>
        </button>
      </div>

      <div className="side-section side-playlists">
        <p className="side-label">Listas</p>
        <div className="side-list">
          {playlists.map((playlist) => (
            <button
              key={playlist.id}
              type="button"
              className={`side-link side-link-sm${
                route.name === "playlist" && route.id === playlist.id ? " is-active" : ""
              }`}
              onClick={() => navigate({ name: "playlist", id: playlist.id })}
            >
              <span className="side-dot" />
              <span className="side-ellipsis">{playlist.name}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className="side-link side-link-sm side-new"
          onClick={() => {
            setLibraryTab("playlists");
            navigate({ name: "library" });
          }}
        >
          <PlusIcon size={16} />
          <span>Nueva lista</span>
        </button>
      </div>

      <div className="side-footer">
        <button
          type="button"
          className={`side-link side-link-sm${themeOpen ? " is-active" : ""}`}
          onClick={toggleThemePanel}
        >
          <PaletteIcon size={17} />
          <span>Personalizar tema</span>
        </button>
        <p className={`side-status${online ? " is-online" : " is-offline"}`}>
          <span className="status-dot" />
          {online ? "En línea" : "Sin conexión"}
        </p>
      </div>
    </aside>
  );
};
