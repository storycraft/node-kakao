/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { Chat } from "./chat";
import { FeedType } from "../feed/feed-type";
import { Long } from "bson";
import { JsonUtil } from "../../util/json-util";
import { MemberStruct } from "../struct/member-struct";

export class ChatFeed {

    constructor(private feedType: FeedType, private text?: string, private member?: MemberStruct, private inviter?: MemberStruct, private memberList?: MemberStruct[]) {
        
    }

    get FeedType() {
        return this.feedType;
    }

    // for member speific feeds

    get Member() {
        return this.member;
    }

    get MemberList() {
        return this.memberList;
    }

    get Inviter() {
        return this.inviter;
    }

    // for rich content
    get Text() {
        return this.text;
    }

    static getFeedFromText(rawFeed: string): ChatFeed {
        let obj = JsonUtil.parseLoseless(rawFeed);

        let type = obj['feedType'] as FeedType;

        let memberStruct: MemberStruct | undefined;
        if (obj['member']) {
            memberStruct = new MemberStruct();
            memberStruct.fromJson(obj['member']);
        }

        let inviterStruct: MemberStruct | undefined;
        if (obj['inviter']) {
            inviterStruct = new MemberStruct();
            inviterStruct.fromJson(obj['inviter']);
        }

        let memberListStruct: MemberStruct[] | undefined;
        if (obj['members']) {
            memberListStruct = [];

            for (let rawMember of obj['members']) {
                let memberStruct = new MemberStruct();
                memberStruct.fromJson(rawMember);

                memberListStruct.push(memberStruct);
            }
        }

        return new ChatFeed(type, obj['text'], memberStruct, inviterStruct, memberListStruct);
    }

    static feedToJson(feed: ChatFeed): any {
        let obj: any = {};

        if (feed.member) {
            obj['member'] = feed.member;
        }
        
        obj['feedType'] = feed.feedType;

        if (feed.text) {
            obj['text'] = feed.text;
        }

        if (feed.memberList) {
            obj['members'] = feed.text;
        }

        if (feed.inviter) {
            obj['inviter'] = feed.inviter;
        }

        return obj;
    }

}