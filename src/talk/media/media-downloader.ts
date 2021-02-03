/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from '../../channel';
import { TalkSession } from '../client';
import { MediaKeyComponent } from '../../media';
import { DefaultLocoSession } from '../../network';
import { BiStream, FixedReadStream } from '../../stream';
import { AsyncCommandResult, KnownDataStatusCode } from '../../request';

export class MediaDownloader {
  private _used: boolean;

  constructor(
    private _stream: BiStream,
    private _talkSession: TalkSession,
    private _channel: Channel,
    private _media: MediaKeyComponent,
  ) {
    this._used = false;
  }

  /**
   * Close downloader without downloading
   */
  close(): void {
    this._stream.close();
  }

  /**
   * Download media.
   *
   * @param {number} offset data start offset to download (default = 0)
   */
  async download(offset = 0): AsyncCommandResult<FixedReadStream> {
    if (this._used) throw new Error('Download stream already created');

    const session = new DefaultLocoSession(this._stream);
    const clientConfig = this._talkSession.configuration;

    session.request('DOWN', {
      'k': this._media.key,
      'c': this._channel.channelId,
      'o': offset,
      'rt': true,

      'u': this._talkSession.clientUser.userId,
      'os': clientConfig.agent,
      'av': clientConfig.appVersion,
      'nt': clientConfig.netType,
      'mm': clientConfig.mccmnc,
    });

    const next = await session.listen().next();
    if (next.done) return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };
    this._used = true;

    const { method, data } = next.value;
    if (method !== 'DOWN' || data.status !== KnownDataStatusCode.SUCCESS) {
      return { success: false, status: data.status };
    }

    const size = data['s'] as number;

    return {
      status: KnownDataStatusCode.SUCCESS,
      success: true,
      result: new FixedReadStream(this._stream, size),
    };
  }

  /**
   * Download thumbnail.
   * Only works on photo, video.
   *
   * @param {number} offset data start offset to download (default = 0)
   */
  async downloadThumb(offset = 0): AsyncCommandResult<FixedReadStream> {
    if (this._used) throw new Error('Download stream already created');
    if (this._stream.ended) throw new Error('Cannot download using finished downloader');
    this._used = true;

    const session = new DefaultLocoSession(this._stream);
    const clientConfig = this._talkSession.configuration;

    session.request('MINI', {
      'k': this._media.key,
      'c': this._channel.channelId,
      'o': offset,

      // These should be actual dimension of media.
      // Seems like server doesn't care about it.
      'w': 0,
      'h': 0,

      'u': this._talkSession.clientUser.userId,
      'os': clientConfig.agent,
      'av': clientConfig.appVersion,
      'nt': clientConfig.netType,
      'mm': clientConfig.mccmnc,
    });

    const next = await session.listen().next();
    if (next.done) return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };

    const { method, data } = next.value;
    if (method !== 'MINI' || data.status !== KnownDataStatusCode.SUCCESS) {
      return { success: false, status: data.status };
    }

    const size = data['s'] as number;

    return {
      status: KnownDataStatusCode.SUCCESS,
      success: true,
      result: new FixedReadStream(this._stream, size),
    };
  }
}
