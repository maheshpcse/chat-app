import { Observable, forkJoin, timer } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * Ensures loading UI (shimmer) stays visible for at least `minMs`
 * while the source request runs in parallel (forkJoin).
 * Default 500ms for admin lists/filters; dashboard may pass 1000.
 */
export function withMinLoading<T>(source$: Observable<T>, minMs = 500): Observable<T> {
  return forkJoin([source$, timer(minMs)]).pipe(map(([data]) => data));
}
