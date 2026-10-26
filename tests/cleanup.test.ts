import { describe, expect, test } from 'vitest';
import { planCleanup, runCleanup, type Media, type StoryRef } from '../src/media/cleanup';

const now = new Date('2026-10-26T00:00:00Z');
const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000);

const media: Media[] = [
  { id: '1', key: 'old-unused.jpg', uploadedAt: daysAgo(45) },
  { id: '2', key: 'old-in-published.jpg', uploadedAt: daysAgo(60) },
  { id: '3', key: 'old-in-draft.jpg', uploadedAt: daysAgo(40) },
  { id: '4', key: 'new-unused.jpg', uploadedAt: daysAgo(5) },
  { id: '5', key: 'exactly-30.jpg', uploadedAt: daysAgo(30) },
  { id: '6', key: 'already-gone.jpg', uploadedAt: daysAgo(90), deletedAt: daysAgo(1) },
];
const stories: StoryRef[] = [
  { id: 's1', status: 'published', mediaKeys: ['old-in-published.jpg'] },
  { id: 's2', status: 'draft', mediaKeys: ['old-in-draft.jpg'] },
];

describe('30-day media cleanup', () => {
  test('deletes only old, unreferenced images', () => {
    const plan = planCleanup(media, stories, now);
    expect(plan.delete.map((m) => m.key)).toEqual(['old-unused.jpg']);
    expect(plan.keptInUse.map((m) => m.key).sort()).toEqual(['old-in-draft.jpg', 'old-in-published.jpg']);
  });

  test('an image used by a published story is never deleted, so live pages and sent emails keep working', () => {
    const plan = planCleanup(media, stories, now, { days: 30, protectDrafts: false });
    expect(plan.delete.map((m) => m.key)).not.toContain('old-in-published.jpg');
    expect(plan.delete.map((m) => m.key)).toContain('old-in-draft.jpg');
  });

  test('storage is deleted before the DB row; a storage failure leaves the row for the next run', async () => {
    const calls: string[] = [];
    const plan = planCleanup(media, [], now);
    const res = await runCleanup(
      plan,
      { deleteObject: async (k) => { calls.push(`s3:${k}`); if (k === 'old-in-draft.jpg') throw new Error('timeout'); } },
      { markDeleted: async (id) => { calls.push(`db:${id}`); } },
      now,
    );
    expect(calls.indexOf('s3:old-unused.jpg')).toBeLessThan(calls.indexOf('db:1'));
    expect(calls).not.toContain('db:3');
    expect(res.failed).toEqual([{ key: 'old-in-draft.jpg', error: 'timeout' }]);
  });

  test('dry run reports without touching anything', async () => {
    const touched: string[] = [];
    const res = await runCleanup(planCleanup(media, stories, now), { deleteObject: async (k) => { touched.push(k); } }, { markDeleted: async (id) => { touched.push(id); } }, now, true);
    expect(res.deleted).toEqual(['old-unused.jpg']);
    expect(touched).toEqual([]);
  });
});
