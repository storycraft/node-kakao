/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from "./chat";
import { FeedType } from "../feed/feed-type";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";

export class ChatFeed {

    constructor(private feedType: FeedType, private memberId?: Long, private memberNickname?: string, private text?: string) {
        
    }

    get FeedType() {
        return this.feedType;
    }

    // for member speific feeds

    get MemberId() {
        return this.memberId;
    }

    get MemberNickname() {
        return this.memberNickname;
    }

    // for rich content
    get Text() {
        return this.text;
    }

    static getFeedFromText(rawFeed: string): ChatFeed {
        let obj = JsonUtil.parseLoseless(rawFeed);

        let type = obj['feedType'] as FeedType;
        let memberInfo = obj['member'];

        if (memberInfo) {
            return new ChatFeed(type, memberInfo['userId'], memberInfo['nickName']);
        }

        return new ChatFeed(type, undefined, undefined, obj['text']); // is it correct?
    }

    static feedToJson(feed: ChatFeed): any {
        let obj: any = {};
        let memberObj: any = {};

        if (feed.memberId) {
            memberObj['userId'] = feed.memberId;
        }

        if (feed.memberNickname) {
            memberObj['nickName'] = feed.memberNickname;
        }

        obj['feedType'] = feed.feedType;

        if (Object.keys(memberObj).length > 0) {
            obj['member'] = memberObj;
        }

        if (feed.text) {
            obj['text'] = feed.text;
        }

        return obj;
    }

}