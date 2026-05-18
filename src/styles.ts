/**
 * Stylesheets shared across both custom elements via adoptedStyleSheets.
 *
 * CSS lives in plain `.css` files under `./styles/` so editors give full
 * language support (highlighting, autocomplete, Prettier). Bun's bundler
 * inlines the file contents as strings via the `with { type: 'text' }`
 * import attribute; we then wrap each in a CSSStyleSheet at runtime.
 *
 * Two scopes:
 *   - toaster.css: positioning, theme palettes, dir-based vars (cascades into
 *                  child shadow trees via inherited custom properties).
 *   - toast.css:   per-toast layout, animations, swipe, rich colors (reads
 *                  the inherited theme vars set by the toaster).
 */

import toasterCss from './styles/toaster.css' with { type: 'text' };
import toastCss from './styles/toast.css' with { type: 'text' };

let toasterSheet: CSSStyleSheet | null = null;
let toastSheet: CSSStyleSheet | null = null;

export function getToasterSheet(): CSSStyleSheet {
  if (!toasterSheet) {
    toasterSheet = new CSSStyleSheet();
    toasterSheet.replaceSync(toasterCss);
  }
  return toasterSheet;
}

export function getToastSheet(): CSSStyleSheet {
  if (!toastSheet) {
    toastSheet = new CSSStyleSheet();
    toastSheet.replaceSync(toastCss);
  }
  return toastSheet;
}
