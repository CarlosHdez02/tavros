# Carousel zero-crash audit (Carroussel + data pipeline)

## Part 1 — Static analysis summary

### Blank screen (white screen of death) triggers — mitigated

| Risk | Mitigation |
|------|------------|
| Initial load, no data | Dark `#0f1419` shells: loading, empty (`data-testid="carousel-empty"`), fetch error (`data-testid="carousel-error"`) |
| `currentItem` null | Guard returns “Cargando contenido…” on dark background (should not occur if `carrouselComponents.length > 0` and modulo is correct) |
| React Query fetch failure with no cache | `isError && !data` renders error UI instead of an empty fragment |
| Dynamic imports (table/gallery) | `loading` uses `CarouselLoadingPlaceholder` (dark + “Cargando…”), not a white page |

### Data integrity — null / undefined / empty arrays

- `rows = data?.all ?? []` — never iterates `undefined`.
- Empty `rows` or all-invalid types → `carrouselComponents` is `[]` → “No hay datos”.
- Row `type` is validated with `parseRowType`; invalid rows are dropped instead of producing `componentMap[undefined]`.

### Type safety — `id` as number

- `normalizeSlideId(id, index)` coerces `id` with `Number()`, requires `Number.isFinite` and `>= 0`, else falls back to `index + 1`.
- Prevents string IDs and `NaN` from entering keys and display logic.

### Boundary conditions — index math

- **Next:** `(prev + 1) % len` — when `prev === len - 1`, result is `0` (first slide). No off-by-one past the end.
- **Prev:** `p - 1` with wrap `newIndex < 0 ? len - 1 : newIndex` — from index `0` goes to `len - 1`.
- **Safe index read:** `(NaN ? 0 : max(0, idx)) % len` — always in `[0, len-1]`.
- **Dot click:** `safeIdx = clamp(Number(index)||0, 0, len-1)`.

### Playwright / QA hooks (DOM)

- `data-testid="carousel-root"` with `data-carousel-index` and `data-carousel-length` for cyclic assertions without React internals.

### Note on slide remount vs wrapper

- `CarrouselWrapper` stays mounted across loops; each slide uses `key={`slide-${currentIndex}-${currentItem.id}`}` so **slide content** remounts per slide. This is intentional for player stability and does not unmount the carousel shell.

### Production safeguards (ongoing)

- **Video rows** with empty/null `youtubeLink` are **omitted** from the carousel (no dead slides).
- **`CarouselSlideErrorBoundary`**: a render/loader error in one slide shows a dark fallback; navigation and the rest of the app keep working.
- **`currentIndex` clamp** when `data.all` shrinks so the index never exceeds `length - 1`.
- **`useCarouselData`**: `refetchOnReconnect: true`, `gcTime` 24h for long-lived displays; failed refetch keeps last good data (React Query default).

## Part 2 — Playwright

- **Spec:** `e2e/carousel-loop.spec.ts` — mocks `GET **/api/videos`, walks the full slide list via “Next slide”, asserts **last → index 0** (0-based), scans `body` text for `NaN` / `undefined`, and listens for `pageerror`.
- **Run locally:** `npm run test:e2e:install` (once per machine, downloads Chromium) then `npm run test:e2e`.
- **Port:** Playwright starts Next on **3005** so it does not conflict with a dev server on **3000**.
