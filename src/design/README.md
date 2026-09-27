# Sharabara Modern — design system

Warm paper · ink · gold seal. All components live here and are re-exported from `@/design`.

- Tokens are CSS variables in `src/index.css`; JS copies for charts in `tokens.ts` (`CHART`, `chartTheme`).
- Motion: `SPRING` (420/34) from `@/lib/utils`; pressed scale .97; `useReducedMotion` → plain fades.
- Icons: lucide only, `strokeWidth 1.75`. `<Icon name="shield-check" />` resolves kebab names; `CATEGORY_ICONS` for the 8 root categories.
- Phone surfaces: wrap screens in `<PhoneFrame>`; `usePhoneContainer()` gives the `#phone-screen` element to pass as `container` to `BottomSheet`, `Modal`, `Toaster`. `toast.push()` shows an iOS-style banner via `DynamicIslandPush` (rendered by PhoneFrame).
- Text: every visible string is a prop; defaults come from `@/i18n/uz` where a sensible one exists.
