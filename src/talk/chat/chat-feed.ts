/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FeedType } from "../feed/feed-type";
import { JsonUtil } from "../../util/json-util";
import { MemberStruct } from "../struct/member-struct";
import { Long } from "bson";
import { StructBase } from "../struct/struct-base";

export class ChatFeed {

    constructor(private feedType: FeedType, private text?: string, private member?: MemberStruct, private inviter?: MemberStruct, private memberList?: MemberStruct[], private logId?: Long, private hidden?: boolean) {
        
    }

    get FeedType() {
        return this.feedType;
    }

    // for message speific feeds

    get LogId() {
        return this.logId;
    }

    get Hidden() {
        return this.hidden;
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

        let logId: Long | undefined;
        if (obj['logId']) logId = obj['logId'];

        let hidden: boolean | undefined;
        if (obj['hidden']) hidden = obj['hidden'];

        return new ChatFeed(type, obj['text'], memberStruct, inviterStruct, memberListStruct, logId, hidden);
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

        if (feed.inviter) {
            obj['inviter'] = feed.inviter;
        }

        if (feed.logId) {
            obj['logId'] = feed.logId;
        }

        if (feed.hidden) {
            obj['hidden'] = feed.hidden;
        }

        return obj;
    }

}

export namespace FeedFragment {

    export interface Hidden extends StructBase {
    
        readonly hidden: boolean;
    
    }
    
    export interface Member extends StructBase {
        
        readonly member: any;
    
    }
    
    export interface MemberList extends StructBase {
        
        readonly members: any[];
    
    }
    
    export interface Inviter extends StructBase {
        
        readonly inviter: any;
    
    }
    
    export interface Message extends StructBase {
        
        readonly logId: Long;
    
    }
    
    export interface RichContent extends StructBase {
        
        readonly text: string;
    
    }

}

export interface ChatFeedNew extends StructBase {

    readonly feedType: FeedType;

}

export namespace ChatFeedNew {

    export function getFeedFromText<T extends ChatFeed = ChatFeed>(raw: string): T {
        try {
            return JsonUtil.parseLoseless(raw);
        } catch (e) {
            throw new Error(`Invalid feed`);
        }
    }

}

export type InviteFeed = ChatFeed & FeedFragment.Inviter & FeedFragment.Member & FeedFragment.MemberList;
export type LeaveFeed = ChatFeed & FeedFragment.Member;
export type RichContentFeed = ChatFeed & FeedFragment.RichContent;
export type OpenJoinFeed = ChatFeed & FeedFragment.Member;
export type OpenRewriteFeed = ChatFeed & FeedFragment.Member & FeedFragment.Message & FeedFragment.Hidden;
export type OpenKickFeed = ChatFeed & FeedFragment.Member;
export type DeleteAllFeed = ChatFeed & FeedFragment.Member & FeedFragment.Message & FeedFragment.Hidden;