import { describe, it, expect } from 'vitest';
import { setCenteredDialogAnimation } from './dialogAnimation';
import type { MdDialog } from '@material/web/dialog/dialog';

describe('dialogAnimation', () => {
  it('configures centered open and close animations and elevates scrim z-index', () => {
    // Create a mock dialog element with shadowRoot
    const dialogEl = document.createElement('div') as unknown as MdDialog;
    const shadowRoot = dialogEl.attachShadow({ mode: 'open' });
    const scrimEl = document.createElement('div');
    scrimEl.className = 'scrim';
    shadowRoot.appendChild(scrimEl);

    setCenteredDialogAnimation(dialogEl);

    // Verify animations configured
    expect(typeof dialogEl.getOpenAnimation).toBe('function');
    expect(typeof dialogEl.getCloseAnimation).toBe('function');

    const openAnim = dialogEl.getOpenAnimation!();
    expect(openAnim.dialog).toBeDefined();
    expect(openAnim.scrim).toBeDefined();

    // Verify style element injected into shadowRoot elevating scrim z-index to 30
    const styleEl = shadowRoot.querySelector('style[data-scrim-elevate]');
    expect(styleEl).not.toBeNull();
    expect(styleEl?.textContent).toContain('z-index: 30 !important');

    // Verify direct style property set on .scrim element
    expect(scrimEl.style.getPropertyValue('z-index')).toBe('30');
  });

  it('handles null or undefined gracefully without throwing', () => {
    expect(() => setCenteredDialogAnimation(null)).not.toThrow();
    expect(() => setCenteredDialogAnimation(undefined)).not.toThrow();
  });
});
