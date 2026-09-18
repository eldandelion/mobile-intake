import { describe, it, expect } from 'vitest';
import { MdNavigationTab } from '@material/web/labs/navigationtab/navigation-tab.js';
import { configureNavigationTabStyles } from './navigationTabStyles';

describe('navigationTabStyles', () => {
  it('injects ripple pill styles into MdNavigationTab', () => {
    configureNavigationTabStyles();
    const tabClass = MdNavigationTab as any;
    const styles = tabClass.elementStyles || tabClass.styles;
    expect(styles).toBeDefined();

    // Check that at least one style contains the ripple pill rules
    const hasPillStyle = styles.some((s: any) => {
      const text = s?.cssText || s?.toString?.() || '';
      return text.includes('.md3-navigation-tab__ripple') && text.includes('transform: translateX(-50%)');
    });
    expect(hasPillStyle).toBe(true);
  });

  it('injects filled style for active-icon into MdNavigationTab', () => {
    configureNavigationTabStyles();
    const tabClass = MdNavigationTab as any;
    const styles = tabClass.elementStyles || tabClass.styles;
    expect(styles).toBeDefined();

    const hasFilledActiveStyle = styles.some((s: any) => {
      const text = s?.cssText || s?.toString?.() || '';
      return text.includes('.md3-navigation-tab__icon--active') && text.includes("'FILL' 1");
    });
    expect(hasFilledActiveStyle).toBe(true);
  });
});
