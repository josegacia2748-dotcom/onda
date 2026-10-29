# Onda

Streaming de música ligero, tipo Spotify, con **descargas sin conexión** y **tema de colores personalizable**. Construido como PWA con React + TypeScript + Vite, sin frameworks de UI, sin router y sin librerías de estado.

## Lo que incluye

- **Interfaz fluida**: navegación instantánea, reproductor persistente, cola, búsqueda, biblioteca, álbumes y listas.
- **Descargas offline reales**: cada pista se guarda como `Blob` en IndexedDB. Al reproducirla se crea un `blob:` URL, así que funciona sin red.
- **PWA instalable**: manifest + service worker con precache del shell. Se puede instalar como app de escritorio o móvil.
- **Tema personalizable**: 8 acentos tipo Spotify (verde Spotify por defecto), color libre, modo negro puro (OLED), redondeo de bordes y animaciones on/off. Todo se aplica con variables CSS y se persiste.
- **Persistencia local**: me gusta, listas, tema, volumen, aleatorio y repetición en `localStorage`.
- **Media Session**: controles del sistema (teclas multimedia, pantalla de bloqueo).
- **Atajos**: `Espacio` reproduce/pausa cuando no estás escribiendo.

## Stack

| Pieza | Elección |
| --- | --- |
| UI | React 19 + TypeScript |
| Build | Vite 8 |
| Estado | store propio con `useSyncExternalStore` |
| Offline | IndexedDB + service worker |
| Audio | `<audio>` único + Web Media Session |

Sin Tailwind, sin Redux, sin React Router: el bundle se mantiene pequeño y el arranque es inmediato.

## Empezar

```bash
npm install
npm run audio     # genera el catálogo de audio demo en public/audio
npm run dev
```

Abre `http://localhost:5173`.

### Producción

```bash
npm run build
npm run preview
```

El build incluye el service worker y el manifest. Para probar la instalación y el modo offline, usa `preview` o sirve `dist/` por HTTPS (o `localhost`).

> Si publicas una versión nueva, sube `VERSION` en `public/sw.js` para invalidar el precache.

### Pruebas

Con `npm run preview` en marcha (por defecto en `http://localhost:4173`):

```bash
npm run smoke
```

Lanza Edge headless vía CDP y comprueba 20 puntos: render, tema y persistencia, reproducción, menú contextual, descarga en IndexedDB, service worker, recarga y reproducción sin conexión, layout móvil y barra de progreso táctil. Las capturas quedan en `.preview/`.

## Descargas sin conexión

1. Toca la flecha de una pista (o "Descargar álbum").
2. Se hace `fetch` del WAV y se guarda en IndexedDB (`onda-db` → `downloads`).
3. El reproductor detecta la descarga y usa un `blob:` URL en lugar de la red.
4. En **Biblioteca → Descargas** puedes ver el espacio usado y eliminar pistas.

El service worker **no** cachea `/audio/` para no duplicar almacenamiento: el audio offline vive solo en IndexedDB. El shell (HTML, JS, CSS, iconos) sí queda precacheado.

## Tema

El panel de personalización (icono de paleta, barra lateral o pestaña "Tema" en móvil) permite:

- Acento entre 8 presets o color libre.
- Fondo negro puro para pantallas OLED.
- Radio de bordes de 0 a 24 px.
- Activar/desactivar animaciones (también respeta `prefers-reduced-motion`).

Los cambios se aplican al instante sobre `--accent`, `--radius` y `data-amoled` / `data-motion`.

## Catálogo demo

4 álbumes, 8 pistas, audio **original sintetizado localmente** por `scripts/generate-audio.mjs` (sin samples ni material de terceros). Cada pista dura 48 s y se genera de forma determinista (misma semilla, mismo resultado).

| Álbum | Artista | Género |
| --- | --- | --- |
| Neón Tardío | Lía Marea | Synthwave |
| Café y Lluvia | Nube Baja | Lo-fi |
| Órbita | Kova | Ambient |
| Casa Abierta | Trío Sombra | House |

## Estructura

```
src/
  App.tsx              layout, topbar, navegación móvil, toasts
  main.tsx             arranque, hidratación de descargas, registro del SW
  styles.css           tokens, componentes y responsive
  data/catalog.ts      álbumes, pistas, búsqueda
  lib/
    store.ts           estado global + persistencia
    actions.ts         navegación, likes, descargas, listas, tema
    player.ts          audio, cola, Media Session
    db.ts              IndexedDB
    format.ts          tiempo, bytes, contraste, saludo
  components/
    Sidebar.tsx  Player.tsx  TrackRow.tsx
    ThemePanel.tsx  Views.tsx  Cover.tsx  Icons.tsx
public/
  sw.js  manifest.webmanifest  icon.svg  icon-maskable.svg
  audio/               WAVs generados (no versionados)
scripts/
  generate-audio.mjs   sintetizador WAV determinista
```

## Límites conocidos

- El catálogo es demo y el audio es sintético; no hay backend ni cuentas.
- El espacio de descargas depende del navegador; en modo privado IndexedDB puede estar bloqueado.
- Los SVG del manifest funcionan en Chromium; para máxima compatibilidad con Safari antiguo conviene añadir PNG 192/512.
