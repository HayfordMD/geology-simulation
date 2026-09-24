// High-performance rich tooltip manager for GeoGenesis 3D

export class TooltipManager {
  constructor() {
    this.tooltipEl = null;
    this.titleEl = null;
    this.textEl = null;
    this.activeTarget = null;

    this.initDOM();
    this.bindEvents();
  }

  initDOM() {
    this.tooltipEl = document.createElement('div');
    this.tooltipEl.id = 'geo-tooltip';
    this.tooltipEl.className = 'geo-tooltip glass';

    this.titleEl = document.createElement('div');
    this.titleEl.className = 'tooltip-title';

    this.textEl = document.createElement('div');
    this.textEl.className = 'tooltip-text';

    this.tooltipEl.appendChild(this.titleEl);
    this.tooltipEl.appendChild(this.textEl);
    document.body.appendChild(this.tooltipEl);
  }

  bindEvents() {
    document.addEventListener('pointerover', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target) {
        this.show(target, e);
      }
    });

    document.addEventListener('pointerout', (e) => {
      const target = e.target.closest('[data-tooltip]');
      if (target && target === this.activeTarget) {
        this.hide();
      }
    });

    document.addEventListener('pointermove', (e) => {
      if (this.activeTarget) {
        this.position(e.clientX, e.clientY);
      }
    });
  }

  show(target, event) {
    this.activeTarget = target;
    const text = target.getAttribute('data-tooltip');
    const title = target.getAttribute('data-tooltip-title');

    if (!text && !title) return;

    if (title) {
      this.titleEl.textContent = title;
      this.titleEl.style.display = 'block';
    } else {
      this.titleEl.style.display = 'none';
    }

    this.textEl.textContent = text;
    this.tooltipEl.classList.add('visible');

    this.position(event.clientX, event.clientY);
  }

  position(mouseX, mouseY) {
    if (!this.tooltipEl) return;

    const offset = 14;
    let x = mouseX + offset;
    let y = mouseY + offset;

    const rect = this.tooltipEl.getBoundingClientRect();
    const winW = window.innerWidth;
    const winH = window.innerHeight;

    // Flip horizontally if overflow
    if (x + rect.width > winW - 12) {
      x = mouseX - rect.width - offset;
    }
    // Flip vertically if overflow
    if (y + rect.height > winH - 12) {
      y = mouseY - rect.height - offset;
    }

    this.tooltipEl.style.left = `${Math.max(10, x)}px`;
    this.tooltipEl.style.top = `${Math.max(10, y)}px`;
  }

  hide() {
    this.activeTarget = null;
    if (this.tooltipEl) {
      this.tooltipEl.classList.remove('visible');
    }
  }
}
