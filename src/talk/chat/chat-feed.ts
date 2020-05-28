/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FeedType } from "../feed/feed-type";
import { JsonUtil } from "../../util/json-util";
import { Long } from "bson";
import { StructBase } from "../struct/struct-base";
import { MemberStruct } from "../struct/member-struct";

export namespace FeedFragment {

    export interface Hidden extends StructBase {
    
        readonly hidden: boolean;
    
    }
    
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
    
    export interface RichContent extends StructBase {
        
        readonly text: string;
    
    }

}

export interface FeedMemberStruct extends StructBase {

    userId: Long,
    nickName: string

}

export interface ChatFeed extends StructBase {

    readonly feedType: FeedType;

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

export type InviteFeed = ChatFeed & FeedFragment.Inviter & FeedFragment.Member & FeedFragment.MemberList;
export type LeaveFeed = ChatFeed & FeedFragment.Member;
export type RichContentFeed = ChatFeed & FeedFragment.RichContent;
export type OpenJoinFeed = ChatFeed & FeedFragment.Member;
export type OpenRewriteFeed = ChatFeed & FeedFragment.Member & FeedFragment.Message & FeedFragment.Hidden;
export type OpenKickFeed = ChatFeed & FeedFragment.Member;
export type DeleteAllFeed = ChatFeed & FeedFragment.Member & FeedFragment.Message & FeedFragment.Hidden;