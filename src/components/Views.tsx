import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import type { Album, Track } from "../data/catalog";
import { ALBUMS, GENRES, TRACKS, albumById, searchCatalog, trackById, tracksOfAlbum } from "../data/catalog";
import {
  createPlaylist,
  deletePlaylist,
  downloadAlbum,
  navigate,
  renamePlaylist,
  setLibraryTab,
  setSearch,
} from "../lib/actions";
import { downloadBytes } from "../lib/db";
import { formatBytes, greeting } from "../lib/format";
import { playTrack } from "../lib/player";
import { useStore } from "../lib/store";
import { Cover } from "./Cover";
import { TrackRow } from "./TrackRow";
import {
  BackIcon,
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  LibraryIcon,
  MusicIcon,
  OfflineIcon,
  PlayIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "./Icons";

const playAlbum = (album: Album): void => {
  const tracks = tracksOfAlbum(album.id);
  if (tracks.length) void playTrack(tracks[0].id, tracks.map((track) => track.id));
};

const openLibrary = (tab: "liked" | "downloads" | "playlists"): void => {
  setLibraryTab(tab);
  navigate({ name: "library" });
};

export const Views = () => {
  const route = useStore((s) => s.route);
  switch (route.name) {
    case "home":
      return <Home />;
    case "search":
      return <Search />;
    case "library":
      return <Library />;
    case "album":
      return <AlbumView id={route.id} />;
    case "playlist":
      return <PlaylistView id={route.id} />;
  }
};

const Home = () => {
  const online = useStore((s) => s.online);
  const liked = useStore((s) => s.liked);
  const featured = ALBUMS[0];
  const featuredTracks = tracksOfAlbum(featured.id);
  const mixQueue = useMemo(() => TRACKS.map((track) => track.id), []);
  const likedTracks = useMemo(
    () => liked.map((id) => trackById.get(id)).filter((track): track is Track => Boolean(track)),
    [liked],
  );

  return (
    <div className="view">
      {!online && (
        <div className="offline-banner" role="status">
          <OfflineIcon size={18} />
          <p>Estás sin conexión. Solo suenan las pistas que descargaste.</p>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => openLibrary("downloads")}>
            Ver descargas
          </button>
        </div>
      )}

      <header className="view-head">
        <h1>{greeting()}</h1>
        <p>Tu música, sin fricción.</p>
      </header>

      <section
        className="hero"
        style={{
          backgroundImage: `linear-gradient(110deg, ${featured.from}44, ${featured.to}2b 55%, #0a0c0f 100%)`,
        }}
      >
        <button
          type="button"
          className="hero-art"
          aria-label={`Abrir el álbum ${featured.title}`}
          onClick={() => navigate({ name: "album", id: featured.id })}
        >
          <Cover album={featured} size="hero" />
        </button>
        <div className="hero-copy">
          <p className="eyebrow">Álbum destacado</p>
          <h2>{featured.title}</h2>
          <p className="hero-sub">
            {featured.artist} · {featured.year} · {featured.genre}
          </p>
          <p className="hero-text">
            Sintetizadores cálidos y noches que no terminan. El punto de partida perfecto para tu próxima sesión.
          </p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary" onClick={() => playAlbum(featured)}>
              <PlayIcon size={16} /> Reproducir
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => void downloadAlbum(featured.id)}>
              <DownloadIcon size={16} /> Descargar álbum
            </button>
          </div>
        </div>
        <span className="hero-badge">{featuredTracks.length} pistas</span>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Accesos rápidos</h2>
          <button type="button" className="link-btn" onClick={() => navigate({ name: "search" })}>
            Explorar
          </button>
        </div>
        <div className="album-grid">
          {ALBUMS.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Mezcla de la semana</h2>
          <span className="section-note">{TRACKS.length} pistas · sin anuncios</span>
        </div>
        <div className="track-list">
          {TRACKS.map((track, index) => (
            <TrackRow key={track.id} track={track} queue={mixQueue} index={index} />
          ))}
        </div>
      </section>

      {likedTracks.length > 0 ? (
        <section className="section">
          <div className="section-head">
            <h2>Tus me gusta</h2>
            <button type="button" className="link-btn" onClick={() => openLibrary("liked")}>
              Ver todo
            </button>
          </div>
          <div className="track-list">
            {likedTracks.slice(0, 4).map((track, index) => (
              <TrackRow key={track.id} track={track} queue={liked} index={index} showAlbum={false} />
            ))}
          </div>
        </section>
      ) : (
        <section className="section">
          <div className="promo">
            <span className="promo-icon">
              <DownloadIcon size={22} />
            </span>
            <div className="promo-copy">
              <h3>Llévatela sin conexión</h3>
              <p>
                Descarga tus pistas favoritas y escúchalas en el metro, en el avión o donde no llegue la señal. Se
                guardan en este dispositivo.
              </p>
            </div>
            <button type="button" className="btn btn-primary" onClick={() => openLibrary("downloads")}>
              Ver descargas
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

const AlbumCard = ({ album }: { album: Album }) => (
  <div className="card album-card">
    <button
      type="button"
      className="card-open"
      aria-label={`Abrir el álbum ${album.title}`}
      onClick={() => navigate({ name: "album", id: album.id })}
    />
    <Cover album={album} size="hero" />
    <div className="card-body">
      <p className="card-title">{album.title}</p>
      <p className="card-sub">
        {album.artist} · {album.year}
      </p>
    </div>
    <button
      type="button"
      className="card-play"
      aria-label={`Reproducir ${album.title}`}
      onClick={() => playAlbum(album)}
    >
      <PlayIcon size={18} />
    </button>
  </div>
);

const Search = () => {
  const query = useStore((s) => s.search);
  const results = useMemo(() => searchCatalog(query), [query]);
  const active = query.trim().length > 0;
  const trackQueue = results.tracks.map((track) => track.id);

  return (
    <div className="view">
      <header className="view-head">
        <h1>Buscar</h1>
        <p>Encuentra álbumes, artistas o estados de ánimo.</p>
      </header>

      <div className="genre-grid">
        {GENRES.map((genre) => (
          <button
            key={genre}
            type="button"
            className={`genre-card genre-${genre.toLowerCase()}`}
            onClick={() => setSearch(genre)}
          >
            <span>{genre}</span>
            <span className="genre-dot" aria-hidden="true" />
          </button>
        ))}
      </div>

      {!active ? (
        <section className="section">
          <div className="section-head">
            <h2>Explora el catálogo</h2>
          </div>
          <p className="section-note">Toca un género para filtrar, o escribe en el buscador de arriba.</p>
        </section>
      ) : results.albums.length + results.tracks.length === 0 ? (
        <Empty
          icon={<SearchIcon size={22} />}
          title={`Sin resultados para “${query.trim()}”`}
          text="Prueba con otro título, artista o género."
          action={
            <button type="button" className="btn btn-ghost" onClick={() => setSearch("")}>
              Limpiar búsqueda
            </button>
          }
        />
      ) : (
        <>
          {results.albums.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Álbumes</h2>
              </div>
              <div className="album-grid">
                {results.albums.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </section>
          )}
          {results.tracks.length > 0 && (
            <section className="section">
              <div className="section-head">
                <h2>Pistas</h2>
                <span className="section-note">{results.tracks.length} resultados</span>
              </div>
              <div className="track-list">
                {results.tracks.map((track, index) => (
                  <TrackRow key={track.id} track={track} queue={trackQueue} index={index} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

const Library = () => {
  const tab = useStore((s) => s.libraryTab);
  const liked = useStore((s) => s.liked);
  const downloads = useStore((s) => s.downloads);
  const playlists = useStore((s) => s.playlists);
  const [name, setName] = useState("");
  const [bytes, setBytes] = useState(0);

  const likedTracks = useMemo(
    () => liked.map((id) => trackById.get(id)).filter((track): track is Track => Boolean(track)),
    [liked],
  );
  const downloadTracks = useMemo(
    () =>
      Object.entries(downloads)
        .filter(([, state]) => state === "done")
        .map(([id]) => trackById.get(id))
        .filter((track): track is Track => Boolean(track)),
    [downloads],
  );

  useEffect(() => {
    let alive = true;
    downloadBytes()
      .then((value) => {
        if (alive) setBytes(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [downloads]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const created = createPlaylist(name);
    if (created) {
      setName("");
      navigate({ name: "playlist", id: created.id });
    }
  };

  return (
    <div className="view">
      <header className="view-head">
        <h1>Tu biblioteca</h1>
        <p>Me gusta, descargas y listas en un solo lugar.</p>
      </header>

      <div className="tabs" role="tablist" aria-label="Secciones de la biblioteca">
        {(["liked", "downloads", "playlists"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            className={`tab${tab === key ? " is-active" : ""}`}
            onClick={() => setLibraryTab(key)}
          >
            {key === "liked" ? "Me gusta" : key === "downloads" ? "Descargas" : "Listas"}
            <span>{key === "liked" ? likedTracks.length : key === "downloads" ? downloadTracks.length : playlists.length}</span>
          </button>
        ))}
      </div>

      {tab === "liked" && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-id">
              <span className="panel-icon">
                <HeartIcon size={22} />
              </span>
              <div>
                <h2>Me gusta</h2>
                <p>{likedTracks.length} pistas guardadas</p>
              </div>
            </div>
            {likedTracks.length > 0 && (
              <button type="button" className="btn btn-primary" onClick={() => void playTrack(liked[0], liked)}>
                <PlayIcon size={16} /> Reproducir
              </button>
            )}
          </div>
          {likedTracks.length > 0 ? (
            <div className="track-list">
              {likedTracks.map((track, index) => (
                <TrackRow key={track.id} track={track} queue={liked} index={index} />
              ))}
            </div>
          ) : (
            <Empty
              icon={<HeartIcon size={22} />}
              title="Todavía no tienes favoritas"
              text="Toca el corazón en cualquier pista y aparecerá aquí."
              action={
                <button type="button" className="btn btn-primary" onClick={() => navigate({ name: "search" })}>
                  Descubrir música
                </button>
              }
            />
          )}
        </section>
      )}

      {tab === "downloads" && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-id">
              <span className="panel-icon">
                <DownloadIcon size={22} />
              </span>
              <div>
                <h2>Descargas</h2>
                <p>
                  {downloadTracks.length} {downloadTracks.length === 1 ? "pista" : "pistas"} · {formatBytes(bytes)}
                </p>
              </div>
            </div>
            {downloadTracks.length > 0 && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => void playTrack(downloadTracks[0].id, downloadTracks.map((track) => track.id))}
              >
                <PlayIcon size={16} /> Reproducir
              </button>
            )}
          </div>
          {downloadTracks.length > 0 ? (
            <>
              <div className="track-list">
                {downloadTracks.map((track, index) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    queue={downloadTracks.map((item) => item.id)}
                    index={index}
                  />
                ))}
              </div>
              <p className="hint">
                Estas pistas viven en el almacenamiento del navegador. Funcionan sin conexión, incluso si cierras la
                app.
              </p>
            </>
          ) : (
            <Empty
              icon={<DownloadIcon size={22} />}
              title="Sin descargas todavía"
              text="Busca una pista y toca la flecha para guardarla en este dispositivo."
              action={
                <button type="button" className="btn btn-primary" onClick={() => navigate({ name: "search" })}>
                  Buscar música
                </button>
              }
            />
          )}
        </section>
      )}

      {tab === "playlists" && (
        <section className="panel">
          <div className="panel-head">
            <div className="panel-id">
              <span className="panel-icon">
                <LibraryIcon size={22} />
              </span>
              <div>
                <h2>Listas</h2>
                <p>Crea colecciones para cada momento.</p>
              </div>
            </div>
          </div>

          <form className="create-form" onSubmit={submit}>
            <input
              value={name}
              maxLength={40}
              placeholder="Nombre de la nueva lista"
              aria-label="Nombre de la nueva lista"
              onChange={(event) => setName(event.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              <PlusIcon size={16} /> Crear lista
            </button>
          </form>

          {playlists.length > 0 ? (
            <div className="playlist-grid">
              {playlists.map((playlist, index) => (
                <div key={playlist.id} className="card playlist-card">
                  <button
                    type="button"
                    className="card-open"
                    aria-label={`Abrir la lista ${playlist.name}`}
                    onClick={() => navigate({ name: "playlist", id: playlist.id })}
                  />
                  <div className={`playlist-art tint-${index % 4}`}>
                    <MusicIcon size={26} />
                  </div>
                  <p className="card-title">{playlist.name}</p>
                  <p className="card-sub">
                    {playlist.trackIds.length} {playlist.trackIds.length === 1 ? "pista" : "pistas"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              icon={<LibraryIcon size={22} />}
              title="Crea tu primera lista"
              text="Ponle nombre arriba y empieza a añadir pistas desde el menú de cada canción."
            />
          )}
        </section>
      )}
    </div>
  );
};

const AlbumView = ({ id }: { id: string }) => {
  const album = albumById.get(id);
  const done = useStore((s) => (album ? album.trackIds.filter((trackId) => s.downloads[trackId] === "done").length : 0));

  if (!album) {
    return <NotFound text="Este álbum ya no está en el catálogo." />;
  }

  const tracks = tracksOfAlbum(album.id);
  const queue = tracks.map((track) => track.id);
  const allDone = tracks.length > 0 && done === tracks.length;

  return (
    <div className="view">
      <button type="button" className="back-link" onClick={() => navigate({ name: "home" })}>
        <BackIcon size={16} /> Inicio
      </button>

      <section
        className="detail-hero"
        style={{
          backgroundImage: `linear-gradient(115deg, ${album.from}3d, ${album.to}24 60%, #0a0c0f 100%)`,
        }}
      >
        <Cover album={album} size="lg" />
        <div className="detail-copy">
          <p className="eyebrow">Álbum</p>
          <h1>{album.title}</h1>
          <p className="detail-meta">
            {album.artist} · {album.year} · {album.genre} · {tracks.length} pistas
          </p>
          <div className="detail-actions">
            <button type="button" className="btn btn-primary" onClick={() => playAlbum(album)} disabled={!tracks.length}>
              <PlayIcon size={16} /> Reproducir
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              disabled={allDone}
              onClick={() => void downloadAlbum(album.id)}
            >
              {allDone ? <CheckIcon size={16} /> : <DownloadIcon size={16} />}
              {allDone ? "Descargado" : "Descargar álbum"}
            </button>
          </div>
        </div>
      </section>

      <div className="track-list">
        {tracks.map((track, index) => (
          <TrackRow key={track.id} track={track} queue={queue} index={index} showAlbum={false} />
        ))}
      </div>
    </div>
  );
};

const PlaylistView = ({ id }: { id: string }) => {
  const playlist = useStore((s) => s.playlists.find((item) => item.id === id));
  const [name, setName] = useState(playlist?.name ?? "");

  useEffect(() => {
    setName(playlist?.name ?? "");
  }, [playlist?.name, id]);

  if (!playlist) {
    return <NotFound text="Esta lista ya no existe." />;
  }

  const tracks = playlist.trackIds
    .map((trackId) => trackById.get(trackId))
    .filter((track): track is Track => Boolean(track));
  const queue = tracks.map((track) => track.id);
  const totalMin = Math.max(1, Math.round(tracks.reduce((sum, track) => sum + track.duration, 0) / 60));
  const canSave = name.trim().length > 0 && name.trim() !== playlist.name;

  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    renamePlaylist(playlist.id, name);
  };

  const remove = () => {
    if (window.confirm(`¿Eliminar la lista "${playlist.name}"?`)) deletePlaylist(playlist.id);
  };

  return (
    <div className="view">
      <button type="button" className="back-link" onClick={() => openLibrary("playlists")}>
        <BackIcon size={16} /> Listas
      </button>

      <section className="detail-hero detail-hero-playlist">
        <div className="playlist-art playlist-art-lg">
          <MusicIcon size={44} />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">Lista</p>
          <form className="rename-form" onSubmit={save}>
            <input
              value={name}
              maxLength={40}
              aria-label="Nombre de la lista"
              onChange={(event) => setName(event.target.value)}
            />
            {canSave && (
              <button type="submit" className="btn btn-ghost btn-sm">
                <CheckIcon size={15} /> Guardar
              </button>
            )}
          </form>
          <p className="detail-meta">
            {tracks.length} {tracks.length === 1 ? "pista" : "pistas"} · {totalMin} min
          </p>
          <div className="detail-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!tracks.length}
              onClick={() => void playTrack(tracks[0].id, queue)}
            >
              <PlayIcon size={16} /> Reproducir
            </button>
            <button type="button" className="btn btn-ghost btn-danger" onClick={remove}>
              <TrashIcon size={16} /> Eliminar lista
            </button>
          </div>
        </div>
      </section>

      {tracks.length > 0 ? (
        <div className="track-list">
          {tracks.map((track, index) => (
            <TrackRow key={track.id} track={track} queue={queue} index={index} playlistId={playlist.id} />
          ))}
        </div>
      ) : (
        <Empty
          icon={<MusicIcon size={22} />}
          title="Esta lista está vacía"
          text="Añade pistas desde el menú de tres puntos de cualquier canción."
          action={
            <button type="button" className="btn btn-primary" onClick={() => navigate({ name: "search" })}>
              Buscar música
            </button>
          }
        />
      )}
    </div>
  );
};

const NotFound = ({ text }: { text: string }) => (
  <div className="view">
    <Empty
      icon={<SearchIcon size={22} />}
      title="No encontramos esto"
      text={text}
      action={
        <button type="button" className="btn btn-primary" onClick={() => navigate({ name: "home" })}>
          Volver al inicio
        </button>
      }
    />
  </div>
);

const Empty = ({
  icon,
  title,
  text,
  action,
}: {
  icon: ReactNode;
  title: string;
  text: string;
  action?: ReactNode;
}) => (
  <div className="empty">
    <span className="empty-icon">{icon}</span>
    <h3>{title}</h3>
    <p>{text}</p>
    {action}
  </div>
);
