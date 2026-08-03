import { Observable, forkJoin, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/** Dashboard full-page / multi-widget first paint */
export const MIN_LOADING_DASHBOARD_MS = 1000;

/** Standard user pages (contacts, notifications, lists) */
export const MIN_LOADING_PAGE_MS = 500;

/**
 * Keep loading UI visible at least `minMs` while `source$` runs.
 * Default 500ms for non-dashboard user pages.
 */
export function withMinLoading<T>(source$: Observable<T>, minMs = MIN_LOADING_PAGE_MS): Observable<T> {
  return forkJoin([source$, timer(minMs)]).pipe(map(([data]) => data));
}
