import { logInfo } from '../../utils/logger.js';

export type DashboardNotifyFn = (
  message: string,
  type?: 'success' | 'error' | 'info' | 'warning',
) => void;

export function dashboardNotify(
  onNotify: DashboardNotifyFn | undefined,
  message: string,
  type: 'success' | 'error' | 'info' | 'warning' = 'info',
) {
  if (onNotify) {
    onNotify(message, type);
    return;
  }
  if (type === 'error') console.error(message);
  else logInfo(message);
}
