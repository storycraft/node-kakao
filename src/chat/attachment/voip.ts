/*
 * Created on Fri Feb 12 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Attachment } from '.';
import { VoipType } from '../../voip';

/**
 * Voip attachment
 */
export interface VoipAttachment extends Attachment {

  /**
   * Call type
   */
  type: VoipType;

  /**
   * Call server ip
   */
  csIP: string;

  /**
   * Call server ip (ipv6)
   */
  csIP6: string;

  /**
   * Call server port
   */
  csPort: number;

  /**
   * Call id
   */
  callId: string;

  /**
   * Supplied when the call is live talk
   */
  title?: string;

  /**
   * Call start time.
   * Supplied when the call is live talk.
   */
  startTime?: number;

  /**
   * Call duration
   */
  duration: number;
}