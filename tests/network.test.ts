/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { DefaultConfiguration } from '../src/config/client-config-provider';
import { TalkSessionFactory } from '../src/talk/network/talk-session-factory';

describe('Network', () => {
    it('Create loco session', async () => {
        const factory = new TalkSessionFactory();

        const res = await factory.createSession(DefaultConfiguration);
        if (!res.success) throw `Session creation failed with status: ${res.status}`;
    });
});