import { describe, expect, test } from 'vitest';
import sharp from 'sharp';
import { renderStoryEmail } from '../src/email/render';
import { lintEmailHtml } from '../src/email/lint';
import { bakeCircle } from '../src/email/circle';
import { TEMPLATE } from '../src/story';
import { opts, story } from './fixtures';

describe('email export', () => {
  const html = renderStoryEmail(story, opts);

  test('passes every email-client rule', () => {
    expect(lintEmailHtml(html)).toEqual([]);
  });

  test('every image has fixed width/height attributes, so Outlook keeps the template sizes', () => {
    const imgs = html.match(/<img\b[^>]*>/g)!;
    expect(imgs).toHaveLength(3);
    for (const img of imgs) expect(img).toMatch(/ width="\d+" height="\d+"/);
  });

  test('portraits use the baked circle image at the template size, not border-radius', () => {
    const img = html.match(/<img\b[^>]*circle@2x[^>]*>/)![0];
    expect(img).toContain(`width="${TEMPLATE.portraitSize}" height="${TEMPLATE.portraitSize}"`);
    expect(html).not.toMatch(/border-radius/);
  });

  test('600px column with an Outlook-only wrapper, fluid on phones', () => {
    expect(html).toContain('<!--[if mso]><table role="presentation" width="600"');
    expect(html).toContain('max-width:600px');
  });

  test('story text is escaped', () => {
    const evil = renderStoryEmail({ ...story, title: '<script>alert(1)</script> & "quotes"' }, opts);
    expect(evil).not.toContain('<script>alert');
    expect(evil).toContain('&lt;script&gt;');
    expect(lintEmailHtml(evil)).toEqual([]);
  });

  test('stays far below the Gmail clipping limit', () => {
    expect(Buffer.byteLength(html)).toBeLessThan(20 * 1024);
  });

  test('the linter catches the classic mistakes', () => {
    const bad = '<div style="display:flex"><img src="a.jpg"><img src="b.jpg" style="border-radius:50%"></div><script></script>';
    const rules = lintEmailHtml(bad).map((i) => i.rule);
    expect(rules).toEqual(expect.arrayContaining(['table-layout', 'img-size-attrs', 'img-alt', 'baked-circles', 'no-script']));
  });
});

describe('baked circle', () => {
  test('2x size, transparent corners, opaque centre', async () => {
    const photo = await sharp({ create: { width: 800, height: 500, channels: 3, background: '#c86b3c' } }).jpeg().toBuffer();
    const out = await bakeCircle(photo, 120);
    const { data, info } = await sharp(out).raw().toBuffer({ resolveWithObject: true });
    expect([info.width, info.height, info.channels]).toEqual([240, 240, 4]);
    const alpha = (x: number, y: number) => data[(y * info.width + x) * 4 + 3];
    expect(alpha(0, 0)).toBe(0);
    expect(alpha(239, 239)).toBe(0);
    expect(alpha(120, 120)).toBe(255);
  });
});
