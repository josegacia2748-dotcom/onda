// Smoke test de Onda con Edge headless + CDP. No usa dependencias externas.
// Uso: node scripts/smoke.mjs [url]
import { spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const URL = process.argv[2] ?? "http://localhost:4173/";
const EDGE_CANDIDATES = [
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const edge = EDGE_CANDIDATES.find((path) => existsSync(path));
if (!edge) throw new Error("No se encontro Edge");

const port = 9333;
const profile = mkdtempSync(join(tmpdir(), "onda-cdp-"));
const outDir = join(process.cwd(), ".preview");
mkdirSync(outDir, { recursive: true });

const proc = spawn(
  edge,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    "--no-first-run",
    "--no-default-browser-check",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,900",
    "about:blank",
  ],
  { stdio: "ignore" },
);

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const results = [];
const errors = [];
let ws;
let seq = 0;
const pending = new Map();

const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++seq;
    pending.set(id, { resolve, reject });
    ws.send(JSON.stringify({ id, method, params }));
  });

const evalJs = async (expression) => {
  const reply = await send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
    userGesture: true,
  });
  if (reply.exceptionDetails) {
    throw new Error(`Eval fallo: ${reply.exceptionDetails.text} ${reply.exceptionDetails.exception?.description ?? ""}`);
  }
  return reply.result.value;
};

const click = async (selector, index = 0) => {
  const point = await evalJs(`(() => {
    const main = document.querySelector('.main-scroll');
    if (main) main.style.scrollBehavior = 'auto';
    const el = document.querySelectorAll(${JSON.stringify(selector)})[${index}];
    if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!point) throw new Error(`No existe ${selector}[${index}]`);
  await dispatchClick(point);
};

const dispatchClick = async (point) => {
  await send("Input.dispatchMouseEvent", { type: "mouseMoved", x: point.x, y: point.y });
  await send("Input.dispatchMouseEvent", { type: "mousePressed", x: point.x, y: point.y, button: "left", clickCount: 1 });
  await send("Input.dispatchMouseEvent", { type: "mouseReleased", x: point.x, y: point.y, button: "left", clickCount: 1 });
};

// Clic sobre un elemento ya visible (no hace scroll: cerraria el menu fijo).
const clickVisible = async (expression) => {
  const point = await evalJs(`(() => {
    const el = ${expression};
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  })()`);
  if (!point) throw new Error(`No se encontro el elemento: ${expression}`);
  await dispatchClick(point);
};

const clickRange = async (selector, ratio) => {
  const rect = await evalJs(`(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  })()`);
  if (!rect) throw new Error(`No existe ${selector}`);
  await dispatchClick({ x: rect.x + rect.w * ratio, y: rect.y + rect.h / 2 });
};

const shot = async (name) => {
  const data = await send("Page.captureScreenshot", { format: "png" });
  writeFileSync(join(outDir, name), Buffer.from(data.data, "base64"));
};

const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
};

try {
  let target = null;
  for (let attempt = 0; attempt < 60 && !target; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const list = await response.json();
      target = list.find((item) => item.type === "page");
    } catch {
      await wait(200);
    }
  }
  if (!target) throw new Error("CDP no respondio");

  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error)));
      else resolve(message.result);
      return;
    }
    if (message.method === "Runtime.exceptionThrown") {
      const details = message.params.exceptionDetails;
      errors.push(details.exception?.description ?? details.text);
    }
    if (message.method === "Log.entryAdded" && message.params.entry.level === "error") {
      errors.push(message.params.entry.text);
    }
    if (message.method === "Runtime.consoleAPICalled" && message.params.type === "error") {
      errors.push(message.params.args.map((arg) => arg.value ?? arg.description ?? "").join(" "));
    }
  };

  await send("Page.enable");
  await send("Runtime.enable");
  await send("Log.enable");
  await send("Network.enable");
  await send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 1,
    mobile: false,
  });

  await send("Page.navigate", { url: URL });
  await wait(1800);

  const home = await evalJs(`({
    title: document.title,
    heading: document.querySelector('.view-head h1')?.textContent ?? null,
    tracks: document.querySelectorAll('.track-row').length,
    albums: document.querySelectorAll('.album-card').length,
    hero: document.querySelector('.hero h2')?.textContent ?? null,
    player: Boolean(document.querySelector('.player')),
    sidebar: Boolean(document.querySelector('.sidebar')),
    manifest: Boolean(document.querySelector('link[rel="manifest"]')),
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    sw: 'serviceWorker' in navigator,
  })`);
  check("Home renderiza", home.tracks === 8 && home.albums === 4 && home.player && home.sidebar, JSON.stringify(home));
  check("Sin desbordamiento horizontal", !home.overflowX);
  check("Manifest enlazado", home.manifest);
  check("Acento por defecto Spotify", home.accent === "#1db954", home.accent);
  await shot("01-home.png");

  // Tema
  await click(".theme-btn");
  await wait(400);
  const drawer = await evalJs(`({
    open: Boolean(document.querySelector('.drawer')),
    swatches: document.querySelectorAll('.swatch').length,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
  })`);
  check("Panel de tema abre", drawer.open && drawer.swatches === 8, JSON.stringify(drawer));
  await click(".swatch", 4);
  await wait(300);
  const themed = await evalJs(`({
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),
    stored: JSON.parse(localStorage.getItem('onda:v1') ?? '{}').theme?.accent ?? null,
    amoled: document.documentElement.dataset.amoled,
  })`);
  check("Tema cambia a Violeta y persiste", themed.accent === "#a78bfa" && themed.stored === "#a78bfa", JSON.stringify(themed));
  await shot("02-theme.png");
  await click(".drawer-head .icon-btn");
  await wait(300);
  check("Panel de tema cierra", !(await evalJs("Boolean(document.querySelector('.drawer'))")));

  // Reproduccion (clic real)
  await click(".track-row", 0);
  await wait(4000);
  const playing = await evalJs(`({
    title: document.querySelector('.player-title')?.textContent ?? null,
    progress: document.querySelector('.player-progress span')?.textContent ?? null,
    current: Boolean(document.querySelector('.track-row.is-current')),
    toast: document.querySelector('.toast')?.textContent ?? null,
    audioRequests: performance.getEntriesByType('resource').filter((e) => e.name.includes('/audio/')).map((e) => ({ name: e.name.split('/').pop(), bytes: e.transferSize, ms: Math.round(e.duration) })),
  })`);
  check(
    "Reproduce la primera pista",
    playing.title === "Avenida 4AM" && playing.current && playing.progress !== "0:00",
    JSON.stringify(playing),
  );
  await shot("03-playing.png");

  // Menu contextual (clic real en el item)
  await click(".track-more", 0);
  await wait(300);
  const menuState = await evalJs(`(() => {
    const menu = document.querySelector('.menu');
    const target = [...document.querySelectorAll('.menu button')].find((button) => button.textContent.includes('Ir al álbum'));
    const rect = target?.getBoundingClientRect();
    const hit = rect ? document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2) : null;
    return {
      open: Boolean(menu),
      items: [...document.querySelectorAll('.menu button')].map((button) => button.textContent.trim()),
      insideViewport: Boolean(rect) && rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight,
      clickable: hit === target,
    };
  })()`);
  check(
    "Menu de pista abre",
    menuState.open && menuState.items.includes("Ir al álbum") && menuState.insideViewport && menuState.clickable,
    JSON.stringify(menuState),
  );
  await clickVisible(
    `[...document.querySelectorAll('.menu button')].find((button) => button.textContent.includes('Ir al álbum'))`,
  );
  await wait(600);
  const albumAfterMenu = await evalJs(`({
    heading: document.querySelector('.detail-copy h1')?.textContent ?? null,
    tracks: document.querySelectorAll('.track-row').length,
    menuOpen: Boolean(document.querySelector('.menu')),
  })`);
  check(
    "Menu navega al album",
    albumAfterMenu.heading === "Neón Tardío" && albumAfterMenu.tracks === 2 && !albumAfterMenu.menuOpen,
    JSON.stringify(albumAfterMenu),
  );
  await shot("03b-menu-album.png");
  await click(".back-link");
  await wait(400);

  // Descarga a IndexedDB
  await click(".track-row .track-actions .icon-btn", 1);
  await wait(2500);
  const downloaded = await evalJs(`new Promise((resolve) => {
    const request = indexedDB.open('onda-db');
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('downloads', 'readonly');
      const all = tx.objectStore('downloads').getAll();
      all.onsuccess = () => resolve({
        count: all.result.length,
        bytes: all.result[0]?.blob?.size ?? 0,
        title: all.result[0]?.title ?? null,
        marked: document.querySelectorAll('.track-row .track-actions .icon-btn.is-on').length,
      });
    };
    request.onerror = () => resolve({ count: -1 });
  })`);
  check(
    "Descarga pista en IndexedDB",
    downloaded.count === 1 && downloaded.bytes > 1000000 && downloaded.marked >= 1,
    JSON.stringify(downloaded),
  );

  // Service worker + offline
  const controlled = await evalJs(`navigator.serviceWorker.ready.then(async () => {
    if (!navigator.serviceWorker.controller) await new Promise((resolve) => {
      navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
      setTimeout(resolve, 3000);
    });
    return Boolean(navigator.serviceWorker.controller);
  })`);
  check("Service worker controla la pagina", controlled === true);

  await send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  await send("Page.reload", { ignoreCache: true });
  await wait(2200);

  const offline = await evalJs(`({
    heading: document.querySelector('.view-head h1')?.textContent ?? null,
    tracks: document.querySelectorAll('.track-row').length,
    brand: document.querySelector('.brand-name')?.textContent ?? null,
    downloaded: document.querySelectorAll('.track-row .track-actions .icon-btn.is-on').length,
    offlineChip: document.querySelector('.net-chip')?.textContent ?? null,
  })`);
  check(
    "Shell carga sin conexion",
    offline.tracks === 8 && offline.brand === "Onda",
    JSON.stringify(offline),
  );
  check("Descarga hidratada sin conexion", offline.downloaded >= 1, JSON.stringify(offline));
  await shot("04-offline.png");

  await click(".track-row", 0);
  await wait(1800);
  const offlinePlay = await evalJs(`({
    title: document.querySelector('.player-title')?.textContent ?? null,
    progress: document.querySelector('.player-progress span')?.textContent ?? null,
    current: Boolean(document.querySelector('.track-row.is-current')),
  })`);
  check(
    "Reproduce descarga sin conexion",
    offlinePlay.title === "Avenida 4AM" && offlinePlay.progress !== "0:00",
    JSON.stringify(offlinePlay),
  );

  await send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });

  // Movil
  await send("Emulation.setDeviceMetricsOverride", {
    width: 390,
    height: 844,
    deviceScaleFactor: 2,
    mobile: true,
  });
  await send("Page.reload");
  await wait(1800);
  const mobile = await evalJs(`({
    nav: getComputedStyle(document.querySelector('.mobile-nav')).display !== 'none',
    sidebar: getComputedStyle(document.querySelector('.sidebar')).display !== 'none',
    overflowX: document.documentElement.scrollWidth > window.innerWidth,
    tracks: document.querySelectorAll('.track-row').length,
  })`);
  check("Layout movil sin sidebar y con nav inferior", mobile.nav && !mobile.sidebar, JSON.stringify(mobile));
  check("Movil sin desbordamiento horizontal", !mobile.overflowX);

  await click(".track-row", 0);
  await wait(4000);
  const mobileBar = await evalJs(`(() => {
    const bar = document.querySelector('.player-progress');
    const input = bar?.querySelector('input');
    const rect = bar?.getBoundingClientRect();
    return {
      visible: Boolean(bar) && getComputedStyle(bar).display !== 'none' && (rect?.height ?? 0) > 0,
      value: Number(input?.value ?? 0),
      max: Number(input?.max ?? 0),
      width: Math.round(rect?.width ?? 0),
      title: document.querySelector('.player-title')?.textContent ?? null,
    };
  })()`);
  check(
    "Barra de progreso movil visible y avanzando",
    mobileBar.visible && mobileBar.value > 0 && mobileBar.width > 200,
    JSON.stringify(mobileBar),
  );

  await clickRange(".player-progress input", 0.7);
  await wait(500);
  const seeked = await evalJs(`(() => {
    const input = document.querySelector('.player-progress input');
    const max = Number(input?.max ?? 0);
    const value = Number(input?.value ?? 0);
    return { value, max, ratio: max > 0 ? Number((value / max).toFixed(2)) : 0 };
  })()`);
  check("Barra movil permite buscar posicion", seeked.ratio >= 0.55, JSON.stringify(seeked));
  await shot("05-mobile.png");

  const realErrors = errors.filter(
    (text) => !/favicon|net::ERR_INTERNET_DISCONNECTED|Failed to load resource/i.test(text),
  );
  check("Sin errores de runtime", realErrors.length === 0, realErrors.join(" | ").slice(0, 400));

  const failed = results.filter((item) => !item.ok).length;
  console.log(`\n${results.length - failed}/${results.length} comprobaciones OK`);
  console.log(`Capturas en ${outDir}`);
  if (realErrors.length) console.log("Errores:", realErrors);
  process.exitCode = failed ? 1 : 0;
} catch (error) {
  console.error("SMOKE_ERROR", error);
  process.exitCode = 1;
} finally {
  try {
    ws?.close();
  } catch {
    /* ignorado */
  }
  proc.kill();
}
