import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  external: [
    // Excluded
    'axios',
    'form-data',

    // Substituted
    'bson',
    'node-forge',
    'hash-wasm'
  ],
  output: [
    {
      dir: 'dist_esm',
      format: 'es',
      paths: {
        'bson': 'https://unpkg.com/bson/dist/bson.browser.esm.js',
        'node-forge': 'https://unpkg.com/node-forge/dist/forge.min.js',
        'hash-wasm': 'https://cdn.jsdelivr.net/npm/hash-wasm/dist/index.esm.min.js'
      }  
    }
  ],
  plugins: [
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
          removeComments: false,
        }
      }
    }),
    nodePolyfills(),
    nodeResolve(),
    commonjs({
      transformMixedEsModules: true
    })
  ]
}