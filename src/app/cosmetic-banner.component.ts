import { Component, Input } from '@angular/core';

const BANNER_PREVIEWS = new Set([
  'gold',
  'warning',
  'galaxy',
  'molecule',
  'flow',
  'curve',
  'cloud',
  'solitaire',
  'pink_paradise',
  'parallel_pulse',
  'kenny_volcano',
  'maths_curve',
  'maths_integral',
]);

/** Still images of the actual Studyverse dashboard banners. */
@Component({
  selector: 'app-cosmetic-banner',
  standalone: true,
  template: '<img [src]="source" [alt]="label" [attr.loading]="loading" decoding="async" />',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        border-radius: inherit;
        overflow: hidden;
      }

      img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: right center;
        border-radius: inherit;
      }
    `,
  ],
})
export class CosmeticBannerComponent {
  @Input() banner: string | null | undefined;
  @Input() label = '';
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  get source(): string {
    const key = this.banner && BANNER_PREVIEWS.has(this.banner) ? this.banner : 'default';
    return 'cosmetics/banners/' + key + (key.startsWith('maths_') ? '.svg' : '.webp');
  }
}
