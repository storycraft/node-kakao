/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FeedType } from "../feed/feed-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { StructBase } from "../struct/struct-base";

export namespace FeedFragment {
    
    export interface Member extends StructBase {
        
        readonly member: FeedMemberStruct;
    
    }
    
    export interface MemberList extends StructBase {
        
        readonly members: FeedMemberStruct[];
    
    }
    
    export interface Inviter extends StructBase {
        
        readonly inviter: FeedMemberStruct;
    
    }
    
    export interface Message extends StructBase {
        
        readonly logId: Long;
    
    }

    export interface OpenHandOver extends StructBase {

        readonly prevHost: FeedMemberStruct;
        readonly newHost: FeedMemberStruct;

    }

}

export interface FeedMemberStruct extends StructBase {

    userId: Long,
    nickName: string

}

export interface ChatFeed<T extends FeedType = FeedType> extends StructBase {

    readonly feedType: T;
    readonly hidden?: boolean;

}

export namespace ChatFeed {

    export function getFeedFromText<T extends ChatFeed = ChatFeed>(raw: string): T {
        try {
            return JsonUtil.parseLoseless(raw);
        } catch (e) {
            throw new Error(`Invalid feed: ${e}`);
        }
    }

}

export type InviteFeed = ChatFeed<FeedType.INVITE> & FeedFragment.Inviter & FeedFragment.MemberList;
export type LeaveFeed = ChatFeed<FeedType.LEAVE> & FeedFragment.Member;

export type RichContentFeed = ChatFeed<FeedType.RICH_CONTENT>;

export type OpenJoinFeed = ChatFeed<FeedType.OPENLINK_JOIN> & FeedFragment.MemberList;
export type OpenLinkDeletedFeed = ChatFeed<FeedType.OPENLINK_DELETE_LINK>;
export type OpenRewriteFeed = ChatFeed<FeedType.OPENLINK_REWRITE_FEED> & FeedFragment.Member & FeedFragment.Message;
export type OpenKickFeed = ChatFeed<FeedType.OPENLINK_KICKED> & FeedFragment.Member;
export type OpenHandOverHostFeed = ChatFeed<FeedType.OPENLINK_HAND_OVER_HOST> & FeedFragment.OpenHandOver;

export type OpenManagerGrantFeed = ChatFeed<FeedType.OPEN_MANAGER_GRANT> & FeedFragment.Member;
export type OpenManagerRevokeFeed = ChatFeed<FeedType.OPEN_MANAGER_REVOKE> & FeedFragment.Member;

export type ChannelDeletedFeed = ChatFeed<FeedType.CHANNEL_DELETED>;
export type DeleteAllFeed = ChatFeed<FeedType.DELETE_TO_ALL> & FeedFragment.Message;



export type OpenLinkFeeds = OpenJoinFeed | OpenLinkDeletedFeed | OpenRewriteFeed | OpenKickFeed | OpenHandOverHostFeed | OpenManagerGrantFeed | OpenManagerRevokeFeed;
export type ChatFeeds = InviteFeed | LeaveFeed | RichContentFeed | OpenLinkFeeds | ChannelDeletedFeed | DeleteAllFeed;