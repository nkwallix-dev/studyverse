import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { avatarImage, cosmeticImage } from './cosmetic-assets';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Dein Universum.');
    expect(compiled.querySelector('.top-pill.token img')?.getAttribute('src')).toBe('cosmetics/currency/tasty_token.png');
  });

  it('keeps legacy avatars and Kenny skins separate', () => {
    expect(avatarImage('🐟')).toBe('cosmetics/avatars/laborfish_avatar.png');
    expect(avatarImage('kenny_avatar_zebra')).toBe('kenny/kenny-avatar.png');
    expect(cosmeticImage('kenny_skin_zebra')).toBeNull();
  });
});
