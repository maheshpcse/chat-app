import { trigger, transition } from '@angular/animations';

/**
 * routeSlideAnimation - No-op. Keep name for templates; never set opacity.
 */
export const routeSlideAnimation = trigger('routeSlide', [
  transition('* <=> *', [])
]);
