/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration } from '../src';
import { TalkSessionFactory } from '../src/talk';

describe('Network', () => {
  it('Create loco session', async () => {
    const factory = new TalkSessionFactory();

    const res = await factory.createSession(DefaultConfiguration);
    if (!res.success) throw new Error(`Session creation failed with status: ${res.status}`);
    res.result.close();
  });
});
