---
inclusion: always
---

# Technical constraints

- Browser-native ES modules and CSS; Node 22+ for build and tests.
- No runtime dependencies, remote fonts, trackers, secret keys, or backend.
- simulation.js owns pure state transitions; scenarios.js owns content.
- app.js renders state, handles browser persistence, and downloads reports.
- Preserve deterministic outcomes and serialize only plain data.
- Run npm test, npm run check, and npm run build after substantive changes.
- User-entered or restored data must not become executable HTML.
