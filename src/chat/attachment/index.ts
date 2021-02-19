/*
 * Created on Wed Jan 27 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export * from './reply';
export * from './mention';
export * from './media';
export * from './emoticon';
export * from './voip';
export * from './contact';
export * from './map';
export * from './post';
export * from './openlink';

import { MentionStruct } from './mention';

/**
 * Generic attachment interface
 */
export interface Attachment extends Record<string, unknown> {
  shout?: boolean;
  mentions?: MentionStruct[];

  urls?: string[];

}

/**
 * Can be used to send attachment uploaded via web api.
 * You should provide additional data to send properly.
 */
export interface PathAttachment extends Attachment {
  /**
   * Attachment path (Uploaded via web api)
   */
  path: string;

  /**
   * Attachment size
   */
  s: number;

}