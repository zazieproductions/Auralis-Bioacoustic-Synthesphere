# AURALIS — Bioacoustic Synthesphere

An independent sonic companion to **SONOGENESIS**, sharing its fictional artificial-ecology universe while retaining its own synthesis engine and experimental identity.

**Status:** Companion / experimental instrument, not the flagship SONOGENESIS edition.

## Run locally

```bash
npm ci
npm run dev
```

## Production build

```bash
npm run build
```

The generated `dist/` directory can be deployed as a static Vite site (e.g. Cloudflare Pages). Build command: `npm run build`; output directory: `dist`.

## Architecture

- `src/audio/AudioEngine.ts` — distinctive synthesis and bioacoustic voice engine
- `src/simulation/` — ecosystem, genetics and habitat behavior
- `src/rendering/` — ecological visualization
- `src/components/` — organism, mutation, breeding, habitat, conductor and observatory interfaces

## Relationship to SONOGENESIS

AURALIS is a separate codebase and standalone instrument. The two projects can cross-reference each other without synchronizing audio engines or visual design. Preserve the original AURALIS sound character when developing future versions.
