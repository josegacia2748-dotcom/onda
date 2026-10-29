import { useSyncExternalStore } from "react";
import { listDownloads } from "./db";
import type { Album, Track } from "../data/catalog";
import { ALBUMS } from "../data/catalog";

export type Route =
  | { name: "home" }
  | { name: "search" }
  | { name: "library" }
  | { name: "album"; id: string }
  | { name: "playlist"; id: string };

export type Theme = { accent: string; amoled: boolean; radius: number; motion: boolean };
export type Playlist = { id: string; name: string; trackIds: string[] };
export type DownloadState = "pending" | "done" | "error";

export type State = {
  route: Route;
  online: boolean;
  currentId: string | null;
  playing: boolean;
  progress: number;
  duration: number;
  volume: number;
  muted: boolean;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  queue: string[];
  liked: string[];
  downloads: Record<string, DownloadState>;
  playlists: Playlist[];
  theme: Theme;
  themeOpen: boolean;
  search: string;
  libraryTab: "liked" | "downloads" | "playlists";
  toast: { id: number; text: string; kind: "info" | "error" } | null;
};

export const ACCENTS = [
  { name: "Spotify", value: "#1db954" },
  { name: "Jade", value: "#00c9a7" },
  { name: "Lima", value: "#a3e635" },
  { name: "Menta", value: "#5eead4" },
  { name: "Violeta", value: "#a78bfa" },
  { name: "Ámbar", value: "#f5b942" },
  { name: "Coral", value: "#ff7a7a" },
  { name: "Cian", value: "#22d3ee" },
] as const;

export const DEFAULT_THEME: Theme = { accent: "#1db954", amoled: false, radius: 14, motion: true };

const PERSIST_KEY = "onda:v1";

type Persisted = Pick<State, "liked" | "playlists" | "theme" | "volume" | "shuffle" | "repeat">;

const readPersisted = (): Partial<Persisted> => {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return {
      liked: Array.isArray(parsed.liked) ? parsed.liked.filter((id): id is string => typeof id === "string") : undefined,
      playlists: Array.isArray(parsed.playlists)
        ? parsed.playlists
            .filter((p): p is Playlist => Boolean(p) && typeof p.id === "string" && typeof p.name === "string")
            .map((p) => ({ id: p.id, name: p.name, trackIds: Array.isArray(p.trackIds) ? p.trackIds : [] }))
        : undefined,
      theme: parsed.theme && typeof parsed.theme.accent === "string" ? { ...DEFAULT_THEME, ...parsed.theme } : undefined,
      volume: typeof parsed.volume === "number" ? Math.min(1, Math.max(0, parsed.volume)) : undefined,
      shuffle: typeof parsed.shuffle === "boolean" ? parsed.shuffle : undefined,
      repeat: parsed.repeat === "all" || parsed.repeat === "one" || parsed.repeat === "off" ? parsed.repeat : undefined,
    };
  } catch {
    return {};
  }
};

const persisted = readPersisted();

let state: State = {
  route: { name: "home" },
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  currentId: null,
  playing: false,
  progress: 0,
  duration: 0,
  volume: persisted.volume ?? 0.8,
  muted: false,
  shuffle: persisted.shuffle ?? false,
  repeat: persisted.repeat ?? "off",
  queue: [],
  liked: persisted.liked ?? [],
  downloads: {},
  playlists: persisted.playlists ?? [{ id: "favoritas", name: "Mis favoritas", trackIds: [] }],
  theme: persisted.theme ?? DEFAULT_THEME,
  themeOpen: false,
  search: "",
  libraryTab: "liked",
  toast: null,
};

const listeners = new Set<() => void>();

export const getState = (): State => state;

export const setState = (patch: Partial<State> | ((current: State) => Partial<State>)): void => {
  const next = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...next };
  schedulePersist();
  listeners.forEach((listener) => listener());
};

export const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const useStore = <T,>(selector: (current: State) => T): T =>
  useSyncExternalStore(subscribe, () => selector(state));

let persistTimer: ReturnType<typeof setTimeout> | null = null;
const schedulePersist = (): void => {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    const snapshot: Persisted = {
      liked: state.liked,
      playlists: state.playlists,
      theme: state.theme,
      volume: state.volume,
      shuffle: state.shuffle,
      repeat: state.repeat,
    };
    try {
      localStorage.setItem(PERSIST_KEY, JSON.stringify(snapshot));
    } catch {
      // Sin almacenamiento: la sesion sigue funcionando en memoria.
    }
  }, 300);
};

let toastSeq = 0;
export const toast = (text: string, kind: "info" | "error" = "info"): void => {
  const id = ++toastSeq;
  setState({ toast: { id, text, kind } });
  setTimeout(() => {
    if (state.toast?.id === id) setState({ toast: null });
  }, 3200);
};

export const hydrateDownloads = async (): Promise<void> => {
  try {
    const stored = await listDownloads();
    if (!stored.length) return;
    setState((current) => {
      const downloads = { ...current.downloads };
      for (const item of stored) downloads[item.id] = "done";
      return { downloads };
    });
  } catch {
    // IndexedDB puede estar bloqueada en modo privado.
  }
};

export const albumOfTrack = (track: Track): Album | undefined => ALBUMS.find((a) => a.id === track.albumId);
