import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { avatarImage, cosmeticImage, isZebraAvatar } from './cosmetic-assets';

/** One display-only resolver for catalog items, legacy saved avatars and currency. */
@Component({
  selector: 'app-cosmetic-icon', standalone: true, imports: [CommonModule],
  template: `<img *ngIf="src && !failed; else emoji" [src]="src" [alt]="decorative ? '' : label" [attr.aria-hidden]="decorative ? 'true' : null" [attr.loading]="lazy ? 'lazy' : 'eager'" decoding="async" [attr.data-skin]="zebra ? 'zebra' : null" (error)="failed=true"><ng-template #emoji><span [attr.aria-label]="decorative ? null : label" [attr.aria-hidden]="decorative ? 'true' : null">{{fallback}}</span></ng-template>`,
  styles: [`:host{display:inline-flex;align-items:center;justify-content:center;vertical-align:-.13em;flex:none;line-height:1}:host img{display:block;width:100%;height:100%;object-fit:contain}:host span{line-height:1}:host(.token-icon){width:1em;height:1em;vertical-align:-.13em}:host(.feed-icon){width:2.2em;height:2.2em}:host(.art-icon){width:min(95px,85%);height:min(95px,85%)}:host(.theme-art){width:min(122px,96%);height:min(122px,96%)}:host(.theme-art) img{border-radius:10px}:host(.avatar-icon){width:100%;height:100%}:host(.reward-icon){width:1em;height:1em}:host img[data-skin="zebra"]{filter:grayscale(1) brightness(2) contrast(1.4)}`]
})
export class CosmeticIconComponent {
  private key = '';
  @Input() set id(value: string | null | undefined) { this.key=value || ''; this.failed=false; }
  @Input() avatar=false;
  @Input() fallback='';
  @Input() label='';
  @Input() decorative=true;
  @Input() lazy=true;
  failed=false;
  get src():string|null { return this.avatar ? avatarImage(this.key) : cosmeticImage(this.key); }
  get zebra():boolean { return this.avatar && isZebraAvatar(this.key); }
}
