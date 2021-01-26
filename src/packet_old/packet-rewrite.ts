import { LocoBsonRequestPacket, LocoBsonResponsePacket } from "./loco-bson-packet";
import { Long } from "bson";
import { FeedType, KnownFeedType } from "../chat/feed/feed-type";
import { ChatType } from "../talk/chat_old/chat-type";

/*
 * Created on Sat Dec 14 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketRewriteReq extends LocoBsonRequestPacket {

    constructor(
        public LinkId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public LogId: Long = Long.ZERO,
        public Type: ChatType = ChatType.Text,
        public RewriteFeedType: FeedType = KnownFeedType.OPENLINK_REWRITE_FEED,
        public ReportChannelLink: string = '', // Report channel 
        public Category: string = '', // Report Category
    ) {
        super();
    }
    
    get PacketName() {
        return 'REWRITE';
    }
    
    toBodyJson() {
        let obj: any = {
            'li': this.LinkId,
            'c': this.ChannelId,
            'logId': this.LogId,
            't': this.Type
        };

        if (this.ReportChannelLink !== '') {
            obj['rcli'] = this.ReportChannelLink;
        }

        if (this.Category !== '') {
            obj['cat'] = this.Category;
        }

        if (this.RewriteFeedType === KnownFeedType.RICH_CONTENT) {
            obj['ft'] = this.RewriteFeedType;
        }

        return obj;
    }

}

export class PacketRewriteRes extends LocoBsonResponsePacket {
    
    get PacketName() {
        return 'REWRITE';
    }

    readBodyJson(body: any): void {
        
    }
}
