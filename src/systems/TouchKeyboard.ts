export class TouchKeyboard {
  private static initialized = false;

  static init() {
    if (TouchKeyboard.initialized) return;
    TouchKeyboard.initialized = true;

    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const noHover = window.matchMedia('(hover: none)').matches;
    const isTouch = coarse || (noHover && navigator.maxTouchPoints > 0);
    document.documentElement.classList.toggle('touch', isTouch);
    if (!isTouch) return;

    document.addEventListener('pointerdown', (e) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest) return;
      const keyEl = target.closest('[data-key]') as HTMLElement | null;
      if (!keyEl) return;
      e.preventDefault();
      const key = keyEl.getAttribute('data-key') ?? '';
      if (!key) return;
      TouchKeyboard.flash(keyEl);
      document.dispatchEvent(new KeyboardEvent('keydown', { key }));
    });
  }

  static enabled(): boolean {
    return document.documentElement.classList.contains('touch');
  }

  private static flash(keyEl: HTMLElement) {
    keyEl.classList.remove('tk-pressed');
    void keyEl.offsetWidth;
    keyEl.classList.add('tk-pressed');
    window.setTimeout(() => keyEl.classList.remove('tk-pressed'), 120);
  }
}