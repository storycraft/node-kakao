import { MessageType } from "./message-type";
import { Long } from "bson";
import { ChatChannel } from "../room/chat-channel";
import { ChatUser } from "../user/chat-user";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export abstract class Chat {

    private prevLogId: Long;
    private logId: Long;

    private channel: ChatChannel;
    private sender: ChatUser;

    private messageId: number;

    private sendTime: number;

    constructor(channel: ChatChannel, sender: ChatUser, messageId: number, logId: Long, prevLogId: Long, sendTime: number) {
        this.channel = channel;
        this.sender = sender;

        this.logId = logId;
        this.prevLogId = prevLogId;

        this.messageId = messageId;
        this.sendTime = sendTime;
    }

    get Channel() {
        return this.channel;
    }

    get Sender() {
        return this.sender;
    }

    get PrevLogId() {
        return this.prevLogId;
    }

    get LogId() {
        return this.logId;
    }

    get MessageId() {
        return this.messageId;
    }
    
    get SendTime() {
        return this.sendTime;
    }

    abstract get Type(): MessageType;
    
}

export class TextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }
}

export class PhotoChat extends Chat {
    
    get Type() {
        return MessageType.Photo;
    }

}

export class VideoChat extends Chat {
    
    get Type() {
        return MessageType.Video;
    }

}

export class LongTextChat extends Chat {
    
    get Type() {
        return MessageType.Text;
    }

}

export class EmoticonChat extends Chat {
    
    get Type() {
        return MessageType.DitemEmoticon;
    }

}

export class SharpSearchChat extends Chat {
    
    get Type() {
        return MessageType.Search;
    }

}