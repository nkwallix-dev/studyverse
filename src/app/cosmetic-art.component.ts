import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopItem } from './shop-items';
import { CosmeticBannerComponent } from './cosmetic-banner.component';
import { CosmeticIconComponent } from './cosmetic-icon.component';
import { FitCosmeticTextDirective } from './fit-cosmetic-text.directive';

/** Catalog thumbnail: supplied art, or a miniature of the actual CSS cosmetic. */
@Component({
  selector: 'app-cosmetic-art',
  standalone: true,
  imports: [CommonModule, CosmeticIconComponent, CosmeticBannerComponent, FitCosmeticTextDirective],
  template: `<div
    class="item-art drop-item-art"
    [class.avatar-art]="item.group === 'avatar'"
    [class.panda-art]="item.id === 'dsai_panda'"
    [style.background]="item.bg || null"
  >
    <ng-container *ngIf="item.group === 'frame'; else atmosphere">
      <div class="universe shop-live-stage miniature" [attr.data-frame]="item.equip || item.id">
        <div class="stat shop-frame-card">
          <span>✦</span><b>{{ item.name }}</b>
        </div>
      </div>
    </ng-container>
    <ng-template #atmosphere
      ><ng-container *ngIf="item.group === 'atm'; else effect">
        <div
          class="universe shop-live-stage miniature atmosphere"
          [attr.data-atm]="item.equip || item.id"
        >
          <span>✦</span>
        </div>
      </ng-container></ng-template
    >
    <ng-template #effect
      ><ng-container *ngIf="item.group === 'fx'; else artwork">
        <div
          class="universe shop-live-stage miniature effect"
          [attr.data-fx]="item.equip || item.id"
        >
          <div class="shop-live-fx" aria-hidden="true">
            <span *ngFor="let n of particles" [style.--particle-index]="n"
              ><app-cosmetic-icon
                *ngIf="item.id === 'effect_coinrain'; else effectEmoji"
                id="tasty_token"
                fallback="🪙"
                class="token-icon"
              /><ng-template #effectEmoji>{{ item.icon }}</ng-template></span
            >
          </div>
        </div>
      </ng-container></ng-template
    >
    <ng-template #artwork>
      @if (item.group === 'title' || item.group === 'font') {
        <span
          class="cosmetic-text"
          [fitCosmeticText]="21"
          [attr.data-font]="item.group === 'font' ? item.equip || item.id : equippedFont"
          >{{ item.group === 'title' ? item.name : equippedTitle }}</span
        >
      } @else {
        <app-cosmetic-banner
          *ngIf="item.group === 'banner'; else iconArtwork"
          [banner]="item.equip"
          [label]="item.name"
        />
        <ng-template #iconArtwork>
          <app-cosmetic-icon
            [id]="item.id"
            [fallback]="item.icon"
            [label]="item.name"
            [decorative]="false"
            class="art-icon"
            [class.theme-art]="item.group === 'theme'"
          />
        </ng-template>
      }
    </ng-template>
  </div>`,
  styles: [
    `
      :host {
        display: contents;
      }
      .miniature.universe {
        width: 100%;
        height: 100%;
        min-height: 0 !important;
        display: grid !important;
        place-items: center;
        overflow: hidden;
        border: 0;
        border-radius: inherit;
        isolation: isolate;
        margin: 0 !important;
      }
      .miniature .shop-frame-card {
        width: 78%;
        min-height: 68% !important;
        height: auto !important;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 12px;
        background: #20253f;
        padding: 7px !important;
        font-size: 12px;
        text-align: center;
      }
      .miniature .shop-frame-card span {
        font-size: 20px;
      }
      .miniature.atmosphere {
        background-color: #101a30;
      }
      .miniature.atmosphere > span {
        font-size: 36px;
        color: #d7d4ff;
        text-shadow: 0 0 14px #bdb0ff;
      }
      .miniature.effect {
        background: linear-gradient(135deg, #17112d, #31315c);
      }
      :host(.theme-art) {
        width: min(122px, 96%);
        height: min(122px, 96%);
      }
      @media (prefers-reduced-motion: reduce) {
        .miniature,
        .miniature * {
          animation: none !important;
        }
      }
    `,
  ],
})
export class CosmeticArtComponent {
  @Input({ required: true }) item!: ShopItem;
  @Input() equippedTitle = 'Weltenentdecker';
  @Input() equippedFont = 'standard';
  readonly particles = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
}
