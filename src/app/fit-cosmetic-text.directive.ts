import { AfterViewInit, Directive, ElementRef, Input, OnDestroy, inject } from '@angular/core';

/** Fit the complete cosmetic label after layout, text, or font changes. */
@Directive({
  selector: '[fitCosmeticText]',
  standalone: true,
})
export class FitCosmeticTextDirective implements AfterViewInit, OnDestroy {
  @Input() fitCosmeticText = 21;

  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private resizeObserver?: ResizeObserver;
  private mutationObserver?: MutationObserver;
  private frame = 0;

  ngAfterViewInit(): void {
    this.resizeObserver = new ResizeObserver(this.scheduleFit);
    this.resizeObserver.observe(this.element.parentElement!);
    this.mutationObserver = new MutationObserver(this.scheduleFit);
    this.mutationObserver.observe(this.element, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-font'],
    });
    this.element.ownerDocument.fonts?.addEventListener('loadingdone', this.scheduleFit);
    this.scheduleFit();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.mutationObserver?.disconnect();
    this.element.ownerDocument.fonts?.removeEventListener('loadingdone', this.scheduleFit);
    cancelAnimationFrame(this.frame);
  }

  private readonly scheduleFit = (): void => {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.fit());
  };

  private fit(): void {
    const parent = this.element.parentElement;
    if (!parent || !parent.clientWidth || !parent.clientHeight) return;

    const parentStyle = getComputedStyle(parent);
    const textStyle = getComputedStyle(this.element);
    const siblingHeight = Array.from(parent.children)
      .filter((child) => child !== this.element)
      .reduce((height, child) => {
        const style = getComputedStyle(child);
        return (
          height +
          child.getBoundingClientRect().height +
          parseFloat(style.marginTop) +
          parseFloat(style.marginBottom)
        );
      }, 0);
    const availableHeight =
      parent.clientHeight -
      parseFloat(parentStyle.paddingTop) -
      parseFloat(parentStyle.paddingBottom) -
      parseFloat(textStyle.marginTop) -
      parseFloat(textStyle.marginBottom) -
      siblingHeight;
    if (availableHeight <= 0) return;

    let lower = 0;
    let upper = this.fitCosmeticText;
    this.element.style.fontSize = upper + 'px';
    if (this.fits(availableHeight)) return;

    for (let iteration = 0; iteration < 12; iteration++) {
      const size = (lower + upper) / 2;
      this.element.style.fontSize = size + 'px';
      if (this.fits(availableHeight)) lower = size;
      else upper = size;
    }
    this.element.style.fontSize = lower + 'px';
  }

  private fits(availableHeight: number): boolean {
    return (
      this.element.scrollWidth <= this.element.clientWidth &&
      this.element.scrollHeight <= availableHeight
    );
  }
}
