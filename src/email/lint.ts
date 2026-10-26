// Checks an export before it goes to ActiveCampaign. Each rule maps to a bug a client reported
// somewhere: images resizing in Outlook, Gmail clipping long emails, layouts collapsing.
export interface LintIssue { rule: string; detail: string }

const GMAIL_CLIP_BYTES = 102 * 1024; // Gmail hides everything after ~102 KB behind "View entire message"

export function lintEmailHtml(html: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const bytes = Buffer.byteLength(html, 'utf8');
  if (bytes > GMAIL_CLIP_BYTES) issues.push({ rule: 'gmail-clip', detail: `${bytes} bytes; Gmail clips above ${GMAIL_CLIP_BYTES}` });
  if (/<script\b/i.test(html)) issues.push({ rule: 'no-script', detail: 'scripts are stripped by every client' });
  if (/<link\b[^>]*stylesheet/i.test(html)) issues.push({ rule: 'no-external-css', detail: 'external stylesheets are ignored' });
  if (/display\s*:\s*(flex|grid)|position\s*:\s*(absolute|fixed)/i.test(html))
    issues.push({ rule: 'table-layout', detail: 'flex/grid/position break in Outlook' });
  for (const img of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\swidth="\d+"/.test(img) || !/\sheight="\d+"/.test(img)) issues.push({ rule: 'img-size-attrs', detail: img.slice(0, 80) });
    if (!/\salt="/.test(img)) issues.push({ rule: 'img-alt', detail: img.slice(0, 80) });
  }
  if (/border-radius\s*:\s*50%/i.test(html)) issues.push({ rule: 'baked-circles', detail: 'border-radius circles render square in Outlook; use a baked circle image' });
  return issues;
}
