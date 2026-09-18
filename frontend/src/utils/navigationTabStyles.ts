import { MdNavigationTab } from '@material/web/labs/navigationtab/navigation-tab.js';
import { css } from 'lit';

/**
 * Custom styles for md-navigation-tab to constrain the ripple effect
 * strictly to the icon active-indicator pill shape (64x32 rounded pill)
 * instead of spreading across the entire half of the navigation bar,
 * while keeping the button tap target full-size.
 */
const navTabRipplePillStyle = css`
  .md3-navigation-tab__ripple {
    position: absolute;
    top: 12px;
    bottom: auto;
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    width: var(--_active-indicator-width, 64px);
    height: var(--_active-indicator-height, 32px);
    border-radius: var(--_active-indicator-shape, var(--md-sys-shape-corner-full, 9999px));
    overflow: hidden;
  }

  .md3-navigation-tab__icon--active ::slotted(*) {
    font-variation-settings: 'FILL' 1;
  }
`;

let configured = false;
export function configureNavigationTabStyles(): void {
  if (configured) return;
  configured = true;

  const tabClass = MdNavigationTab as any;
  if (Array.isArray(tabClass.elementStyles)) {
    if (!tabClass.elementStyles.includes(navTabRipplePillStyle)) {
      tabClass.elementStyles.push(navTabRipplePillStyle);
    }
  }
  if (Array.isArray(tabClass.styles)) {
    if (!tabClass.styles.includes(navTabRipplePillStyle)) {
      tabClass.styles.push(navTabRipplePillStyle);
    }
  }
}

// Automatically configure upon module import
configureNavigationTabStyles();
