/*
 * "Save card" (OB10): the front of the student card drawn onto a canvas, so the picture is the
 * same in every browser (no screenshot library). Sizes follow the card at 640 × 404 and are drawn
 * three times over. Colours come from the page's own tokens, so a dark-mode card saves dark. On a
 * phone that can share files the picture goes to the share sheet; anywhere else it downloads.
 */

export type CardPicture = {
  name: string;
  avatar: string | null;
  classLine: string | null;
  badge: string | null;
  focus: string[];
  focusLabel: string;
  student: string;
  stamp: string;
  /** A CSS colour or `var(--…)` for the class's tone. */
  tone: string;
};

const W = 640;
const H = 404;
const SCALE = 3;
const FILE = "10ms-student-card.png";

/** Any CSS colour (tokens, oklch, color-mix) as rgb, read back from a 1 × 1 canvas. */
function rgb(css: string): [number, number, number] {
  const probe = document.createElement("span");
  probe.style.color = css;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  const c = document.createElement("canvas").getContext("2d")!;
  c.fillStyle = resolved;
  c.fillRect(0, 0, 1, 1);
  const [r, g, b] = c.getImageData(0, 0, 1, 1).data;
  return [r, g, b];
}

const rgba = ([r, g, b]: [number, number, number], a = 1) => `rgba(${r}, ${g}, ${b}, ${a})`;

function roundRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

/** Cuts text to fit, ending in an ellipsis. */
function fit(c: CanvasRenderingContext2D, text: string, max: number) {
  if (c.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && c.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

/** A pill with text, returns its width. */
function pill(c: CanvasRenderingContext2D, text: string, x: number, cy: number, fill: string, ink: string, stroke?: string) {
  const w = c.measureText(text).width + 20;
  roundRect(c, x, cy - 11, w, 22, 11);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 1;
    c.stroke();
  }
  c.fillStyle = ink;
  c.fillText(text, x + 10, cy + 1);
  return w;
}

async function svgImage(svg: SVGSVGElement, colour: string) {
  const copy = svg.cloneNode(true) as SVGSVGElement;
  copy.setAttribute("color", colour);
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(copy))}`;
  const img = new Image();
  img.src = url;
  await img.decode();
  return img;
}

export async function drawCard(p: CardPicture, logo: SVGSVGElement | null): Promise<Blob> {
  await document.fonts.ready;
  const root = getComputedStyle(document.documentElement);
  const token = (n: string) => rgb(root.getPropertyValue(n).trim() || "black");
  const surface = token("--color-surface");
  const border = token("--color-border");
  const raised = token("--color-raised");
  const text = token("--color-text");
  const muted = token("--color-muted");
  const subtle = token("--color-subtle");
  const tone = rgb(p.tone);
  const font = getComputedStyle(document.body).fontFamily;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const c = canvas.getContext("2d")!;
  c.scale(SCALE, SCALE);
  c.textBaseline = "middle";

  // The card, clipped to its corners: surface, the tone's glow in the corner, the stripe.
  roundRect(c, 0.5, 0.5, W - 1, H - 1, 22);
  c.save();
  c.clip();
  c.fillStyle = rgba(surface);
  c.fillRect(0, 0, W, H);
  const glow = c.createRadialGradient(W, 0, 0, W, 0, W * 0.75);
  glow.addColorStop(0, rgba(tone, 0.16));
  glow.addColorStop(1, rgba(tone, 0));
  c.fillStyle = glow;
  c.fillRect(0, 0, W, H);
  c.fillStyle = rgba(tone);
  c.fillRect(0, 0, 10, H);
  c.restore();
  roundRect(c, 0.5, 0.5, W - 1, H - 1, 22);
  c.strokeStyle = rgba(border);
  c.lineWidth = 1;
  c.stroke();

  const left = 40;
  if (logo) {
    const img = await svgImage(logo, rgba(text));
    c.drawImage(img, left, 26, (30 * 101.299) / 28, 30);
  }
  c.font = `700 14px ${font}`;
  c.textAlign = "right";
  if ("letterSpacing" in c) c.letterSpacing = "3px";
  c.fillStyle = rgba(tone);
  c.fillText(p.student, W - 32, 42);
  if ("letterSpacing" in c) c.letterSpacing = "0px";
  c.textAlign = "left";

  // Face, name, class, group.
  const cx = left + 46;
  const cy = 150;
  c.beginPath();
  c.arc(cx, cy, 46, 0, Math.PI * 2);
  c.fillStyle = rgba(raised);
  c.fill();
  c.textAlign = "center";
  if (p.avatar) {
    c.font = `52px ${font}`;
    c.fillText(p.avatar, cx, cy + 3);
  } else if (p.name) {
    c.font = `700 36px ${font}`;
    c.fillStyle = rgba(muted);
    c.fillText(p.name.trim().charAt(0), cx, cy + 2);
  }
  c.textAlign = "left";

  const tx = cx + 46 + 24;
  const room = W - tx - 32;
  c.font = `700 32px ${font}`;
  c.fillStyle = rgba(text);
  c.fillText(fit(c, p.name, room), tx, p.badge ? 118 : 130);
  if (p.classLine) {
    c.font = `600 17px ${font}`;
    c.fillStyle = rgba(muted);
    c.fillText(fit(c, p.classLine, room), tx, p.badge ? 156 : 168);
  }
  if (p.badge) {
    c.font = `600 14px ${font}`;
    pill(c, p.badge, tx, 190, rgba(tone, 0.16), rgba(text));
  }

  // The hard subjects along the bottom, as far as they fit before the stamp.
  if (p.focus.length) {
    const y = H - 44;
    c.font = `600 14px ${font}`;
    c.fillStyle = rgba(subtle);
    c.fillText(p.focusLabel, left, y + 1);
    let x = left + c.measureText(p.focusLabel).width + 10;
    for (const f of p.focus) {
      if (x + c.measureText(f).width + 20 > W - 140) break;
      x += pill(c, f, x, y, rgba(surface), rgba(text), rgba(border)) + 6;
    }
  }

  // The "ready" stamp, tilted like the one on the card.
  c.save();
  c.translate(W - 76, H - 72);
  c.rotate((-14 * Math.PI) / 180);
  c.beginPath();
  c.arc(0, 0, 44, 0, Math.PI * 2);
  c.strokeStyle = rgba(tone);
  c.lineWidth = 4;
  c.stroke();
  c.font = `700 16px ${font}`;
  c.fillStyle = rgba(tone);
  c.textAlign = "center";
  c.fillText(`✓ ${p.stamp}`, 0, 1);
  c.restore();

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("canvas"))), "image/png"));
}

/** Shares the picture where the phone can share files, otherwise downloads it. */
export async function saveCard(blob: Blob) {
  const file = new File([blob], FILE, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: FILE });
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
