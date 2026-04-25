# Audit — Lighthouse Score > 95 Tasks

**Goal**: Achieve Lighthouse > 95 on Accessibility, Performance, and Best Practices  
**Audit Score**: 6/16 (Poor — major overhaul needed)  
**Scope**: Accessibility · Performance · Theming · Anti-Patterns (Responsiveness excluded)

---

## Phase 1 — Accessibility (Lighthouse A11y > 95)

### P0 — Blocking

- [ ] **A-01** Add `aria-label` to all icon-only buttons (no visible text)
  - `ChainCanvas.tsx`, `TabBar.tsx`, `NodeDetailsPanel.tsx`, toolbar buttons throughout
  - Pattern: `<button aria-label="Delete node">` or icon with `aria-hidden="true"` + visually-hidden label span

- [ ] **A-02** Replace `div` + `onClick` with semantic `<button>` elements
  - `ChainNode.tsx`, `DisplayNode.tsx`, `ConditionNode.tsx`, canvas click handlers
  - If layout prevents it: add `role="button" tabIndex={0} onKeyDown={handleKeyDown}`

- [ ] **A-03** Add `alt` text to all `<img>` / Next.js `<Image>` elements
  - `HubProviderCard.tsx:61` + scan all other image usages
  - Descriptive `alt` for informational images; `alt=""` for decorative

- [ ] **A-04** Associate all form inputs with `<label>` elements
  - `ArrowConfigPanel.tsx`, `NodeDetailsPanel.tsx`, settings forms
  - Pattern: `<label htmlFor="field-id">` or `aria-label` directly on input

- [ ] **A-05** Add semantic landmark roles to root layout
  - `src/app/layout.tsx`
  - Add `<main>`, `<nav>`, `<header>`, `<footer>` elements (or `role=` attributes)

### P1 — Major

- [ ] **A-06** Fix heading hierarchy — no skipped levels (H1→H2→H3)
  - Audit all `src/app/**/page.tsx` files
  - Ensure exactly one `<h1>` per page; use `<h2>`/`<h3>` for sub-sections

- [ ] **A-07** Add visible focus indicators to all interactive elements
  - Custom canvas nodes, buttons without shadcn wrapper
  - Add `focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none` via Tailwind

- [ ] **A-08** Add keyboard navigation to `ChainCanvas` (React Flow)
  - `ChainCanvas.tsx` + all custom node components
  - Arrow keys to move between nodes, Enter to select, Escape to deselect

- [ ] **A-09** Add ARIA state attributes to all dropdown/popover triggers
  - `TabListDropdown.tsx`, `ValuePickerPopover.tsx`, panel toggle buttons
  - Wire `aria-expanded`, `aria-controls`, `aria-haspopup` to open/close state

- [ ] **A-10** Add `role="status"` / `aria-live` to loading and error states
  - Response panels, any async operation feedback UI
  - Pattern: `<div role="status" aria-live="polite">Loading...</div>`

---

## Phase 2 — Performance (Lighthouse Perf > 95)

### P0 — Blocking

- [ ] **P-01** Add missing `key` props to all `.map()` calls
  - `TimingWaterfall.tsx:90, 128`
  - `TabListDropdown.tsx:93`
  - `TabBar.tsx:109`
  - `ConditionNode.tsx:147`
  - `ArrowConfigPanel.tsx:407, 640`
  - Use stable unique IDs — never array index

- [ ] **P-02** Wrap all JSON.parse/stringify calls in `useMemo`
  - `ArrowConfigPanel.tsx:110, 190, 790-791`
  - `NodeDetailsPanel.tsx:201`
  - `ValuePickerPopover.tsx:29, 49`
  - `PrettyViewer.tsx:27, 38`
  - `TransformPage.tsx:54, 96-97`
  - Pattern: `const parsed = useMemo(() => JSON.parse(value), [value])`

### P1 — Major

- [ ] **P-03** Split `ChainCanvas.tsx` (986 lines) into subcomponents
  - Extract: toolbar, minimap controls, node palette, edge config panel
  - Lazy-load non-critical panels with `React.lazy` + `Suspense`

- [ ] **P-04** Split `chain/[collectionId]/page.tsx` (903 lines) into subcomponents
  - Extract: sidebar, runner panel, result viewer, page header
  - Each subcomponent in its own file

- [ ] **P-05** Split `ArrowConfigPanel.tsx` (810 lines) into subcomponents
  - Extract each config section (conditions, transforms, headers) as a dedicated component

- [ ] **P-06** Add `React.memo` to all pure child components
  - `ChainNode.tsx`, `DisplayNode.tsx`, `ConditionNode.tsx`, icon components, badge components
  - Pattern: `export default React.memo(ChainNode)`

- [ ] **P-07** Add `useCallback` to all event handlers passed as props
  - `ArrowConfigPanel.tsx` (0 useCallback), all node components
  - Wrap handlers in `useCallback` with correct dependency arrays

- [ ] **P-08** Replace `transition-all` with specific property transitions
  - Global pattern across Tailwind classNames throughout codebase
  - Replace with `transition-colors`, `transition-opacity`, or `transition-transform`

- [ ] **P-09** Implement `@tanstack/react-virtual` for long lists
  - Library already installed but unused
  - `TimingWaterfall.tsx`, `CollectionTree` (if large)
  - Wrap list rendering with `useVirtualizer` hook

### P2 — Minor

- [ ] **P-10** Lazy-load CodeMirror language packs on demand
  - `@codemirror/lang-javascript`, `lang-python`, `lang-java`, `lang-php`, `lang-json`
  - Dynamic `import()` each language pack based on detected content type

- [ ] **P-11** Add `loading="lazy"` and explicit dimensions to all images
  - `HubProviderCard.tsx:61` + any future image usages
  - Pattern: `<Image src={...} alt="..." width={64} height={64} loading="lazy" />`

- [ ] **P-12** Audit and remove unused `package.json` dependencies
  - Run `bun x depcheck` to identify unused packages
  - Evaluate if `dagre` (0.8.5) can be replaced with a lighter layout utility

---

## Phase 3 — Theming & Light Mode

### P0 — Blocking

- [ ] **T-01** Replace all hardcoded hex colors in `ChainCanvas.tsx` with CSS variables
  - 22+ instances: `#7c3aed`, `#ef4444`, `#10b981`, and others
  - Define semantic tokens in `globals.css`: `--color-node-success`, `--color-node-error`, `--color-node-pending`, etc.
  - Reference via `var(--color-node-success)` in inline styles or Tailwind arbitrary values

- [ ] **T-02** Add dark mode CSS variables for `TimingWaterfall.tsx`
  - Currently uses hardcoded gradient/zone colors with no `dark:` support
  - Move all zone colors to CSS variables with `:root` and `.dark` definitions

- [ ] **T-07** Add light mode theme to CodeMirror editors
  - All editors hardcode `oneDark` — stays dark even when app is in light mode
  - Files: `CodeEditor.tsx`, `JsonCompareEditor.tsx`, `ResponsePanel.tsx`, all other CodeMirror usages
  - Read `resolvedTheme` from `next-themes`; apply `oneDark` in dark mode, base/light theme in light mode
  - Dynamically reconfigure editor extensions when theme changes

- [ ] **T-08** Add light mode support to Chain Canvas (React Flow)
  - Canvas bg, node colors, edge colors, and panel controls remain dark in light mode
  - Files: `ChainCanvas.tsx`, `ChainNode.tsx`, `DisplayNode.tsx`, `ConditionNode.tsx`, `ArrowConfigPanel.tsx`
  - Steps:
    1. Remove all hardcoded dark background colors from node/edge/canvas components
    2. Add `:root` (light) and `.dark` CSS variable blocks in `globals.css` for canvas tokens
    3. Pass `colorMode={resolvedTheme}` prop to `<ReactFlow>`
    4. Override React Flow default CSS variables to use app design tokens

### P1 — Major

- [ ] **T-03** Define comprehensive visualization state tokens in `globals.css`
  - States needed: idle, running, passed, failed, skipped
  - Add edge/connection color tokens and SVG stroke/fill tokens
  - Both `:root` (light) and `.dark` values required for every token

- [ ] **T-04** Migrate all inline styles and SVG colors in `ChainCanvas.tsx` to CSS variables
  - Audit every `style={{ color: ... }}` and `stroke=` / `fill=` attribute
  - Replace with `var(--token-name)` from the token set defined in T-03

- [ ] **T-05** Expand `dark:` Tailwind variant coverage across all components
  - Currently only ~25 instances of `dark:` in the entire codebase
  - Search for `bg-white`, `text-black`, `bg-gray-*`, `border-gray-*` lacking `dark:` counterparts
  - Add `dark:bg-card`, `dark:text-foreground`, etc. to each instance

### P2 — Minor

- [ ] **T-06** Replace hardcoded spacing magic numbers with Tailwind scale
  - Values: `40%`, `300px`, `200px`, `8px` hardcoded in JSX inline styles
  - Use Tailwind spacing classes or CSS variables

---

## Phase 4 — Anti-Patterns (Best Practices > 95)

### P0 — Blocking

- [ ] **AP-01** Fix all empty/silent catch blocks (8 instances)
  - `chain/[collectionId]/page.tsx:446-448, 497-499`
  - Audit all other `catch (e) {}` blocks in the codebase
  - At minimum: `console.error(e)` + surface error to user; ideally typed error handling with toast

### P1 — Major

- [ ] **AP-02** Remove all `console.log` statements from production code
  - `HealthPopover.tsx:34`
  - `codeGenerators.ts:166, 171, 207`
  - Delete or replace with a proper logger if context is needed

- [ ] **AP-03** Fix `setTimeout`/`setInterval` calls without cleanup in `useEffect` (5 files)
  - Return a cleanup function: `return () => clearTimeout(timerId)`
  - Audit all files using `setTimeout` inside `useEffect`

- [ ] **AP-04** Fix `addEventListener` without `removeEventListener` cleanup
  - `ChainCanvas.tsx:604`
  - Return cleanup: `return () => element.removeEventListener(event, handler)`

### P2 — Minor

- [ ] **AP-05** Replace inline arrow functions in JSX with `useCallback`-memoized handlers
  - 20+ instances in `ArrowConfigPanel.tsx`, `ChainNode.tsx`, `DisplayNode.tsx`
  - Extract to named handlers at component top level, wrap in `useCallback`

- [ ] **AP-06** Add error boundaries around `ChainCanvas` and heavy panels
  - Create an `ErrorBoundary` component
  - Wrap canvas and panel areas to prevent full-page crashes

- [ ] **AP-07** Standardize boolean prop naming with `is`/`has` prefixes
  - Audit component prop interfaces: `loading` → `isLoading`, `open` → `isOpen`, `disabled` stays `disabled`

---

## Verification Checklist

- [ ] Run Lighthouse (Incognito) on `/`, `/chain/[id]`, `/json-compare`, `/transform` — all scores ≥ 95
- [ ] Toggle light/dark mode — CodeMirror editors and Chain Canvas respond correctly
- [ ] `bun x biome check src/` — no new errors
- [ ] `bun tsc --noEmit` — no TypeScript errors
- [ ] Keyboard-navigate through canvas nodes and all panels without a mouse
- [ ] All `.map()` calls have stable key props (verify in React DevTools)
- [ ] No `console.log` in production bundle (check Network > Sources in DevTools)

---

## Task Summary

| Phase | P0 | P1 | P2 | Total |
|-------|----|----|-----|-------|
| Accessibility | 5 | 5 | 0 | 10 |
| Performance | 2 | 7 | 3 | 12 |
| Theming + Light Mode | 4 | 3 | 1 | 8 |
| Anti-Patterns | 1 | 3 | 3 | 7 |
| **Total** | **12** | **18** | **7** | **37** |
