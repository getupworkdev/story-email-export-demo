// Table-based, inline-styled HTML for ActiveCampaign (and any email client).
// Rules applied everywhere, because each one fixes a real client difference:
//  - layout with tables, never flex/grid/position (Outlook uses Word's renderer)
//  - every <img> has width/height attributes (Outlook ignores CSS sizes) and alt text
//  - a fixed 600px column wrapped in an Outlook-only "ghost table", fluid below 600px
//  - circles are pre-baked images, not border-radius
//  - all text escaped; no scripts, no external CSS
import { TEMPLATE as T, type Block, type Story } from '../story';

export interface RenderOptions {
  /** Public URL for an uploaded image (e.g. DigitalOcean Spaces CDN). */
  imageUrl: (key: string) => string;
  /** Public URL for the baked circle version of an image. */
  circleUrl: (key: string) => string;
  /** Hidden preview line shown in the inbox list. */
  preheader?: string;
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const inner = T.emailWidth - T.gutter * 2;

function row(content: string, pad = `0 ${T.gutter}px 24px`) {
  return `<tr><td style="padding:${pad};">${content}</td></tr>`;
}

function block(b: Block, o: RenderOptions): string {
  switch (b.type) {
    case 'hero':
      return `<tr><td style="padding:0;"><img src="${esc(o.imageUrl(b.imageKey))}" width="${T.emailWidth}" height="${Math.round(T.emailWidth * 0.6)}" alt="${esc(b.alt)}" style="display:block;width:100%;max-width:${T.emailWidth}px;height:auto;border:0;"></td></tr>`;
    case 'portrait':
      return row(
        `<table role="presentation" align="center" cellpadding="0" cellspacing="0" border="0"><tr><td align="center">` +
          `<img src="${esc(o.circleUrl(b.imageKey))}" width="${T.portraitSize}" height="${T.portraitSize}" alt="${esc(b.alt)}" style="display:block;width:${T.portraitSize}px;height:${T.portraitSize}px;border:0;">` +
          `</td></tr><tr><td align="center" style="padding-top:10px;font-family:${T.uiFont};font-size:13px;line-height:18px;color:${T.muted};">${esc(b.caption)}</td></tr></table>`,
      );
    case 'text':
      return row(
        b.paragraphs
          .map((p) => `<p style="margin:0 0 16px;font-family:${T.bodyFont};font-size:18px;line-height:28px;color:${T.ink};">${esc(p)}</p>`)
          .join(''),
        `0 ${T.gutter}px 8px`,
      );
    case 'image': {
      const h = Math.round(inner * b.aspect);
      const cap = b.caption
        ? `<p style="margin:8px 0 0;font-family:${T.uiFont};font-size:13px;line-height:18px;color:${T.muted};">${esc(b.caption)}</p>`
        : '';
      return row(`<img src="${esc(o.imageUrl(b.imageKey))}" width="${inner}" height="${h}" alt="${esc(b.alt)}" style="display:block;width:100%;max-width:${inner}px;height:auto;border:0;">${cap}`);
    }
    case 'quote':
      return row(
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
          `<td width="4" style="background:${T.accent};font-size:0;line-height:0;">&nbsp;</td>` +
          `<td style="padding:4px 0 4px 16px;font-family:${T.bodyFont};font-size:22px;line-height:30px;font-style:italic;color:${T.ink};">${esc(b.text)}` +
          (b.attribution ? `<br><span style="font-family:${T.uiFont};font-size:13px;font-style:normal;color:${T.muted};">${esc(b.attribution)}</span>` : '') +
          `</td></tr></table>`,
      );
  }
}

export function renderStoryEmail(story: Story, o: RenderOptions): string {
  const pre = esc(o.preheader ?? story.subtitle ?? '');
  const body = story.blocks.map((b) => block(b, o)).join('\n');
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="en"><head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="x-apple-disable-message-reformatting">
<title>${esc(story.title)}</title>
<!--[if mso]><style>table,td,p,a,span{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${T.page};">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${pre}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${T.page};"><tr><td align="center" style="padding:24px 0;">
<!--[if mso]><table role="presentation" width="${T.emailWidth}" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:${T.emailWidth}px;background:${T.paper};">
${row(`<h1 style="margin:0;font-family:${T.bodyFont};font-size:32px;line-height:40px;font-weight:normal;color:${T.ink};">${esc(story.title)}</h1>` + (story.byline ? `<p style="margin:8px 0 0;font-family:${T.uiFont};font-size:13px;color:${T.muted};">${esc(story.byline)}</p>` : ''), `${T.gutter}px ${T.gutter}px 24px`)}
${body}
${row(`<a href="${esc(story.publicUrl)}" style="display:inline-block;padding:12px 22px;background:${T.accent};color:#ffffff;font-family:${T.uiFont};font-size:15px;font-weight:bold;text-decoration:none;">Read the full story</a>`, `8px ${T.gutter}px ${T.gutter}px`)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr></table>
</body></html>`;
}
