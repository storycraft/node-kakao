/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from "../../channel/channel";
import { TalkSession } from "../client";
import { MediaComponent, MediaTypeComponent } from "../../media";
import { DefaultLocoSession } from "../../network/request-session";
import { Stream } from "../../network/stream";
import { DataStatusCode, KnownDataStatusCode } from "../../request";
import { AsyncCommandResult } from "../../request";

interface DataWriter {

    /**
     * Write data chunk.
     * This can be called with one big single buffer or chunked until it finished.
     *
     * @param data
     *
     * @returns true when write finished.
     */
    write(data: ArrayBuffer): boolean;

}

/**
 * Contains data writer and start offset
 */
interface UploadRequest {

    /**
     * Start offset
     */
    offset: number;

    writer: DataWriter;

}

export class MediaUploader {

    private _done: boolean;
    private _written: number;

    constructor(private _media: MediaComponent & MediaTypeComponent, private _talkSession: TalkSession, private _channel: Channel, private _stream: Stream) {
        this._done = false;
        this._written = 0;
    }

    get media() {
        return this._media;
    }

    get done() {
        return this._done;
    }

    /**
     * Close uploader without uploading
     */
    close() {
        this._stream.close();
        this._done = true;
    }

    /**
     * Create data writer with given size and start uploading.
     *
     * @param data
     * @param onComplete callback called when upload complete
     */
    async upload(size: number, onComplete?: (status: DataStatusCode) => void): AsyncCommandResult<Readonly<UploadRequest>> {
        if (this._done) throw new Error('Cannot upload more using finished uploader');

        const session = new DefaultLocoSession(this._stream);
        const clientConfig = this._talkSession.configuration;

        // Listen packets and wait the upload to complete
        (async () => {
            for await (const { method, data } of session.listen()) {
                if (method === 'COMPLETE' && onComplete) {
                    onComplete(data.status);
                }
            }
        })();

        const postRes = await session.request('MPOST', {
            'k': this._media.key,
            's': size,
            't': this._media.type,

            'u': this._talkSession.clientUser.userId,
            'os': clientConfig.agent,
            'av': clientConfig.appVersion,
            'nt': clientConfig.netType,
            'mm': clientConfig.mccmnc
        });
        if (postRes.status !== KnownDataStatusCode.SUCCESS) return { status: postRes.status, success: false };

        const offset = postRes['o'];
        const writer: DataWriter = {
            write: (data) => {
                if (this._done) throw new Error('Cannot write more when upload finished');

                this._written += data.byteLength;

                if (this._written > size) {
                    this._stream.write(data.slice(0, this._written - size));
                } else {
                    this._stream.write(data);
                }

                if (this._written >= size) {
                    this._done = true;
                    return true;
                }

                return false;
            }
        };

        return { status: postRes.status, success: true, result: { offset, writer } };
    }

}