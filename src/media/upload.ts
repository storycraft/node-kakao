/*
 * Created on Sat Mar 13 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chatlog } from '../chat';
import { AsyncCommandResult, CommandResult } from '../request';
import { FixedWriteStream } from '../stream';

export interface MediaMetadata {

  /**
   * Media name
   */
  readonly name: string;

  /**
   * Media width (only photo, video)
   */
  readonly width?: number;

   /**
    * Media height (only photo, video)
    */
  readonly height?: number;
 
   /**
    * File extension (Optional. Required when sending file)
    */
  readonly ext?: string;

}

export interface MediaUploadForm {

  /**
   * Size of media data
   */
  readonly size: number;

  /**
   * Checksum of media data (sha1)
   */
  readonly checksum: string;

  /**
   * Media metadata
   */
  readonly metadata: MediaMetadata;

}

export interface MediaPostEntry {

  /**
   * Start offset of media data.
   */
  offset: number;

  /**
   * Write stream
   */
  stream: FixedWriteStream;

}

export interface MediaMultiPostEntry extends MediaPostEntry {

  /**
   * Finish current media upload and close media stream.
   */
  finish(): AsyncCommandResult;

}

export interface MediaPost extends MediaPostEntry {

  /**
   * Finish media upload and close media stream.
   */
  finish(): AsyncCommandResult<Chatlog>;

}

export interface MediaMultiPost {

  /**
   * Media post entries. Ordered same as given UploadForm list.
   * Each loop will create connection for n-th UploadForm.
   */
  entries: AsyncIterableIterator<CommandResult<MediaMultiPostEntry>>;

  /**
   * Finish all media uploads and send to channel.
   */
  finish(): AsyncCommandResult<Chatlog>;

}