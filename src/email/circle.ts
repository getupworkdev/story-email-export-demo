// Circles in email: Outlook for Windows ignores border-radius, so a CSS circle shows up as a
// square there. The reliable fix is to bake the circle into the image itself (transparent
// corners) at 2x for sharp retina display, and size it with width/height attributes.
import sharp from 'sharp';

export async function bakeCircle(input: Buffer, size: number, scale = 2): Promise<Buffer> {
  const px = size * scale;
  const mask = Buffer.from(
    `<svg width="${px}" height="${px}"><circle cx="${px / 2}" cy="${px / 2}" r="${px / 2}" fill="#fff"/></svg>`,
  );
  return sharp(input)
    .resize(px, px, { fit: 'cover', position: 'attention' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}
