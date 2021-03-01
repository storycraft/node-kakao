/*
 * Created on Wed Jan 20 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Long } from 'bson';
import { NormalChannelData } from '../channel/channel';
import { ClientStatus } from '../client-status';
import { OAuthCredential } from '../oauth';
import { OpenChannelData } from '../openlink/open-channel';
import { AsyncCommandResult } from '../request';

export interface LoginResult {

  channelList: (NormalChannelData | OpenChannelData)[];

  /**
   * Client user id
   */
  userId: Long;

  /**
   * Last channel id
   */
  lastChannelId: Long;

  lastTokenId: Long;
  mcmRevision: number;

  /**
   * Removed channel id list
   */
  removedChannelIdList: Long[];

  revision: number;
  revisionInfo: string;

  /**
   * Minimum log id
   */
  minLogId: Long;

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
