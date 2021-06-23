/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration, Long } from '../src';
import { TalkSessionFactory } from '../src/talk';

describe('Network', () => {
  it('Create loco session', async () => {
    const factory = new TalkSessionFactory();

    const res = await factory.connect(Long.fromValue(Math.floor(Math.random() * 9999999)), DefaultConfiguration);
    if (!res.success) throw new Error(`Session creation failed with status: ${res.status}`);
    res.result.stream.close();
  });
});
