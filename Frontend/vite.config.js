import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// CRA -> Vite. Notable adaptations:
//  - JSX lives in .js files, so esbuild is told to treat .js as JSX.
//  - The app reads `process.env.REACT_APP_*` / `process.env.NODE_ENV`; we expose
//    those (and only those) via `define`, matching CRA's build-time inlining.
//  - Output goes to `build/` (CRA's dir) so deploy/.gitignore are unchanged.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const clientEnv = { NODE_ENV: mode };
  for (const key of Object.keys(env)) {
    if (key.startsWith('REACT_APP_')) clientEnv[key] = env[key];
  }

  return {
    plugins: [react()],
    // In tests, leave the real Node process.env in place (so specs can mutate it);
    // for dev/build, inline REACT_APP_* + NODE_ENV like CRA did.
    define: mode === 'test' ? {} : { 'process.env': JSON.stringify(clientEnv) },
    server: { port: 3000, open: false },
    build: { outDir: 'build', sourcemap: false },
    // Allow JSX syntax inside .js files (CRA convention).
    esbuild: { loader: 'jsx', include: /src\/.*\.jsx?$/, exclude: [] },
    optimizeDeps: {
      esbuildOptions: { loader: { '.js': 'jsx' } },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/setupTests.js',
    },
  };
});
