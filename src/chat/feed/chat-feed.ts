/*
 * Created on Fri Apr 24 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FeedType, KnownFeedType } from './feed-type';
import { ChannelUser } from '../../user';
import { JsonUtil } from '../../util';
import { ChatLogged, TypedChat } from '../chat';
import { KnownChatType } from '../chat-type';

export namespace FeedFragment {

  export interface Member {

    readonly member: FeedMember;

  }

  export interface MemberList {

    readonly members: FeedMember[];

  }

  export interface Inviter {

    readonly inviter: FeedMember;

  }

  export type Message = ChatLogged

  export interface OpenHandOver {

    readonly prevHost: FeedMember;
    readonly newHost: FeedMember;

  }

}

export interface FeedMember extends ChannelUser {

  nickName: string;

}

export interface ChatFeed<T extends FeedType = FeedType> {

  readonly feedType: T;
  readonly hidden?: boolean;

}

export type InviteFeed = ChatFeed<KnownFeedType.INVITE> & FeedFragment.Inviter & FeedFragment.MemberList;
export type LeaveFeed = ChatFeed<KnownFeedType.LEAVE> & FeedFragment.Member;

export type RichContentFeed = ChatFeed<KnownFeedType.RICH_CONTENT>;

export type OpenJoinFeed = ChatFeed<KnownFeedType.OPENLINK_JOIN> & FeedFragment.MemberList;
export type OpenLinkDeletedFeed = ChatFeed<KnownFeedType.OPENLINK_DELETE_LINK>;
export type OpenRewriteFeed = ChatFeed<KnownFeedType.OPENLINK_REWRITE_FEED>
  & FeedFragment.Member
  & FeedFragment.Message;
export type OpenKickFeed = ChatFeed<KnownFeedType.OPENLINK_KICKED> & FeedFragment.Member;
export type OpenHandOverHostFeed = ChatFeed<KnownFeedType.OPENLINK_HAND_OVER_HOST> & FeedFragment.OpenHandOver;

export type OpenManagerGrantFeed = ChatFeed<KnownFeedType.OPEN_MANAGER_GRANT> & FeedFragment.Member;
export type OpenManagerRevokeFeed = ChatFeed<KnownFeedType.OPEN_MANAGER_REVOKE> & FeedFragment.Member;

export type ChannelDeletedFeed = ChatFeed<KnownFeedType.CHANNEL_DELETED>;
export type DeleteAllFeed = ChatFeed<KnownFeedType.DELETE_TO_ALL> & FeedFragment.Message;

export type OpenLinkFeeds = OpenJoinFeed
  | OpenLinkDeletedFeed
  | OpenRewriteFeed
  | OpenKickFeed
  | OpenHandOverHostFeed
  | OpenManagerGrantFeed
  | OpenManagerRevokeFeed;

/**
 * Feed is special chat marker
 */
export type KnownChatFeeds = InviteFeed
  | LeaveFeed
  | RichContentFeed
  | OpenLinkFeeds
  | ChannelDeletedFeed
  | DeleteAllFeed;
export type ChatFeeds = KnownChatFeeds | Record<string, unknown> & ChatFeed;

/**
 * Read chat text and deserialize
 *
 * @param {TypedChat<KnownChatType.FEED>} chat
 * @return {ChatFeeds}
 */
export function feedFromChat(chat: TypedChat<KnownChatType.FEED>): ChatFeeds {
  let feed: ChatFeeds = { feedType: -999999 };
  try {
    feed = { ...feed };
    if (chat.text) {
      Object.assign(feed, JsonUtil.parseLoseless(chat.text));
    }
    return feed;
  } catch (e) {
    return feed;
  }
}

/**
 * Serialize feed to chat text
 *
 * @param {ChatFeeds} feed
 * @return {string}
 */
export function feedToText(feed: ChatFeeds): string {
  return JsonUtil.stringifyLoseless(feed);
}
