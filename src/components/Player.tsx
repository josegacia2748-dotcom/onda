import { trackById } from "../data/catalog";
import { downloadTrack, navigate, removeDownload, toggleLike, toggleThemePanel } from "../lib/actions";
import { formatTime } from "../lib/format";
import {
  cycleRepeat,
  next,
  previous,
  seek,
  setVolume,
  toggleMute,
  togglePlay,
  toggleShuffle,
} from "../lib/player";
import { albumOfTrack, useStore } from "../lib/store";
import { Cover } from "./Cover";
import {
  CheckIcon,
  DownloadIcon,
  HeartIcon,
  NextIcon,
  PaletteIcon,
  PauseIcon,
  PlayIcon,
  PrevIcon,
  RepeatIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeIcon,
  VolumeMuteIcon,
} from "./Icons";

export const Player = () => {
  const currentId = useStore((s) => s.currentId);
  const playing = useStore((s) => s.playing);
  const progress = useStore((s) => s.progress);
  const duration = useStore((s) => s.duration);
  const volume = useStore((s) => s.volume);
  const muted = useStore((s) => s.muted);
  const shuffle = useStore((s) => s.shuffle);
  const repeat = useStore((s) => s.repeat);
  const liked = useStore((s) => (currentId ? s.liked.includes(currentId) : false));
  const download = useStore((s) => (currentId ? s.downloads[currentId] : undefined));

  const track = currentId ? trackById.get(currentId) : undefined;
  const album = track ? albumOfTrack(track) : undefined;
  const max = duration > 0 ? duration : track?.duration ?? 0;
  const position = Math.min(progress, max || progress);
  const pct = max > 0 ? (position / max) * 100 : 0;
  const volumePct = muted ? 0 : volume * 100;

  return (
    <footer className="player" aria-label="Reproductor">
      <div className="player-track">
        {track && album ? (
          <>
            <button
              type="button"
              className="player-art"
              aria-label={`Ir al álbum ${album.title}`}
              onClick={() => navigate({ name: "album", id: album.id })}
            >
              <Cover album={album} size="md" />
            </button>
            <div className="player-meta">
              <button
                type="button"
                className="player-title"
                onClick={() => navigate({ name: "album", id: album.id })}
              >
                {track.title}
              </button>
              <p className="player-artist">{track.artist}</p>
            </div>
            <div className="player-like">
              <button
                type="button"
                className={`icon-btn${liked ? " is-on" : ""}`}
                aria-label={liked ? "Quitar de me gusta" : "Añadir a me gusta"}
                aria-pressed={liked}
                onClick={() => toggleLike(track.id)}
              >
                <HeartIcon size={17} filled={liked} />
              </button>
              <button
                type="button"
                className={`icon-btn${download === "done" ? " is-on" : ""}`}
                aria-label={download === "done" ? "Eliminar descarga" : "Descargar pista"}
                onClick={() => {
                  if (download === "done") void removeDownload(track.id);
                  else void downloadTrack(track.id);
                }}
              >
                {download === "done" ? <CheckIcon size={17} /> : <DownloadIcon size={17} />}
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="player-art player-art-empty" aria-hidden="true">
              <span className="brand-mark">
                <i />
                <i />
                <i />
                <i />
              </span>
            </span>
            <div className="player-meta">
              <p className="player-title is-empty">Nada sonando</p>
              <p className="player-artist">Elige una canción para empezar</p>
            </div>
          </>
        )}
      </div>

      <div className="player-center">
        <div className="player-controls">
          <button
            type="button"
            className={`icon-btn control${shuffle ? " is-on" : ""}`}
            aria-label="Aleatorio"
            aria-pressed={shuffle}
            onClick={toggleShuffle}
          >
            <ShuffleIcon size={18} />
          </button>
          <button type="button" className="icon-btn control" aria-label="Anterior" onClick={previous}>
            <PrevIcon size={20} />
          </button>
          <button
            type="button"
            className="play-btn"
            aria-label={playing ? "Pausar" : "Reproducir"}
            onClick={togglePlay}
          >
            {playing ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
          </button>
          <button type="button" className="icon-btn control" aria-label="Siguiente" onClick={() => next()}>
            <NextIcon size={20} />
          </button>
          <button
            type="button"
            className={`icon-btn control${repeat !== "off" ? " is-on" : ""}`}
            aria-label={
              repeat === "off" ? "Activar repetición" : repeat === "all" ? "Repetir una canción" : "Desactivar repetición"
            }
            aria-pressed={repeat !== "off"}
            onClick={cycleRepeat}
          >
            {repeat === "one" ? <RepeatOneIcon size={18} /> : <RepeatIcon size={18} />}
          </button>
        </div>

        <div className="player-progress">
          <span>{formatTime(position)}</span>
          <input
            type="range"
            className="range"
            min={0}
            max={max || 0}
            step={0.1}
            value={position}
            aria-label="Posición de la canción"
            style={{ background: `linear-gradient(to right, var(--accent) ${pct}%, rgba(255,255,255,.14) ${pct}%)` }}
            onChange={(event) => seek(Number(event.target.value))}
            disabled={!track}
          />
          <span>{formatTime(max)}</span>
        </div>
      </div>

      <div className="player-right">
        <button
          type="button"
          className="icon-btn"
          aria-label={muted ? "Activar sonido" : "Silenciar"}
          onClick={toggleMute}
        >
          {muted || volume === 0 ? <VolumeMuteIcon size={18} /> : <VolumeIcon size={18} />}
        </button>
        <input
          type="range"
          className="range range-volume"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          aria-label="Volumen"
          style={{ background: `linear-gradient(to right, var(--accent) ${volumePct}%, rgba(255,255,255,.14) ${volumePct}%)` }}
          onChange={(event) => setVolume(Number(event.target.value))}
        />
        <button
          type="button"
          className="icon-btn"
          aria-label="Personalizar tema"
          title="Personalizar tema"
          onClick={toggleThemePanel}
        >
          <PaletteIcon size={18} />
        </button>
      </div>
    </footer>
  );
};
