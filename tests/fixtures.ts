import type { Story } from '../src/story';

export const story: Story = {
  title: 'The Weaver of Lake Atitlán',
  subtitle: 'Three generations, one loom, and the patterns that carry a village’s memory.',
  byline: 'Story by the Obsidian team · Photos by community members',
  publicUrl: 'https://example.org/stories/weaver-of-atitlan',
  blocks: [
    { type: 'hero', imageKey: 'stories/1/hero.jpg', alt: 'Hands at a backstrap loom' },
    { type: 'portrait', imageKey: 'stories/1/maria.jpg', alt: 'Portrait of María', caption: 'María, 71, has woven since she was nine.' },
    { type: 'text', paragraphs: ['Every pattern has a name, and every name has a story.', 'The red zigzag is the path to the market; the birds are the ones that return each spring.'] },
    { type: 'quote', text: 'If the patterns stop, the stories stop.', attribution: 'María' },
    { type: 'image', imageKey: 'stories/1/loom.jpg', alt: 'Finished huipil on the loom', caption: 'A huipil takes three months.', aspect: 0.66 },
  ],
};

export const opts = {
  imageUrl: (k: string) => `https://cdn.example.org/${k}`,
  circleUrl: (k: string) => `https://cdn.example.org/${k.replace(/\.\w+$/, '')}-circle@2x.png`,
};
