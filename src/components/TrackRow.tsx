import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Track } from "../data/catalog";
import {
  addToPlaylist,
  downloadTrack,
  navigate,
  removeDownload,
  removeFromPlaylist,
  toggleLike,
} from "../lib/actions";
import { formatTime } from "../lib/format";
import { playTrack } from "../lib/player";
import { albumOfTrack, useStore } from "../lib/store";
import { Cover } from "./Cover";
import {
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  MoreIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
  XIcon,
} from "./Icons";

type Props = {
  track: Track;
  queue: string[];
  index?: number;
  showAlbum?: boolean;
  playlistId?: string;
};

type MenuPos = { x: number; y: number };

const MENU_WIDTH = 236;

export const TrackRow = ({ track, queue, index, showAlbum = true, playlistId }: Props) => {
  const isCurrent = useStore((s) => s.currentId === track.id);
  const isPlaying = useStore((s) => s.playing && s.currentId === track.id);
  const liked = useStore((s) => s.liked.includes(track.id));
  const download = useStore((s) => s.downloads[track.id]);
  const playlists = useStore((s) => s.playlists);

  const [menu, setMenu] = useState<MenuPos | null>(null);
  const moreRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => {
      if (event.target instanceof Node && (moreRef.current?.contains(event.target) || menuRef.current?.contains(event.target))) {
        return;
      }
      setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  // Ajusta el menu al alto real una vez montado (numero de listas variable).
  useLayoutEffect(() => {
    const node = menuRef.current;
    if (!menu || !node) return;
    const rect = node.getBoundingClientRect();
    const x = Math.max(12, Math.min(menu.x, window.innerWidth - rect.width - 12));
    const y = Math.max(12, Math.min(menu.y, window.innerHeight - rect.height - 12));
    if (x !== menu.x || y !== menu.y) setMenu({ x, y });
  }, [menu]);

  const openMenu = () => {
    if (menu) {
      setMenu(null);
      return;
    }
    const rect = moreRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.max(12, Math.min(window.innerWidth - MENU_WIDTH - 12, rect.right - MENU_WIDTH));
    setMenu({ x, y: rect.bottom + 6 });
  };

  const play = () => {
    void playTrack(track.id, queue);
  };

  const downloadButton = () => {
    if (download === "pending") {
      return (
        <span className="dl-pending" aria-label="Descargando">
          <span className="spinner" />
        </span>
      );
    }
    if (download === "done") {
      return (
        <button
          type="button"
          className="icon-btn is-on"
          aria-label={`Eliminar descarga de ${track.title}`}
          title="Descargada · clic para eliminar"
          onClick={(event) => {
            event.stopPropagation();
            void removeDownload(track.id);
          }}
        >
          <CheckIcon size={16} />
        </button>
      );
    }
    return (
      <button
        type="button"
        className="icon-btn"
        aria-label={`Descargar ${track.title}`}
        title="Descargar para uso sin conexión"
        onClick={(event) => {
          event.stopPropagation();
          void downloadTrack(track.id);
        }}
      >
        <DownloadIcon size={16} />
      </button>
    );
  };

  return (
    <div
      className={`track-row${isCurrent ? " is-current" : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Reproducir ${track.title} de ${track.artist}`}
      onClick={play}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          play();
        }
      }}
    >
      <div className="track-index">
        {isCurrent ? (
          <span className={`eq${isPlaying ? " is-live" : ""}`} aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
        ) : (
          <>
            <span className="track-num">{index !== undefined ? index + 1 : ""}</span>
            <PlayIcon size={14} className="track-hover-play" />
          </>
        )}
      </div>

      <Cover
        album={albumOfTrack(track) ?? { from: "#1db954", to: "#0f766e", title: track.title }}
        size="sm"
      />

      <div className="track-main">
        <p className="track-title">{track.title}</p>
        <p className="track-artist">{track.artist}</p>
      </div>

      {showAlbum && <p className="track-album">{track.albumTitle}</p>}

      <div className="track-actions">
        <button
          type="button"
          className={`icon-btn${liked ? " is-on" : ""}`}
          aria-label={liked ? `Quitar ${track.title} de me gusta` : `Añadir ${track.title} a me gusta`}
          aria-pressed={liked}
          onClick={(event) => {
            event.stopPropagation();
            toggleLike(track.id);
          }}
        >
          <HeartIcon size={16} filled={liked} />
        </button>
        {downloadButton()}
      </div>

      <span className="track-time">{formatTime(track.duration)}</span>

      <button
        ref={moreRef}
        type="button"
        className={`icon-btn track-more${menu ? " is-on" : ""}`}
        aria-label={`Más opciones de ${track.title}`}
        aria-haspopup="menu"
        aria-expanded={Boolean(menu)}
        onClick={(event) => {
          event.stopPropagation();
          openMenu();
        }}
      >
        <MoreIcon size={16} />
      </button>

      {menu &&
        createPortal(
          <div
            ref={menuRef}
            className="menu"
            role="menu"
            style={{ left: menu.x, top: menu.y, width: MENU_WIDTH }}
            onClick={(event) => event.stopPropagation()}
          >
          <p className="menu-label">Añadir a una lista</p>
          <div className="menu-scroll">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  addToPlaylist(playlist.id, track.id);
                  setMenu(null);
                }}
              >
                <PlusIcon size={15} />
                <span>{playlist.name}</span>
              </button>
            ))}
          </div>
          <div className="menu-sep" />
          {playlistId && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                removeFromPlaylist(playlistId, track.id);
                setMenu(null);
              }}
            >
              <XIcon size={15} />
              <span>Quitar de esta lista</span>
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              navigate({ name: "album", id: track.albumId });
              setMenu(null);
            }}
          >
            <PlayIcon size={14} />
            <span>Ir al álbum</span>
          </button>
          {download === "done" ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void removeDownload(track.id);
                setMenu(null);
              }}
            >
              <TrashIcon size={15} />
              <span>Eliminar descarga</span>
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                void downloadTrack(track.id);
                setMenu(null);
              }}
            >
              <DownloadIcon size={15} />
              <span>Descargar sin conexión</span>
            </button>
          )}
          </div>,
          document.body,
        )}
    </div>
  );
};
