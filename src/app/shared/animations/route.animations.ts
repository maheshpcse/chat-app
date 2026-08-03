import { trigger, transition, style, query, animate, group } from '@angular/animations';

/**
 * routeSlideAnimation - Global page-transition animation.
 *
 * On every route change the leaving page fades/slides out to the left while
 * the entering page fades/slides in from the right.
 * Used on root outlet and nested layout outlets (app / chat / admin).
 *
 * Angular 10 compatible (@angular/animations).
 */
export const routeSlideAnimation = trigger('routeSlide', [
  transition('* <=> *', [
    // Overlay both pages during the transition so they cross-fade in place.
    query(':enter, :leave', [
      style({ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' })
    ], { optional: true }),

    query(':enter', [style({ opacity: 0, transform: 'translateX(28px)' })], { optional: true }),

    group([
      query(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'translateX(-28px)' }))
      ], { optional: true }),
      query(':enter', [
        animate('260ms 60ms ease-out', style({ opacity: 1, transform: 'translateX(0)' }))
      ], { optional: true })
    ])
  ])
]);
