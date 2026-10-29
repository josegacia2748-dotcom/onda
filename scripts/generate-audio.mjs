// Genera el catalogo de audio demo de Onda con sintesis propia.
// Sin dependencias, sin material de terceros: todo el audio es original.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const SR = 32000;
const DUR = 48;

const mulberry32 = (a) => () => {
  a |= 0;
  a = (a + 0x6d2b79f5) | 0;
  let t = Math.imul(a ^ (a >>> 15), 1 | a);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const STYLES = {
  synthwave: {
    pad: { a: 0.9, r: 1.6, amp: 0.15, kind: "saw", oct: 0 },
    bass: { amp: 0.26, kind: "saw", decay: 5.5, oct: -12 },
    arp: { amp: 0.055, kind: "square", step: 0.25, oct: 12 },
    lead: { amp: 0.075, kind: "tri", oct: 12 },
    drums: { kick: 0.5, snare: 0.16, hat: 0.055, four: false, ghost: true },
    cut: 8200,
    echo: 0.24,
  },
  lofi: {
    pad: { a: 0.7, r: 1.8, amp: 0.17, kind: "tri", oct: 0 },
    bass: { amp: 0.24, kind: "sine", decay: 4.2, oct: -12 },
    arp: { amp: 0.05, kind: "tri", step: 0.5, oct: 12 },
    lead: null,
    drums: { kick: 0.34, snare: 0.1, hat: 0.035, four: false, ghost: true },
    cut: 3600,
    echo: 0.3,
  },
  ambient: {
    pad: { a: 2.4, r: 3.2, amp: 0.2, kind: "sine", oct: 0 },
    bass: { amp: 0.16, kind: "sine", decay: 2.2, oct: -12 },
    arp: { amp: 0.035, kind: "sine", step: 1, oct: 24 },
    lead: null,
    drums: null,
    cut: 5600,
    echo: 0.38,
  },
  house: {
    pad: { a: 0.35, r: 0.9, amp: 0.11, kind: "saw", oct: 0 },
    bass: { amp: 0.28, kind: "saw", decay: 7.5, oct: -12 },
    arp: { amp: 0.05, kind: "square", step: 0.25, oct: 12 },
    lead: { amp: 0.06, kind: "square", oct: 24 },
    drums: { kick: 0.5, snare: 0.13, hat: 0.05, four: true, ghost: false },
    cut: 10500,
    echo: 0.18,
  },
};

const TRACKS = [
  { id: "avenida-4am", style: "synthwave", bpm: 104, root: 45, prog: [0, 5, 3, -2], seed: 7, lead: true },
  { id: "faro-roto", style: "synthwave", bpm: 96, root: 41, prog: [0, -4, -2, 3], seed: 19, lead: true },
  { id: "ventana-empanada", style: "lofi", bpm: 78, root: 48, prog: [0, -3, -5, -1], seed: 23, lead: false },
  { id: "te-frio", style: "lofi", bpm: 72, root: 43, prog: [0, 3, 5, 2], seed: 31, lead: false },
  { id: "peso-cero", style: "ambient", bpm: 58, root: 40, prog: [0, 7, 5, 3], seed: 41, lead: false },
  { id: "reentrada", style: "ambient", bpm: 62, root: 38, prog: [0, 5, 10, 7], seed: 47, lead: false },
  { id: "persianas", style: "house", bpm: 122, root: 46, prog: [0, -5, -3, -7], seed: 53, lead: true },
  { id: "madrugada", style: "house", bpm: 118, root: 44, prog: [0, 3, -2, -4], seed: 59, lead: false },
];

function render(track) {
  const cfg = STYLES[track.style];
  const rnd = mulberry32(track.seed);
  const buf = new Float32Array(SR * DUR);
  const beat = 60 / track.bpm;
  const bar = beat * 4;
  const bars = Math.ceil(DUR / bar);

  const add = (start, dur, freq, amp, kind, env, detune = 0) => {
    const s0 = Math.floor(start * SR);
    if (s0 >= buf.length) return;
    const n = Math.min(Math.floor(dur * SR), buf.length - s0);
    let phase = rnd();
    let lp = 0;
    const inc = (freq * (1 + detune)) / SR;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const e = env(t, dur);
      phase += inc;
      if (phase >= 1) phase -= 1;
      let v;
      if (kind === "sine") v = Math.sin(2 * Math.PI * phase);
      else if (kind === "tri") v = 4 * Math.abs(phase - 0.5) - 1;
      else if (kind === "saw") v = 2 * phase - 1;
      else v = phase < 0.5 ? 1 : -1;
      lp += (v - lp) * 0.22;
      buf[s0 + i] += lp * e * amp;
    }
  };

  const padEnv = (a, r) => (t, d) => {
    if (t < a) return t / a;
    if (t > d - r) return clamp((d - t) / r, 0, 1);
    return 0.86;
  };
  const pluck = (decay) => (t) => Math.min(1, t / 0.006) * Math.exp(-t * decay);
  const stab = (decay) => (t) => Math.min(1, t / 0.004) * Math.exp(-t * decay);

  const kick = (start, amp) => {
    const s0 = Math.floor(start * SR);
    const n = Math.min(Math.floor(0.42 * SR), buf.length - s0);
    let phase = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const f = 42 + 120 * Math.exp(-t * 16);
      phase += f / SR;
      const e = Math.exp(-t * 6.2) * Math.min(1, t / 0.002);
      buf[s0 + i] += Math.sin(2 * Math.PI * phase) * e * amp;
      if (t < 0.012) buf[s0 + i] += (rnd() * 2 - 1) * 0.12 * amp;
    }
  };
  const snare = (start, amp) => {
    const s0 = Math.floor(start * SR);
    const n = Math.min(Math.floor(0.24 * SR), buf.length - s0);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const noise = rnd() * 2 - 1;
      const hp = noise - prev * 0.92;
      prev = noise;
      const e = Math.exp(-t * 17);
      buf[s0 + i] += (hp * 0.7 + Math.sin(2 * Math.PI * 186 * t) * 0.35) * e * amp;
    }
  };
  const hat = (start, amp) => {
    const s0 = Math.floor(start * SR);
    const n = Math.min(Math.floor(0.07 * SR), buf.length - s0);
    let prev = 0;
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const noise = rnd() * 2 - 1;
      const hp = noise - prev * 0.96;
      prev = noise;
      buf[s0 + i] += hp * Math.exp(-t * 62) * amp;
    }
  };

  const chordTones = [0, 3, 7, 10];

  for (let b = 0; b < bars; b++) {
    const t0 = b * bar;
    const root = track.root + track.prog[b % track.prog.length];

    for (const iv of chordTones) {
      add(t0, bar * 1.04, mtof(root + iv + cfg.pad.oct), cfg.pad.amp, cfg.pad.kind, padEnv(cfg.pad.a, cfg.pad.r), (rnd() - 0.5) * 0.004);
      add(t0, bar * 1.04, mtof(root + iv + cfg.pad.oct), cfg.pad.amp * 0.6, cfg.pad.kind, padEnv(cfg.pad.a * 1.4, cfg.pad.r), 0.003);
    }

    const bassSteps = track.style === "house" ? [0, 1, 2, 3, 0.5, 1.5, 2.5, 3.5] : [0, 1.5, 2, 3];
    for (const s of bassSteps) {
      add(t0 + s * beat, beat * 0.55, mtof(root + cfg.bass.oct), cfg.bass.amp, cfg.bass.kind, pluck(cfg.bass.decay));
    }

    const arpPattern = [0, 2, 1, 3, 2, 0, 3, 1];
    const steps = Math.round(4 / cfg.arp.step);
    for (let s = 0; s < steps; s++) {
      if (track.style === "ambient" && rnd() < 0.45) continue;
      const iv = chordTones[arpPattern[s % arpPattern.length]];
      const oct = rnd() < 0.18 ? 12 : 0;
      add(t0 + s * cfg.arp.step * beat, cfg.arp.step * beat * 0.9, mtof(root + iv + cfg.arp.oct + oct), cfg.arp.amp, cfg.arp.kind, stab(track.style === "ambient" ? 1.6 : 9));
    }

    if (track.lead && cfg.lead) {
      const scale = [0, 2, 3, 5, 7, 8, 10, 12];
      let s = 0;
      while (s < 4) {
        const len = [0.5, 1, 1, 1.5][Math.floor(rnd() * 4)];
        if (rnd() > 0.22) {
          const n = scale[Math.floor(rnd() * scale.length)];
          add(t0 + s * beat, Math.min(len, 4 - s) * beat * 0.92, mtof(root + n + cfg.lead.oct), cfg.lead.amp, cfg.lead.kind, stab(2.4));
        }
        s += len;
      }
    }

    if (cfg.drums) {
      const d = cfg.drums;
      const kicks = d.four ? [0, 1, 2, 3] : [0, 2, 2.75];
      for (const k of kicks) kick(t0 + k * beat, d.kick);
      snare(t0 + beat, d.snare * 0.8);
      snare(t0 + 3 * beat, d.snare);
      const hatStep = track.style === "house" ? 0.5 : 1;
      for (let s = 0; s < 4; s += hatStep) hat(t0 + s * beat, s % 1 === 0 ? d.hat : d.hat * 0.6);
      if (d.ghost && rnd() < 0.5) snare(t0 + 2.25 * beat, d.snare * 0.22);
    }
  }

  // Eco global con realimentacion
  const delay = Math.floor((beat * 0.75) * SR);
  const echo = cfg.echo;
  if (echo > 0) {
    const wet = new Float32Array(buf.length);
    for (let i = delay; i < buf.length; i++) {
      wet[i] = buf[i - delay] + wet[i - delay] * 0.42;
    }
    for (let i = 0; i < buf.length; i++) buf[i] += wet[i] * echo;
  }

  // Filtro global de un polo
  const a = 1 - Math.exp((-2 * Math.PI * cfg.cut) / SR);
  let lp = 0;
  for (let i = 0; i < buf.length; i++) {
    lp += (buf[i] - lp) * a;
    buf[i] = lp;
  }

  // Fades y normalizacion
  const fade = Math.floor(1.6 * SR);
  for (let i = 0; i < fade; i++) {
    const g = i / fade;
    buf[i] *= g;
    buf[buf.length - 1 - i] *= g;
  }
  let peak = 0;
  for (let i = 0; i < buf.length; i++) {
    buf[i] = Math.tanh(buf[i] * 1.25);
    peak = Math.max(peak, Math.abs(buf[i]));
  }
  const norm = peak > 0 ? 0.92 / peak : 1;
  for (let i = 0; i < buf.length; i++) buf[i] *= norm;
  return buf;
}

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const out = Buffer.alloc(44 + dataBytes);
  out.write("RIFF", 0);
  out.writeUInt32LE(36 + dataBytes, 4);
  out.write("WAVE", 8);
  out.write("fmt ", 12);
  out.writeUInt32LE(16, 16);
  out.writeUInt16LE(1, 20);
  out.writeUInt16LE(1, 22);
  out.writeUInt32LE(SR, 24);
  out.writeUInt32LE(SR * 2, 28);
  out.writeUInt16LE(2, 32);
  out.writeUInt16LE(16, 34);
  out.write("data", 36);
  out.writeUInt32LE(dataBytes, 40);
  for (let i = 0; i < samples.length; i++) {
    out.writeInt16LE(Math.round(clamp(samples[i], -1, 1) * 32767), 44 + i * 2);
  }
  return out;
}

const outDir = join(process.cwd(), "public", "audio");
mkdirSync(outDir, { recursive: true });

for (const track of TRACKS) {
  const wav = toWav(render(track));
  const file = join(outDir, `${track.id}.wav`);
  writeFileSync(file, wav);
  console.log(`${track.id}.wav  ${(wav.length / 1048576).toFixed(2)} MB`);
}
console.log(`OK ${TRACKS.length} pistas en ${outDir}`);
