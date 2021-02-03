/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from '../../channel';
import { TalkSession } from '../client';
import { MediaKeyComponent } from '../../media';
import { DefaultLocoSession } from '../../network';
import { BiStream } from '../../stream';
import { AsyncCommandResult, DefaultReq, KnownDataStatusCode } from '../../request';
import { Chatlog, ChatType } from '../../chat';
import { MediaUploadTemplate } from './upload';
import { ChatlogStruct, structToChatlog } from '../../packet/struct';

export class MediaUploader {
  private _canUpload: boolean;

  constructor(
    private _media: MediaKeyComponent,
    private _type: ChatType,
    private _template: MediaUploadTemplate,
    private _talkSession: TalkSession,
    private _channel: Channel,
    private _stream: BiStream,
  ) {
    this._canUpload = true;
  }

  get media(): MediaKeyComponent {
    return this._media;
  }

  get type(): number {
    return this._type;
  }

  /**
   * Close uploader without uploading
   */
  close(): void {
    this._stream.close();
    this._canUpload = false;
  }

  /**
   * Create data writer with given template and start uploading.
   * When upload done the server send to channel.
   *
   * @return {AsyncCommandResult<Chatlog>}
   */
  upload(): AsyncCommandResult<Chatlog> {
    if (!this._canUpload) throw new Error('Upload task already started');

    const session = new DefaultLocoSession(this._stream);
    const clientConfig = this._talkSession.configuration;

    return new Promise((resolve, reject) => {
      // Listen packets and wait the upload to complete
      (async () => {
        for await (const { method, data } of session.listen()) {
          if (method === 'COMPLETE') {
            const chatlog = structToChatlog(data['chatLog'] as ChatlogStruct);
            return { status: data.status, success: data.status === KnownDataStatusCode.SUCCESS, result: chatlog };
          }
        }
      })().then((res) => {
        this.close();
        if (res) {
          resolve(res);
        } else {
          resolve({ status: KnownDataStatusCode.OPERATION_DENIED, success: false });
        }
      }).catch(reject);

      const reqData: DefaultReq = {
        'k': this._media.key,
        's': this._template.data.byteLength,
        't': this._type,

        'c': this._channel.channelId,
        'mid': Math.floor(Math.random() * 1000000),
        'ns': true,

        'u': this._talkSession.clientUser.userId,
        'os': clientConfig.agent,
        'av': clientConfig.appVersion,
        'nt': clientConfig.netType,
        'mm': clientConfig.mccmnc,
      };

      if (this._template.width) reqData['w'] = this._template.width;
      if (this._template.height) reqData['h'] = this._template.height;

      session.request('POST', reqData).then((postRes) => {
        if (postRes.status !== KnownDataStatusCode.SUCCESS) resolve({ status: postRes.status, success: false });
        this._canUpload = false;

        const offset = postRes['o'] as number;

        this._stream.write(this._template.data.slice(offset)).then();
      }).catch(reject);
    });
  }
}
