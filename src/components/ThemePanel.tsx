import { useEffect, useState } from "react";
import { closeThemePanel, navigate, resetTheme, setLibraryTab, setTheme } from "../lib/actions";
import { downloadBytes } from "../lib/db";
import { formatBytes } from "../lib/format";
import { ACCENTS, useStore } from "../lib/store";
import { CheckIcon, DownloadIcon, PaletteIcon, XIcon } from "./Icons";

export const ThemePanel = () => {
  const open = useStore((s) => s.themeOpen);
  const theme = useStore((s) => s.theme);
  const downloads = useStore((s) => s.downloads);
  const [bytes, setBytes] = useState(0);

  const doneCount = Object.values(downloads).filter((value) => value === "done").length;

  useEffect(() => {
    if (!open) return;
    let alive = true;
    downloadBytes()
      .then((value) => {
        if (alive) setBytes(value);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, downloads]);

  if (!open) return null;

  return (
    <>
      <div className="drawer-backdrop" onClick={closeThemePanel} aria-hidden="true" />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Personalizar tema">
        <header className="drawer-head">
          <div className="drawer-title">
            <PaletteIcon size={19} />
            <h2>Personalizar</h2>
          </div>
          <button type="button" className="icon-btn" aria-label="Cerrar" onClick={closeThemePanel}>
            <XIcon size={18} />
          </button>
        </header>

        <div className="drawer-body">
          <div className="theme-preview">
            <div className="theme-preview-art">
              <span />
            </div>
            <div className="theme-preview-meta">
              <p>Tu música, tu color</p>
              <span>Vista previa del acento</span>
            </div>
            <span className="theme-preview-play" aria-hidden="true">
              <span />
            </span>
          </div>

          <section className="field">
            <div className="field-head">
              <h3>Color de acento</h3>
              <span className="field-value">{theme.accent.toUpperCase()}</span>
            </div>
            <div className="swatches">
              {ACCENTS.map((accent) => {
                const active = accent.value.toLowerCase() === theme.accent.toLowerCase();
                return (
                  <button
                    key={accent.value}
                    type="button"
                    className={`swatch${active ? " is-active" : ""}`}
                    style={{ background: accent.value }}
                    aria-label={`Color ${accent.name}`}
                    aria-pressed={active}
                    title={accent.name}
                    onClick={() => setTheme({ accent: accent.value })}
                  >
                    {active && <CheckIcon size={15} />}
                  </button>
                );
              })}
            </div>
            <label className="custom-color">
              <span>Color libre</span>
              <input
                type="color"
                value={theme.accent}
                aria-label="Elegir color personalizado"
                onChange={(event) => setTheme({ accent: event.target.value })}
              />
            </label>
          </section>

          <section className="field">
            <div className="field-head">
              <h3>Fondo</h3>
            </div>
            <button
              type="button"
              className="switch-row"
              aria-pressed={theme.amoled}
              onClick={() => setTheme({ amoled: !theme.amoled })}
            >
              <span>
                <strong>Negro puro</strong>
                <small>Ahorra batería en pantallas OLED</small>
              </span>
              <span className={`switch${theme.amoled ? " is-on" : ""}`} aria-hidden="true">
                <i />
              </span>
            </button>
          </section>

          <section className="field">
            <div className="field-head">
              <h3>Bordes</h3>
              <span className="field-value">{theme.radius}px</span>
            </div>
            <input
              type="range"
              className="range"
              min={0}
              max={24}
              step={1}
              value={theme.radius}
              aria-label="Redondeo de bordes"
              style={{
                background: `linear-gradient(to right, var(--accent) ${
                  (theme.radius / 24) * 100
                }%, rgba(255,255,255,.14) ${(theme.radius / 24) * 100}%)`,
              }}
              onChange={(event) => setTheme({ radius: Number(event.target.value) })}
            />
          </section>

          <section className="field">
            <button
              type="button"
              className="switch-row"
              aria-pressed={theme.motion}
              onClick={() => setTheme({ motion: !theme.motion })}
            >
              <span>
                <strong>Animaciones</strong>
                <small>Transiciones suaves entre vistas</small>
              </span>
              <span className={`switch${theme.motion ? " is-on" : ""}`} aria-hidden="true">
                <i />
              </span>
            </button>
          </section>

          <section className="field storage-field">
            <div className="field-head">
              <h3>Sin conexión</h3>
            </div>
            <div className="storage-box">
              <span className="storage-icon">
                <DownloadIcon size={18} />
              </span>
              <div className="storage-meta">
                <strong>{doneCount === 0 ? "Sin descargas" : `${doneCount} ${doneCount === 1 ? "pista" : "pistas"}`}</strong>
                <small>{doneCount === 0 ? "Guarda música para escucharla sin datos" : `${formatBytes(bytes)} en este dispositivo`}</small>
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setLibraryTab("downloads");
                  navigate({ name: "library" });
                  closeThemePanel();
                }}
              >
                Gestionar
              </button>
            </div>
          </section>

          <button type="button" className="btn btn-ghost btn-block" onClick={resetTheme}>
            Restablecer tema
          </button>
        </div>
      </aside>
    </>
  );
};
