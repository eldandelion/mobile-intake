import type { MdDialog } from '@material/web/dialog/dialog';

/**
 * Ensures the dialog's shadowRoot scrim has an elevated z-index (z-30)
 * so it dims all positioned elements (including sticky top app bar and fixed bottom nav bar which have z-20).
 */
function elevateDialogScrim(dialog: MdDialog): void {
  if ((dialog as any).__scrimElevated) return;
  (dialog as any).__scrimElevated = true;

  const applyStyles = () => {
    const root = dialog.shadowRoot;
    if (!root) return;

    if (!root.querySelector('style[data-scrim-elevate]')) {
      const style = document.createElement('style');
      style.setAttribute('data-scrim-elevate', 'true');
      style.textContent = `
        .scrim {
          z-index: 30 !important;
        }
      `;
      root.appendChild(style);
    }

    const scrim = root.querySelector('.scrim') as HTMLElement | null;
    if (scrim) {
      scrim.style.setProperty('z-index', '30', 'important');
    }
  };

  applyStyles();

  if ('updateComplete' in dialog && typeof (dialog as any).updateComplete?.then === 'function') {
    (dialog as any).updateComplete.then(applyStyles);
  }

  dialog.addEventListener('open', applyStyles);
}

/**
 * Customizes an MdDialog's animation so it appears directly from
 * the center (scaling 0.92 -> 1) rather than sliding down from the top,
 * and elevates its backdrop scrim z-index so it dims top and bottom bars.
 */
export function setCenteredDialogAnimation(dialog: MdDialog | null | undefined): void {
  if (!dialog) return;

  elevateDialogScrim(dialog);

  dialog.getOpenAnimation = () => ({
    dialog: [
      [
        [{ transform: 'scale(0.92)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 200, easing: 'cubic-bezier(0.05, 0.7, 0.1, 1)' },
      ],
    ],
    scrim: [
      [
        [{ opacity: 0 }, { opacity: 0.32 }],
        { duration: 200, easing: 'linear' },
      ],
    ],
  });

  dialog.getCloseAnimation = () => ({
    dialog: [
      [
        [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0.92)', opacity: 0 }],
        { duration: 150, easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)' },
      ],
    ],
    scrim: [
      [
        [{ opacity: 0.32 }, { opacity: 0 }],
        { duration: 150, easing: 'linear' },
      ],
    ],
  });
}

