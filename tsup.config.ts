import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: { 'bin/mcpx': 'bin/mcpx.ts' },
    format: ['esm'],
    target: 'node20',
    clean: true,
    splitting: false,
    banner: { js: '#!/usr/bin/env node' },
  },
  {
    entry: { index: 'src/index.ts' },
    format: ['esm'],
    target: 'node20',
    dts: true,
    splitting: false,
  },
]);
