/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { assert } from 'chai';
import { ChainedIterator } from '../src/util';

describe('Util', () => {
  it('Chained iterator', () => {
    const chained = new ChainedIterator<number>(
      [1][Symbol.iterator](),
      [1, 2][Symbol.iterator](),
      [1, 2, 3][Symbol.iterator](),
    );

    assert.deepEqual(Array.from(chained), [1, 1, 2, 1, 2, 3]);
  });
});
