import { TRACKS, trackById } from "../data/catalog";
import { getDownload } from "./db";
import { getState, setState, toast } from "./store";

const audio = new Audio();
audio.preload = "metadata";
audio.volume = getState().volume;

const objectUrls = new Map<string, string>();

const revoke = (id: string): void => {
  const url = objectUrls.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    objectUrls.delete(id);
  }
};

const sourceFor = async (id: string): Promise<string> => {
  const stored = await getDownload(id);
  if (stored) {
    const existing = objectUrls.get(id);
    if (existing) return existing;
    const url = URL.createObjectURL(stored.blob);
    objectUrls.set(id, url);
    return url;
  }
  return trackById.get(id)?.src ?? "";
};

let loadToken = 0;

export const playTrack = async (id: string, queue?: string[]): Promise<void> => {
  const track = trackById.get(id);
  if (!track) return;
  const current = getState();
  const nextQueue = queue ?? (current.queue.includes(id) ? current.queue : [id]);
  setState({ queue: nextQueue, currentId: id, progress: 0, duration: track.duration });
  const token = ++loadToken;
  try {
    const src = await sourceFor(id);
    if (token !== loadToken) return;
    if (!src) throw new Error("sin fuente");
    const absolute = new URL(src, location.href).href;
    if (audio.src !== absolute) audio.src = absolute;
    audio.currentTime = 0;
    await audio.play();
    updateMediaSession(id);
  } catch {
    if (token !== loadToken) return;
    setState({ playing: false });
    const offline = !navigator.onLine;
    toast(
      offline
        ? `"${track.title}" no está descargada y no hay conexión`
        : `No se pudo reproducir "${track.title}"`,
      "error",
    );
  }
};

export const togglePlay = (): void => {
  const { currentId } = getState();
  if (!currentId) {
    void playTrack(TRACKS[0].id, TRACKS.map((t) => t.id));
    return;
  }
  if (audio.paused) {
    void audio.play().catch(() => toast("No se pudo reanudar la reproducción", "error"));
  } else {
    audio.pause();
  }
};

export const next = (auto = false): void => {
  const { queue, currentId, repeat, shuffle } = getState();
  if (!queue.length) return;
  if (auto && repeat === "one") {
    audio.currentTime = 0;
    void audio.play();
    return;
  }
  const index = currentId ? queue.indexOf(currentId) : -1;
  let target: string | undefined;
  if (shuffle && queue.length > 1) {
    const pool = queue.filter((id) => id !== currentId);
    target = pool[Math.floor(Math.random() * pool.length)];
  } else if (index + 1 < queue.length) {
    target = queue[index + 1];
  } else if (repeat === "all") {
    target = queue[0];
  }
  if (!target) {
    audio.pause();
    setState({ playing: false, progress: 0 });
    return;
  }
  void playTrack(target, queue);
};

export const previous = (): void => {
  const { queue, currentId } = getState();
  if (audio.currentTime > 3 || !currentId) {
    audio.currentTime = 0;
    setState({ progress: 0 });
    return;
  }
  const index = queue.indexOf(currentId);
  const target = index > 0 ? queue[index - 1] : queue[queue.length - 1];
  if (target) void playTrack(target, queue);
};

export const seek = (seconds: number): void => {
  if (!Number.isFinite(audio.duration)) return;
  const value = Math.min(audio.duration, Math.max(0, seconds));
  audio.currentTime = value;
  setState({ progress: value });
};

export const setVolume = (value: number): void => {
  const volume = Math.min(1, Math.max(0, value));
  audio.volume = volume;
  audio.muted = volume === 0;
  setState({ volume, muted: volume === 0 });
};

export const toggleMute = (): void => {
  const muted = !getState().muted;
  audio.muted = muted;
  setState({ muted });
};

export const toggleShuffle = (): void => {
  setState((s) => ({ shuffle: !s.shuffle }));
};

export const cycleRepeat = (): void => {
  setState((s) => ({ repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off" }));
};

export const forgetDownload = (id: string): void => {
  // No revocar el blob de la pista en reproduccion: romperia el seek actual.
  if (getState().currentId === id) return;
  revoke(id);
};

const updateMediaSession = (id: string): void => {
  if (!("mediaSession" in navigator)) return;
  const track = trackById.get(id);
  if (!track) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.albumTitle,
    artwork: [{ src: "/icon.svg", sizes: "512x512", type: "image/svg+xml" }],
  });
};

if ("mediaSession" in navigator) {
  navigator.mediaSession.setActionHandler("play", () => togglePlay());
  navigator.mediaSession.setActionHandler("pause", () => togglePlay());
  navigator.mediaSession.setActionHandler("nexttrack", () => next());
  navigator.mediaSession.setActionHandler("previoustrack", () => previous());
  navigator.mediaSession.setActionHandler("seekto", (event) => {
    if (typeof event.seekTime === "number") seek(event.seekTime);
  });
}

audio.addEventListener("timeupdate", () => {
  setState({ progress: audio.currentTime });
});

audio.addEventListener("durationchange", () => {
  if (Number.isFinite(audio.duration) && audio.duration > 0) setState({ duration: audio.duration });
});

audio.addEventListener("play", () => setState({ playing: true }));
audio.addEventListener("pause", () => setState({ playing: false }));
audio.addEventListener("ended", () => next(true));
audio.addEventListener("error", () => {
  if (!getState().currentId) return;
  setState({ playing: false });
  toast("No se pudo cargar el audio", "error");
});

export const audioElement = audio;
