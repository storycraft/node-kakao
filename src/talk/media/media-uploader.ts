/*
 * Created on Sun Jan 24 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Channel } from "../../channel/channel";
import { TalkSession } from "../client";
import { MediaKeyComponent } from "../../media";
import { DefaultLocoSession } from "../../network/request-session";
import { BiStream, FixedWriteStream } from "../../stream";
import { KnownDataStatusCode } from "../../request";
import { AsyncCommandResult } from "../../request";
import { ChatType } from "../../chat";

/**
 * Contains start offset and write stream.
 */
type UploadFunc = (offset: number, stream: FixedWriteStream) => Promise<void>;

export class MediaUploader {

    private _canUpload: boolean;

    constructor(private _media: MediaKeyComponent, private _type: ChatType, private _talkSession: TalkSession, private _channel: Channel, private _stream: BiStream) {
        this._canUpload = true;
    }

    get media() {
        return this._media;
    }

    get type() {
        return this._type;
    }

    /**
     * Close uploader without uploading
     */
    close() {
        this._stream.close();
        this._canUpload = false;
    }

    /**
     * Create data writer with given size and start uploading.
     *
     * @param data
     * @param uploader Function called when upload ready. Upload should be done here.
     */
    upload(size: number, uploader: UploadFunc): AsyncCommandResult {
        if (!this._canUpload) throw new Error('Upload task already started');

        const session = new DefaultLocoSession(this._stream);
        const clientConfig = this._talkSession.configuration;

        return new Promise((resolve, reject) => {
            // Listen packets and wait the upload to complete
            (async () => {
                for await (const { method, data } of session.listen()) {
                    if (method === 'COMPLETE') {
                        return { status: data.status, success: data.status === KnownDataStatusCode.SUCCESS };
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

            session.request('MPOST', {
                'k': this._media.key,
                's': size,
                't': this._type,
    
                'u': this._talkSession.clientUser.userId,
                'os': clientConfig.agent,
                'av': clientConfig.appVersion,
                'nt': clientConfig.netType,
                'mm': clientConfig.mccmnc
            }).then((postRes) => {
                if (postRes.status !== KnownDataStatusCode.SUCCESS) resolve({ status: postRes.status, success: false });
                this._canUpload = false;
    
                const offset = postRes['o'];
                uploader(offset, new FixedWriteStream(this._stream, size)).then();
            }).catch(reject);
        });
    }

}