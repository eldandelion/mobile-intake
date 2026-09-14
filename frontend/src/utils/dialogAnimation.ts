import type { MdDialog } from '@material/web/dialog/dialog';

/**
 * Customizes an MdDialog's animation so it appears directly from
 * the center (scaling 0.92 -> 1) rather than sliding down from the top.
 */
export function setCenteredDialogAnimation(dialog: MdDialog | null | undefined): void {
  if (!dialog) return;

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
