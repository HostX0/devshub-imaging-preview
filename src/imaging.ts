// Deterministic synthetic pixels for interaction demonstrations, not clinical data.
export function drawSample(
  canvas: HTMLCanvasElement,
  kind: 'MRI' | 'US',
  frame: number,
  total: number,
  contrast = 1,
  brightness = 0,
) {
  const size = 384;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const pixels = ctx.createImageData(size, size);
  const z = (frame - 1) / (total - 1 || 1);
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const nx = (x - size / 2) / (size * 0.4),
        ny = (y - size / 2) / (size * 0.44);
      let value = 0;
      if (kind === 'MRI') {
        const r = Math.sqrt(nx * nx + ny * ny);
        const scale = 0.7 + 0.27 * Math.sin(z * Math.PI);
        const rr = r / scale;
        if (rr < 1) {
          value = 38 + 90 * Math.exp(-Math.pow(rr - 0.91, 2) * 180);
          const texture =
            (Math.sin(x * 0.13 + y * 0.073 + z * 7) + Math.sin(y * 0.11 - x * 0.087)) * 16;
          value += texture + 75 * (1 - rr);
          const folds = Math.sin(Math.atan2(ny, nx) * 19 + rr * 25 + z * 8);
          if (rr > 0.35 && rr < 0.84) value += folds * 27;
          const vent = Math.pow(nx / 0.17, 2) + Math.pow((ny + 0.07) / 0.28, 2);
          if (vent < 1) value = 20 + Math.abs(nx) * 55;
          const mid = Math.abs(nx);
          if (mid < 0.025 && ny < 0.45) value *= 0.36;
          if (rr > 0.965) value = 155;
        }
        if (rr > 1.025 && rr < 1.08) value = 18;
      } else {
        const yy = (y - 45) / 320,
          xx = (x - 192) / 330;
        const angle = Math.atan2(xx, yy);
        const rad = Math.sqrt(xx * xx + yy * yy);
        if (yy > 0 && Math.abs(angle) < 0.63 && rad < 0.93) {
          const noise =
            (((Math.sin(x * 12.9898 + y * 78.233 + frame * 0.3) * 43758.5453) % 1) + 1) % 1;
          value = 22 + noise * 105 * (1 - rad * 0.5);
          const shape =
            Math.pow((xx - 0.06 * Math.sin(z * 6)) / 0.19, 2) + Math.pow((yy - 0.52) / 0.13, 2);
          if (shape < 1) value *= 0.2;
          if (Math.abs(shape - 1) < 0.14) value += 80;
          value += Math.sin(rad * 99) * 8;
        }
      }
      value = Math.max(0, Math.min(255, (value - 96) * contrast + 96 + brightness));
      const i = (y * size + x) * 4;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
  ctx.putImageData(pixels, 0, 0);
}
