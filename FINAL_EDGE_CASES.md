# Final Edge Cases - Last 3% to 100%

## Remaining Blue Color Variants

The following variant classes still exist (46 matches in 16 files):

### Variants to Replace:
- `text-brand-blue-light` → `var(--brand-rose-pink)` or `var(--brand-orange)`
- `text-brand-blue-dark` → `var(--brand-deep-red-dark)`
- `bg-brand-blue-light` → `var(--brand-deep-red-light)` or `var(--brand-rose-pink-light)`
- `bg-brand-blue-dark` → `var(--brand-deep-red-dark)`
- `bg-brand-blue-lightest` → `var(--brand-rose-pink-light)`
- `ring-brand-blue` → `var(--brand-deep-red)`
- `focus:ring-brand-blue` → inline focus handlers
- `hover:text-brand-blue` → onMouseEnter/Leave handlers
- `hover:bg-brand-blue` → onMouseEnter/Leave handlers

## Files Needing Final Cleanup:
1. AdminPanel.tsx - 20 references (variants)
2. VehicleList.tsx - 6 references (focus rings, hovers)
3. Dashboard.tsx - 2 references (variants)
4. Home.tsx - 4 references (check remaining)
5. Comparison.tsx - 2 references (edge cases)
6. ReadReceiptIcon, UserManagement, AiAssistant, etc.

These are primarily:
- `-light` and `-dark` suffixes
- `hover:` and `focus:` prefixes
- `ring-` utilities

## Action Plan:
Replace all these systematically to achieve TRUE 100% coverage.

