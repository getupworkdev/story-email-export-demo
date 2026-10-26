// The shape of a published story, as the export sees it. Mirrors the three fixed templates:
// a hero photo, circular portraits, body text, inline photos and pull quotes.

export type Block =
  | { type: 'hero'; imageKey: string; alt: string }
  | { type: 'portrait'; imageKey: string; alt: string; caption: string } // rendered as a circle
  | { type: 'text'; paragraphs: string[] }
  | { type: 'image'; imageKey: string; alt: string; caption?: string; aspect: number } // aspect = height / width
  | { type: 'quote'; text: string; attribution?: string };

export interface Story {
  title: string;
  subtitle?: string;
  byline?: string;
  publicUrl: string;
  blocks: Block[];
}

/** Fixed template measurements, in CSS pixels. One source of truth for web and email. */
export const TEMPLATE = {
  emailWidth: 600,
  gutter: 32,
  portraitSize: 120,
  bodyFont: 'Georgia, "Times New Roman", serif',
  uiFont: 'Arial, Helvetica, sans-serif',
  ink: '#1f1b16',
  muted: '#6b6359',
  accent: '#8a3b12',
  paper: '#ffffff',
  page: '#f4efe8',
} as const;
