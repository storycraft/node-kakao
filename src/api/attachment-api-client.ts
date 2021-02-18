/*
 * Created on Thu Feb 18 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { RequestHeader, WebClient } from '.';
import { ChatType, KnownChatType, PathAttachment } from '../chat';
import { DefaultConfiguration, WebApiConfig } from '../config';
import { AsyncCommandResult, KnownDataStatusCode } from '../request';
import { fillBaseHeader, getUserAgent } from './header-util';
import { createWebClient, TextWebRequest } from './web-client';

/**
 * Web attachment upload api
 */
export class AttachmentApiClient {
  private _mediaClient: TextWebRequest;
  private _videoClient: TextWebRequest;
  private _audioClient: TextWebRequest;

  constructor(
    mediaClient: WebClient,
    videoClient: WebClient,
    audioClient: WebClient,
    public config: WebApiConfig,
  ) {
    this._mediaClient = new TextWebRequest(mediaClient);
    this._videoClient = new TextWebRequest(videoClient);
    this._audioClient = new TextWebRequest(audioClient);
  }

  private createHeader(): RequestHeader {
    const header: RequestHeader = {};

    fillBaseHeader(header, this.config);
    const userAgent = getUserAgent(this.config);
    header['User-Agent'] = userAgent;

    return header;
  }

  async upload(type: ChatType, filename: string, data: ArrayBuffer): AsyncCommandResult<PathAttachment> {
    const client = this.getReqClient(type);

    const mimeType = this.getMimeType(type);

    const res = await client.requestMultipartText(
      'POST',
      'upload',
      {
        'user_id': 0,
        'attachment_type': mimeType,
        'attachment': {
          value: data,
          options: {
            filename
          }
        }
      },
      this.createHeader()
    );

    return {
      success: true,
      status: KnownDataStatusCode.SUCCESS,
      result: {
        path: res,
        s: data.byteLength
      }
    }
  }

  protected getReqClient(type: ChatType): TextWebRequest {
    switch (type) {
      case KnownChatType.VIDEO: return this._videoClient;
      case KnownChatType.AUDIO: return this._audioClient;

      default: return this._mediaClient;
    }
  }

  getMimeType(type: ChatType): string {
    switch (type) {
      case KnownChatType.PHOTO: return 'image/jpeg';
      case KnownChatType.MULTIPHOTO: return 'image/jpeg';
      case KnownChatType.CONTACT: return 'text/x-vcard';

      case KnownChatType.VIDEO: return 'video/mp4';
      case KnownChatType.AUDIO: return 'audio/m4a';

      // application/octet-stream
      default: return 'image/jpeg';
    }
  }

  /**
   * Create default AttachmentApiClient using config.
   *
   * @param {Partial<WebApiConfig>} config
   */
  static async create(config: Partial<WebApiConfig> = {}): Promise<AttachmentApiClient> {
    return new AttachmentApiClient(
      await createWebClient(
        'https',
        'up-m.talk.kakao.com',
      ),
      await createWebClient(
        'https',
        'up-v.talk.kakao.com',
      ),
      await createWebClient(
        'https',
        'up-a.talk.kakao.com',
      ),
      Object.assign({ ...DefaultConfiguration }, config),
    );
  }

}

export namespace AttachmentApi {

  let client: AttachmentApiClient | null = null;

  export async function upload(
    type: ChatType,
    filename: string,
    data: ArrayBuffer
  ): AsyncCommandResult<PathAttachment> {
    if (!client) client = await AttachmentApiClient.create();
    return client.upload(type, filename, data);
  }

}