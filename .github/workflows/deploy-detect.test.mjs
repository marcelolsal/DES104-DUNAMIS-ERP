// Verifica el ruteo del job `detect` de deploy.yml: dado un set de archivos
// cambiados, qué flags (migrations/backend/frontend) quedan en true.
// Lee los filtros REALES del workflow para no duplicar la fuente de verdad.
// Correr: node --test .github/workflows/deploy-detect.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const yml = readFileSync(
  fileURLToPath(new URL("./deploy.yml", import.meta.url)),
  "utf8",
);

// Extrae el bloque `filters: |` en { grupo: [patrones] }.
function parseFilters(text) {
  const lines = text.split("\n");
  const start = lines.findIndex((l) => l.trim() === "filters: |");
  assert.notEqual(start, -1, "no se encontró `filters: |` en deploy.yml");
  const baseIndent = lines[start].search(/\S/);
  const filters = {};
  let group = null;
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    if (line.search(/\S/) <= baseIndent) break; // fin del bloque
    const g = line.match(/^\s+([\w-]+):\s*$/);
    if (g) {
      group = g[1];
      filters[group] = [];
      continue;
    }
    const e = line.match(/^\s+-\s+'([^']+)'\s*$/);
    if (e && group) filters[group].push(e[1]);
  }
  return filters;
}

// Glob mínimo que cubre los patrones usados: `prefijo/**` o archivo exacto.
function matches(pattern, file) {
  if (pattern.endsWith("/**")) return file.startsWith(pattern.slice(0, -2));
  return file === pattern;
}

const filters = parseFilters(yml);

function routeFor(changed) {
  const out = {};
  for (const [group, patterns] of Object.entries(filters)) {
    out[group] = changed.some((f) => patterns.some((p) => matches(p, f)));
  }
  return out;
}

test("filtros presentes con las rutas documentadas", () => {
  assert.deepEqual(filters.migrations, [
    "apps/backend/src/shared/db/migrations/**",
  ]);
  assert.ok(filters.backend.includes("apps/backend/**"));
  assert.ok(filters.frontend.includes("apps/frontend/**"));
  for (const g of ["backend", "frontend"]) {
    assert.ok(filters[g].includes("packages/contracts/**"));
    assert.ok(filters[g].includes("pnpm-lock.yaml"));
    assert.ok(filters[g].includes("package.json"));
  }
});

test("nueva migración → migrate + backend, no frontend", () => {
  assert.deepEqual(
    routeFor(["apps/backend/src/shared/db/migrations/0001_x.sql"]),
    { migrations: true, backend: true, frontend: false },
  );
});

test("schema.ts sin migración → backend sí, migrate NO", () => {
  assert.deepEqual(routeFor(["apps/backend/src/shared/db/schema.ts"]), {
    migrations: false,
    backend: true,
    frontend: false,
  });
});

test("solo frontend → frontend, sin migrate ni backend", () => {
  assert.deepEqual(routeFor(["apps/frontend/src/App.tsx"]), {
    migrations: false,
    backend: false,
    frontend: true,
  });
});

test("contracts / lockfile afectan backend y frontend", () => {
  assert.deepEqual(routeFor(["packages/contracts/src/index.ts"]), {
    migrations: false,
    backend: true,
    frontend: true,
  });
  assert.deepEqual(routeFor(["pnpm-lock.yaml"]), {
    migrations: false,
    backend: true,
    frontend: true,
  });
});

test("cambio ajeno (docs) → nada corre", () => {
  assert.deepEqual(routeFor(["docs/README.md"]), {
    migrations: false,
    backend: false,
    frontend: false,
  });
});
