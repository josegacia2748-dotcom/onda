import { ALBUMS, TRACKS, trackById, tracksOfAlbum } from "../data/catalog";
import { deleteDownload, putDownload } from "./db";
import { forgetDownload } from "./player";
import { getState, setState, toast, type Playlist, type Route, type Theme } from "./store";

export const navigate = (route: Route): void => {
  setState({ route });
};

export const setSearch = (search: string): void => setState({ search });
export const setLibraryTab = (libraryTab: "liked" | "downloads" | "playlists"): void => setState({ libraryTab });
export const setOnline = (online: boolean): void => setState({ online });
export const toggleThemePanel = (): void => setState((s) => ({ themeOpen: !s.themeOpen }));
export const closeThemePanel = (): void => setState({ themeOpen: false });

export const toggleLike = (id: string): void => {
  const track = trackById.get(id);
  if (!track) return;
  const liked = getState().liked.includes(id);
  setState((s) => ({
    liked: liked ? s.liked.filter((item) => item !== id) : [...s.liked, id],
  }));
  toast(liked ? `"${track.title}" fuera de tus me gusta` : `"${track.title}" añadida a tus me gusta`);
};

export const downloadTrack = async (id: string): Promise<void> => {
  const track = trackById.get(id);
  if (!track) return;
  const current = getState();
  if (current.downloads[id] === "done" || current.downloads[id] === "pending") return;
  if (!navigator.onLine) {
    toast("Necesitas conexión para descargar esta pista", "error");
    return;
  }
  setState((s) => ({ downloads: { ...s.downloads, [id]: "pending" } }));
  try {
    const response = await fetch(track.src);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    await putDownload({
      id: track.id,
      blob,
      title: track.title,
      artist: track.artist,
      album: track.albumTitle,
      savedAt: Date.now(),
    });
    setState((s) => ({ downloads: { ...s.downloads, [id]: "done" } }));
    toast(`"${track.title}" disponible sin conexión`);
  } catch {
    setState((s) => ({ downloads: { ...s.downloads, [id]: "error" } }));
    toast(`No se pudo descargar "${track.title}"`, "error");
  }
};

export const downloadAlbum = async (albumId: string): Promise<void> => {
  const tracks = tracksOfAlbum(albumId);
  await Promise.all(tracks.map((track) => downloadTrack(track.id)));
};

export const removeDownload = async (id: string): Promise<void> => {
  const track = trackById.get(id);
  try {
    await deleteDownload(id);
    forgetDownload(id);
    setState((s) => {
      const downloads = { ...s.downloads };
      delete downloads[id];
      return { downloads };
    });
    toast(`Descarga eliminada${track ? `: "${track.title}"` : ""}`);
  } catch {
    toast("No se pudo eliminar la descarga", "error");
  }
};

export const createPlaylist = (name: string): Playlist | null => {
  const trimmed = name.trim();
  if (!trimmed) {
    toast("Ponle un nombre a la lista", "error");
    return null;
  }
  const playlist: Playlist = { id: `pl-${Date.now().toString(36)}`, name: trimmed, trackIds: [] };
  setState((s) => ({ playlists: [...s.playlists, playlist] }));
  toast(`Lista "${trimmed}" creada`);
  return playlist;
};

export const renamePlaylist = (id: string, name: string): void => {
  const trimmed = name.trim();
  if (!trimmed) return;
  setState((s) => ({ playlists: s.playlists.map((p) => (p.id === id ? { ...p, name: trimmed } : p)) }));
};

export const deletePlaylist = (id: string): void => {
  const playlist = getState().playlists.find((p) => p.id === id);
  setState((s) => ({ playlists: s.playlists.filter((p) => p.id !== id) }));
  if (getState().route.name === "playlist") navigate({ name: "library" });
  toast(playlist ? `Lista "${playlist.name}" eliminada` : "Lista eliminada");
};

export const addToPlaylist = (playlistId: string, trackId: string): void => {
  const state = getState();
  const playlist = state.playlists.find((p) => p.id === playlistId);
  const track = trackById.get(trackId);
  if (!playlist || !track) return;
  if (playlist.trackIds.includes(trackId)) {
    toast(`"${track.title}" ya está en "${playlist.name}"`);
    return;
  }
  setState((s) => ({
    playlists: s.playlists.map((p) => (p.id === playlistId ? { ...p, trackIds: [...p.trackIds, trackId] } : p)),
  }));
  toast(`"${track.title}" añadida a "${playlist.name}"`);
};

export const removeFromPlaylist = (playlistId: string, trackId: string): void => {
  setState((s) => ({
    playlists: s.playlists.map((p) =>
      p.id === playlistId ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId) } : p,
    ),
  }));
};

export const setTheme = (patch: Partial<Theme>): void => {
  setState((s) => ({ theme: { ...s.theme, ...patch } }));
};

export const resetTheme = (): void => {
  setState({ theme: { accent: "#1db954", amoled: false, radius: 14, motion: true } });
};

export const albumTracks = (albumId: string) => tracksOfAlbum(albumId);
export const allTracks = () => TRACKS;
export const albums = () => ALBUMS;
