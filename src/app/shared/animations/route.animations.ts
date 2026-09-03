import { trigger, transition, style, query, animate } from '@angular/animations';

/**
 * routeSlideAnimation - Safe page fade/slide.
 *
 * Avoids position:absolute on :enter/:leave (that collapsed host height and
 * left pages blank when animation timing threw startTime errors).
 * Enter-only fade keeps layout flow stable on nested outlets.
 */
export const routeSlideAnimation = trigger('routeSlide', [
  transition('* <=> *', [
    query(
      ':enter',
      [
        style({ opacity: 0, transform: 'translateX(16px)' }),
        animate(
          '220ms ease-out',
          style({ opacity: 1, transform: 'translateX(0)' })
        )
      ],
      { optional: true }
    )
  ])
]);
