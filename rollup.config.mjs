/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

/** @type {import('rollup').InputOptions} */
const opts = {
  input: 'src/index.ts',
  external: [
    // list of modules to exclude
    'axios',
    'form-data',
    'promise-socket',
  ],
  shimMissingExports: true,
  output: [
    {
      dir: 'dist_esm',
      format: 'esm',
      sourcemap: true,
      preserveModules: true,
      preserveModulesRoot: 'src',
    },
  ],
  plugins: [
    nodeResolve({
      preferBuiltins: true,
      browser: true,
    }),
    commonjs(),
    typescript({
      tsconfig: './tsconfig.build.json',
      module: 'ESNext',
      declaration: false,
      removeComments: true,
    }),
  ],
};

export default opts;
