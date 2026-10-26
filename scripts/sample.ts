// Renders the sample story to out/sample-email.html with locally generated placeholder photos,
// so the export can be opened in a browser and screenshotted. No real photos are used.
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { bakeCircle } from '../src/email/circle';
import { renderStoryEmail } from '../src/email/render';
import { lintEmailHtml } from '../src/email/lint';
import { story } from '../tests/fixtures';

const out = resolve('out');
mkdirSync(out, { recursive: true });

async function placeholder(name: string, w: number, h: number, a: string, b: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${w * 0.7}" cy="${h * 0.35}" r="${h * 0.22}" fill="#ffffff" opacity="0.18"/></svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toBuffer();
  writeFileSync(`${out}/${name}`, buf);
  return buf;
}

await placeholder('hero.jpg', 1200, 720, '#c86b3c', '#5b2a12');
const portrait = await placeholder('maria.jpg', 600, 800, '#d9a066', '#7a3e1c');
writeFileSync(`${out}/maria-circle@2x.png`, await bakeCircle(portrait, 120));
await placeholder('loom.jpg', 1072, 708, '#2f5d62', '#a7c4a0');

const html = renderStoryEmail(story, {
  imageUrl: (k) => k.split('/').pop()!,
  circleUrl: (k) => k.split('/').pop()!.replace(/\.\w+$/, '') + '-circle@2x.png',
});
writeFileSync(`${out}/sample-email.html`, html);
console.log('lint issues:', lintEmailHtml(html).length, '· bytes:', Buffer.byteLength(html));
