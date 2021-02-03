/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { Channel } from '../channel/channel';
import { ClientStatus } from '../client-status';
import { OAuthCredential } from '../oauth';
import { OpenChannel } from '../openlink/open-channel';
import { AsyncCommandResult } from '../request';

export interface LoginResult {

  channelList: (Channel | OpenChannel)[];

  /**
   * Client user id
   */
  userId: Long;

}

export interface ClientSession {

  /**
   * Login using credential.
   * Perform LOGINLIST
   *
   * @param credential
   */
  login(credential: OAuthCredential): AsyncCommandResult<LoginResult>;

  /**
   * Set client status
   */
  setStatus(status: ClientStatus): AsyncCommandResult;

}
