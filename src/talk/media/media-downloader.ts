/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from "../../channel/channel";
import { TalkSession } from "../../client";
import { MediaComponent } from "../../media/media";
import { DefaultLocoSession } from "../../network/request-session";
import { Stream } from "../../network/stream";
import { KnownDataStatusCode } from "../../packet/status-code";
import { AsyncCommandResult } from "../../request/command-result";

/**
 * DownloadInfo contains size and async stream iterator for download.
 */
export interface DownloadInfo {

    size: number;
    iterator: AsyncIterableIterator<ArrayBuffer>;

}

export class MediaDownloader {

    private _done: boolean;

    constructor(private _stream: Stream, private _talkSession: TalkSession, private _channel: Channel, private _media: MediaComponent) {
        this._done = false;
    }

    get done() {
        return this._done;
    }

    /**
     * Close downloader without downloading
     */
    close() {
        this._stream.close();
        this._done = true;
    }

    /**
     * Download media.
     *
     * @param offset data start offset to download (default = 0)
     */
    async download(offset: number = 0): AsyncCommandResult<DownloadInfo> {
        if (this._done) throw new Error('Cannot download using finished downloader');

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
            'mm': clientConfig.mccmnc
        });

        const next = await session.listen().next();
        if (next.done) return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };

        const { method, data } = next.value;
        if (method !== 'DOWN' || data.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: data.status };

        const size = data['s'];

        return {
            status: KnownDataStatusCode.SUCCESS,
            success: true,
            result: {
                size,
                iterator: this.createDownloadIter(size)
            }
        };
    }

    /**
     * Download thumbnail.
     * Only works on photo, video.
     *
     * @param offset data start offset to download (default = 0)
     */
    async downloadThumb(offset: number = 0): AsyncCommandResult<DownloadInfo> {
        if (this._done) throw new Error('Cannot download using finished downloader');

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
            'mm': clientConfig.mccmnc
        });

        const next = await session.listen().next();
        if (next.done) return { success: false, status: KnownDataStatusCode.OPERATION_DENIED };

        const { method, data } = next.value;
        if (method !== 'MINI' || data.status !== KnownDataStatusCode.SUCCESS) return { success: false, status: data.status };

        const size = data['s'];

        return {
            status: KnownDataStatusCode.SUCCESS,
            success: true,
            result: {
                size,
                iterator: this.createDownloadIter(size)
            }
        };
    }

    private createDownloadIter(size: number): AsyncIterableIterator<ArrayBuffer> {
        let downloaded = 0;

        const iterable = this._stream.iterate();
        const instance = this;

        return {
            [Symbol.asyncIterator]() {
                return this;
            },

            async next(): Promise<IteratorResult<ArrayBuffer>> {
                if (downloaded >= size) {
                    instance._done = true;
                    return { done: true, value: null };
                }

                const next = await iterable.next();
                if (next.done) {
                    instance._done = true;
                    return next;
                }

                downloaded += next.value.byteLength;

                if (downloaded > size) {
                    return { done: false, value: next.value.slice(0, downloaded - size) }
                }

                return { done: false, value: next.value };
            }
        };
    }

}