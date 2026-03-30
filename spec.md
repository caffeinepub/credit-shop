# Credit Shop

## Current State
CSV import tries to push products into the backend via addProduct calls. Unreliable for large files (10k+ rows).

## Requested Changes (Diff)

### Add
- `useCSVProducts` hook: reads parsed product data from localStorage key `csvProductsData`
- CSV storage utility: save/load/clear CSV product data from localStorage
- CSV status banner in ProductsScreen: shows row count, Replace and Clear buttons
- Unified barcode lookup: checks backend products first, then CSV products

### Modify
- ProductsScreen CSV flow: remove import dialog and all backend calls. Uploading CSV parses and saves to localStorage. Show toast with count and banner.
- ProductsScreen product list: show CSV products in search results with a subtle CSV badge.
- BatchUdhaarScreen barcode lookup: search both backend products and CSV products when scanning or doing manual add.

### Remove
- CSV import dialog, progress bar, duplicate handling UI
- All addProduct import loop code

## Implementation Plan
1. Create `src/frontend/src/utils/csvStorage.ts` with saveCSVProducts, loadCSVProducts, clearCSVProducts
2. Create `src/frontend/src/hooks/useCSVProducts.ts` hook
3. Update ProductsScreen.tsx: remove import dialog, add CSV banner, merge CSV into product list with CSV badge
4. Update BatchUdhaarScreen.tsx: use CSV products as fallback in barcode lookup
