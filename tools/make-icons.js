// Genera los iconos PNG de la app (sin dependencias): node tools/make-icons.js
const fs = require('fs'), zlib = require('zlib'), path = require('path');

function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x / size, y / size);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc = b => { let c = 0xffffffff; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

// Dibujo en coordenadas 0..1 con suavizado por supermuestreo
const BG = [29, 111, 214], W = [255, 255, 255], D = [23, 40, 70];
function shade(u, v, maskable) {
  // fondo: cuadrado redondeado (o lleno si es "maskable")
  const inBg = maskable || (() => { const r = 0.2, dx = Math.max(0, Math.abs(u - 0.5) - (0.5 - r)), dy = Math.max(0, Math.abs(v - 0.5) - (0.5 - r)); return dx * dx + dy * dy <= r * r; })();
  if (!inBg) return null;
  // escala del coche (más pequeño en maskable para la zona segura)
  const s = maskable ? 0.78 : 1, x = (u - 0.5) / s + 0.5, y = (v - 0.5) / s + 0.5;
  const wheel = (cx) => Math.hypot(x - cx, y - 0.66) < 0.085;
  const hub = (cx) => Math.hypot(x - cx, y - 0.66) < 0.035;
  if (hub(0.32) || hub(0.68)) return W;
  if (wheel(0.32) || wheel(0.68)) return D;
  const body = y > 0.48 && y < 0.66 && x > 0.14 && x < 0.86 && !(y > 0.6 && (x < 0.18 || x > 0.82));
  const t = (y - 0.32) / 0.16; // cabina trapezoidal
  const cabin = y >= 0.32 && y <= 0.48 && x > 0.3 - 0.1 * t && x < 0.7 + 0.08 * t;
  const win = y >= 0.36 && y <= 0.47 && ((x > 0.33 - 0.08 * ((y - 0.36) / 0.11) && x < 0.485) || (x > 0.515 && x < 0.67 + 0.06 * ((y - 0.36) / 0.11)));
  if (win) return [150, 190, 240];
  if (body || cabin) return W;
  return BG;
}
function render(size, maskable) {
  const N = 4;
  return png(size, (u, v) => {
    let r = 0, g = 0, b = 0, a = 0;
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      const c = shade(u + (i + 0.5) / N / size, v + (j + 0.5) / N / size, maskable);
      if (c) { r += c[0]; g += c[1]; b += c[2]; a += 255; }
    }
    const k = N * N, al = a / k;
    return al ? [Math.round(r / (a / 255)), Math.round(g / (a / 255)), Math.round(b / (a / 255)), Math.round(al)] : [0, 0, 0, 0];
  });
}
const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'icon-192.png'), render(192, false));
fs.writeFileSync(path.join(out, 'icon-512.png'), render(512, false));
fs.writeFileSync(path.join(out, 'icon-maskable-512.png'), render(512, true));
console.log('iconos generados en', out);
