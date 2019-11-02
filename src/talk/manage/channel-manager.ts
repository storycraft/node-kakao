import { ChatChannel } from "../room/chat-channel";
import { ChatDataStruct } from "../struct/chatdata-struct";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class ChannelManager {

    private channelMap: Map<number, ChatChannel>;

    constructor() {
        this.channelMap = new Map();
    }
    
    get ChannelList() {
        return Array.from(this.channelMap.values());
    }

    hasChannel(id: number): boolean {
        return this.channelMap.has(id);
    }

    getChannelById(id: number): ChatChannel {
        if (!this.hasChannel(id)) {
            throw new Error(`Channel ${id} is not valid`);
        }

        return this.channelMap.get(id)!;
    }

    cacheChannel(chatStruct: ChatDataStruct) {
        
    }

}