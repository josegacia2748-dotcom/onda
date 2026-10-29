export type Track = {
  id: string;
  title: string;
  artist: string;
  albumId: string;
  albumTitle: string;
  genre: string;
  duration: number;
  src: string;
};

export type Album = {
  id: string;
  title: string;
  artist: string;
  year: number;
  genre: string;
  trackIds: string[];
  from: string;
  to: string;
};

export const ALBUMS: Album[] = [
  {
    id: "neon-tardio",
    title: "Neón Tardío",
    artist: "Lía Marea",
    year: 2026,
    genre: "Synthwave",
    trackIds: ["avenida-4am", "faro-roto"],
    from: "#ff5d8f",
    to: "#6c3bff",
  },
  {
    id: "cafe-lluvia",
    title: "Café y Lluvia",
    artist: "Nube Baja",
    year: 2025,
    genre: "Lo-fi",
    trackIds: ["ventana-empanada", "te-frio"],
    from: "#e0a86a",
    to: "#6b4a3a",
  },
  {
    id: "orbita",
    title: "Órbita",
    artist: "Kova",
    year: 2026,
    genre: "Ambient",
    trackIds: ["peso-cero", "reentrada"],
    from: "#38bdf8",
    to: "#1e1b4b",
  },
  {
    id: "casa-abierta",
    title: "Casa Abierta",
    artist: "Trío Sombra",
    year: 2024,
    genre: "House",
    trackIds: ["persianas", "madrugada"],
    from: "#34d399",
    to: "#0f766e",
  },
];

const META: Array<Omit<Track, "albumTitle" | "src">> = [
  { id: "avenida-4am", title: "Avenida 4AM", artist: "Lía Marea", albumId: "neon-tardio", genre: "Synthwave", duration: 48 },
  { id: "faro-roto", title: "Faro Roto", artist: "Lía Marea", albumId: "neon-tardio", genre: "Synthwave", duration: 48 },
  { id: "ventana-empanada", title: "Ventana Empañada", artist: "Nube Baja", albumId: "cafe-lluvia", genre: "Lo-fi", duration: 48 },
  { id: "te-frio", title: "Té Frío", artist: "Nube Baja", albumId: "cafe-lluvia", genre: "Lo-fi", duration: 48 },
  { id: "peso-cero", title: "Peso Cero", artist: "Kova", albumId: "orbita", genre: "Ambient", duration: 48 },
  { id: "reentrada", title: "Reentrada", artist: "Kova", albumId: "orbita", genre: "Ambient", duration: 48 },
  { id: "persianas", title: "Persianas", artist: "Trío Sombra", albumId: "casa-abierta", genre: "House", duration: 48 },
  { id: "madrugada", title: "Madrugada", artist: "Trío Sombra", albumId: "casa-abierta", genre: "House", duration: 48 },
];

export const TRACKS: Track[] = META.map((t) => {
  const album = ALBUMS.find((a) => a.id === t.albumId);
  return { ...t, albumTitle: album?.title ?? "", src: `/audio/${t.id}.wav` };
});

export const trackById = new Map(TRACKS.map((t) => [t.id, t]));
export const albumById = new Map(ALBUMS.map((a) => [a.id, a]));

export const tracksOfAlbum = (albumId: string): Track[] => {
  const album = albumById.get(albumId);
  if (!album) return [];
  return album.trackIds.map((id) => trackById.get(id)).filter((t): t is Track => Boolean(t));
};

export const GENRES = Array.from(new Set(ALBUMS.map((a) => a.genre)));

export const featured = ALBUMS[0];

export type SearchResults = { albums: Album[]; tracks: Track[] };

export const searchCatalog = (query: string): SearchResults => {
  const q = query.trim().toLowerCase();
  if (!q) return { albums: [], tracks: [] };
  const matches = (value: string) => value.toLowerCase().includes(q);
  return {
    albums: ALBUMS.filter((a) => matches(a.title) || matches(a.artist) || matches(a.genre)),
    tracks: TRACKS.filter((t) => matches(t.title) || matches(t.artist) || matches(t.albumTitle) || matches(t.genre)),
  };
};
