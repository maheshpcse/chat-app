/**
 * Admin console preferences (browser-local).
 * No dedicated BE preferences endpoint/schema exists yet — persist in localStorage
 * and apply across Admin Users + Data Studio pages.
 */

export const ADMIN_CONSOLE_PREFS_KEY = 'admin_console_prefs';

export interface IAdminConsolePrefs {
  denseTables: boolean;
  confirmBeforeSave: boolean;
  defaultFakerCount: number;
}

export const DEFAULT_ADMIN_CONSOLE_PREFS: IAdminConsolePrefs = {
  denseTables: true,
  confirmBeforeSave: true,
  defaultFakerCount: 10
};

export function readAdminConsolePrefs(): IAdminConsolePrefs {
  try {
    const raw = localStorage.getItem(ADMIN_CONSOLE_PREFS_KEY);
    if (!raw) {
      return { ...DEFAULT_ADMIN_CONSOLE_PREFS };
    }
    const p = JSON.parse(raw) || {};
    const count = Number(p.defaultFakerCount);
    return {
      denseTables: typeof p.denseTables === 'boolean'
        ? p.denseTables
        : DEFAULT_ADMIN_CONSOLE_PREFS.denseTables,
      confirmBeforeSave: typeof p.confirmBeforeSave === 'boolean'
        ? p.confirmBeforeSave
        : DEFAULT_ADMIN_CONSOLE_PREFS.confirmBeforeSave,
      defaultFakerCount: [5, 10, 20, 50].indexOf(count) >= 0
        ? count
        : DEFAULT_ADMIN_CONSOLE_PREFS.defaultFakerCount
    };
  } catch {
    return { ...DEFAULT_ADMIN_CONSOLE_PREFS };
  }
}

export function writeAdminConsolePrefs(prefs: Partial<IAdminConsolePrefs>): IAdminConsolePrefs {
  const next: IAdminConsolePrefs = {
    ...readAdminConsolePrefs(),
    ...prefs
  };
  localStorage.setItem(ADMIN_CONSOLE_PREFS_KEY, JSON.stringify(next));
  return next;
}
