/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const plugins = [
  nodeResolve({
    preferBuiltins: true,
    browser: true
  }),
  commonjs(),
  typescript({
    module: 'ESNext',
    declaration: false,
    removeComments: true,
  }),
];

/** @type {import('rollup').InputOptions} */
const opts = {
  input: 'src/index.ts',
  external: [
    // Excluded
    'axios',
    'form-data',
    'promise-socket'
  ],
  shimMissingExports: true,
  output: [
    {
      dir: 'dist_esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src'
    },
  ],
  plugins,
};

export default opts;
