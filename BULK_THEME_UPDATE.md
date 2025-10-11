# Bulk Theme Update Strategy

## Phase 1: Replace Common Patterns Across ALL Components

I'll update the following patterns in all component files:

### Pattern Replacements:
1. `bg-brand-blue` → inline style with `var(--brand-deep-red)` or `.btn-brand-primary`
2. `text-brand-blue` → inline style with `var(--brand-deep-red)`
3. `border-brand-blue` → inline style with `var(--brand-deep-red)`
4. `hover:bg-brand-blue` → hover style with `var(--brand-deep-red-hover)`
5. `text-blue-600` → `var(--brand-deep-red)`
6. `bg-blue-600` → `var(--gradient-primary)` or `var(--brand-deep-red)`

## Remaining Components to Update:
- [ ] VehicleTile.tsx
- [ ] VehicleList.tsx (filters, buttons)
- [ ] Dashboard.tsx (12 references)
- [ ] AdminPanel.tsx (14 references)
- [ ] Login pages (3 files)
- [ ] All Modals (10+ files)
- [ ] Support/Chat components
- [ ] Comparison, NewCars, DealerProfiles
- [ ] Profile, EMICalculator, etc.

## Automated Approach:
Use grep to find patterns, then apply systematic replacements file by file.

