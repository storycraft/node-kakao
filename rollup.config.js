/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import typescript from 'rollup-plugin-typescript2';
import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: ['src/index.ts'],
  external: [
    // Excluded
    'axios',
    'form-data',

    // Substituted
    'bson',
    'hash-wasm'
  ],
  output: [
    {
      dir: 'dist_esm',
      format: 'es',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
      paths: {
        'bson': 'https://unpkg.com/bson/dist/bson.browser.esm.js',
        'hash-wasm': 'https://cdn.jsdelivr.net/npm/hash-wasm/dist/index.esm.min.js'
      }  
    }
  ],
  plugins: [
    nodePolyfills(),
    nodeResolve({
      extensions: ['.js', '.ts']
    }),
    commonjs({
      transformMixedEsModules: true
    }),
    typescript({
      tsconfigOverride: {
        compilerOptions: {
          module: 'ESNext',
          removeComments: false,
        }
      }
    })
  ]
}