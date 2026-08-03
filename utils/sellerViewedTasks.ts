/** Session-scoped seller task IDs dismissed after viewing (informational tasks). */

const STORAGE_KEY = 'reride_seller_viewed_tasks';

function readIds(): Set<string> {
  try {
    if (typeof sessionStorage === 'undefined') return new Set();
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((id) => String(id)).filter(Boolean));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  try {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Informational tasks: opening/viewing clears them from the Hot leads badge for this session. */
export const VIEW_DISMISSIBLE_TASK_TYPES = new Set(['confirm_test_drive']);

export function getViewedSellerTaskIds(): Set<string> {
  return readIds();
}

export function markSellerTaskViewed(taskId: string): void {
  if (!taskId) return;
  const ids = readIds();
  if (ids.has(taskId)) return;
  ids.add(String(taskId));
  writeIds(ids);
}

export function countActionableSellerTasks(
  tasks: Array<{ id: string; type: string }> | null | undefined,
  pendingInterestCount = 0,
): number {
  const list = Array.isArray(tasks) ? tasks : [];
  const viewed = readIds();
  const remaining = list.filter((task) => {
    if (!task?.id) return false;
    if (VIEW_DISMISSIBLE_TASK_TYPES.has(task.type) && viewed.has(String(task.id))) {
      return false;
    }
    return true;
  }).length;
  if (remaining > 0) return remaining;
  return pendingInterestCount > 0 ? pendingInterestCount : 0;
}
