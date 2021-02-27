/*
 * Created on Fri Jan 29 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import nodeResolve from '@rollup/plugin-node-resolve';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default () => {
  const plugins = [
    commonjs({
      include: 'node_modules/**'
    }),
    nodePolyfills(),
    nodeResolve(),
    typescript({
      module: 'ESNext',
      declaration: false,
      removeComments: true,
    })
  ];

  return [
    {
      input: 'src/index.ts',
      external: [
        // Excluded
        'axios',
        'form-data',
      ],
      shimMissingExports: true,
      output: [
        {
          dir: 'dist_esm',
          format: 'esm',
          sourcemap: true,
          /*
          preserveModules: true,
          preserveModulesRoot: 'src'
          */
        },
      ],
      plugins,
    },
  ];
};
