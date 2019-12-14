import { LocoBsonRequestPacket } from "./loco-bson-packet";
import { Long } from "bson";
import { FeedType } from "../talk/feed/feed-type";

/*
 * Created on Sat Dec 14 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export class PacketRewriteReq extends LocoBsonRequestPacket {

    constructor(
        public ClientOpenUserId: Long = Long.ZERO,
        public ChannelId: Long = Long.ZERO,
        public LogId: Long = Long.ZERO,
        public Time: number = 0,
        public RewriteFeedType: FeedType | null = FeedType.OPENLINK_REWRITE_FEED,
        public Unknown1: string = '',
        public Unknown2: string = '',
    ) {
        super();
    }
    
    get PacketName() {
        return 'REWRITE';
    }
    
    toBodyJson() {
        let obj: any = {
            'li': this.ClientOpenUserId,
            'c': this.ChannelId,
            'logId': this.LogId,
            't': this.Time
        };

        if (this.Unknown1.trim() != '') {
            obj['rcli'] = this.Unknown1;
        }

        if (this.Unknown2.trim() != '') {
            obj['cat'] = this.Unknown2;
        }

        if (this.RewriteFeedType === FeedType.RICH_CONTENT) {
            obj['ft'] = this.RewriteFeedType;
        }

        return obj;
    }

}