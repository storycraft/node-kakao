/*
 * Created on Fri Jan 22 2021
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chatlog } from "../../../chat/chat";
import { ChatlogStruct } from "../chat";

export class WrappedChatlog implements Chatlog {

    constructor(private _struct: ChatlogStruct) {

    }
    
    get type() {
        return this._struct.type;
    }

    get text() {
        return this._struct.message;
    }

    get attachment() {
        return this._struct.attachment;
    }

    get logId() {
        return this._struct.logId;
    }

    get prevLogId() {
        return this._struct.prevId;
    }

    get messageId() {
        return this._struct.msgId;
    }

    get sender() {
        return { userId: this._struct.authorId };
    }

    get sendAt() {
        return this._struct.sendAt * 1000;
    }

    get suppliment() {
        return this._struct.supplement;
    }

}