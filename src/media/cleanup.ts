// "Images should delete after 30 days" — done safely.
// Deleting an image that a published story still uses breaks the live page AND every email
// already sent (they hot-link the same file). So only unreferenced media is deleted, the file
// is removed from storage before the database row, and a failed run can simply be re-run.

export interface Media { id: string; key: string; uploadedAt: Date; deletedAt?: Date | null }
export interface StoryRef { id: string; status: 'draft' | 'published'; mediaKeys: string[] }

export interface CleanupPolicy {
  days: number;
  /** Protect images used only by drafts too (recommended until the client decides). */
  protectDrafts: boolean;
}

export const DEFAULT_POLICY: CleanupPolicy = { days: 30, protectDrafts: true };

export interface Plan { delete: Media[]; keptInUse: Media[] }

export function planCleanup(media: Media[], stories: StoryRef[], now: Date, policy = DEFAULT_POLICY): Plan {
  const cutoff = now.getTime() - policy.days * 24 * 60 * 60 * 1000;
  const inUse = new Set(
    stories.filter((s) => s.status === 'published' || policy.protectDrafts).flatMap((s) => s.mediaKeys),
  );
  const old = media.filter((m) => !m.deletedAt && m.uploadedAt.getTime() < cutoff);
  return {
    delete: old.filter((m) => !inUse.has(m.key)),
    keptInUse: old.filter((m) => inUse.has(m.key)),
  };
}

export interface Storage { deleteObject(key: string): Promise<void> }
export interface MediaRepo { markDeleted(id: string, at: Date): Promise<void> }

export interface Result { deleted: string[]; failed: { key: string; error: string }[]; keptInUse: string[] }

/** Executes a plan. Storage first, then the DB row, so a crash never leaves a row pointing at nothing it thinks exists. */
export async function runCleanup(plan: Plan, storage: Storage, repo: MediaRepo, now: Date, dryRun = false): Promise<Result> {
  const out: Result = { deleted: [], failed: [], keptInUse: plan.keptInUse.map((m) => m.key) };
  for (const m of plan.delete) {
    if (dryRun) { out.deleted.push(m.key); continue; }
    try {
      await storage.deleteObject(m.key); // S3 DeleteObject is idempotent: a retry after a crash is safe
      await repo.markDeleted(m.id, now);
      out.deleted.push(m.key);
    } catch (e) {
      out.failed.push({ key: m.key, error: e instanceof Error ? e.message : String(e) });
    }
  }
  return out;
}
