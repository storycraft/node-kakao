/*
 * Created on Sat Jun 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { FeedChat } from "../talk/chat_old/chat";
import { ChatUser } from "../talk/user_old/chat-user";
import { Long } from "bson";
import { KnownRelayEventType } from "../relay/relay-event-type";
import { KickoutType } from "../packet/chat/kickout";
import { Chatlog, ChatLogged, TypedChatlog } from "../chat/chat";
import { TalkChannel } from "../talk/channel/talk-channel";
import { ChannelUserInfo, OpenChannelUserInfo } from "../user/channel-user-info";
import { SetChannelMeta } from "../channel/channel-info";
import { ChannelMetaType } from "../packet/struct/channel";
import { KnownChatType } from "../chat/chat-type";
import { ChatFeeds, DeleteAllFeed, OpenKickFeed, OpenRewriteFeed } from "../chat/feed/chat-feed";
import { OpenLinkChannelUserInfo } from "../openlink/open-link-user-info";
import { OpenChannel } from "../openlink/open-channel";
import { InformedOpenLink } from "../openlink/open-link";

declare interface ChatEvent {

    // 챗을 받을시 호출
    'chat': (chat: Readonly<Chatlog>, channel: TalkChannel) => void;

    // 유저가 챗 읽었을시 호출
    'chat_read': (chat: Readonly<ChatLogged>, channel: TalkChannel, reader?: ChannelUserInfo) => void;

    // 쳇 삭제되었을시 호출
    'chat_deleted': (feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>, channel: TalkChannel, feed: DeleteAllFeed) => void;

}

declare interface ChannelEvent {

    // 채널 meta 정보가 수정될때 호출
    'meta_change': (channel: TalkChannel, type: ChannelMetaType, newMeta: SetChannelMeta) => void;

    // 유저가 방에 들어올시 호출
    'user_join': (feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>, channel: TalkChannel, user: ChannelUserInfo, feed: ChatFeeds) => void

    // 유저가 방에서 나갈시 호출 (킥 미포함)
    'user_left': (feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>, channel: TalkChannel, user: ChannelUserInfo, feed: ChatFeeds) => void;

}

declare interface ChannelListEvent {

    // 클라이언트가 채널 들어갔을시 호출
    'channel_join': (channel: TalkChannel) => void;

    // 클라이언트가 채널 나갈시 호출
    'channel_left': (channel: TalkChannel) => void;

}

declare interface OpenChannelEvent {

    // 유저가 킥 되었을시 호출
    'user_kicked': (channel: OpenChannel, user: ChatUser, feed?: FeedChat<OpenKickFeed>) => void;

    // 유저가 오픈프로필 변경시 호출
    'profile_changed': (channel: OpenChannel, lastInfo: OpenChannelUserInfo, user: OpenLinkChannelUserInfo) => void;

    // 오픈채팅 권한 변경시 호출
    'perm_changed': (channel: OpenChannel, lastInfo: OpenChannelUserInfo, user: OpenChannelUserInfo) => void;

    // 메세지가 가려졌을시 호출
    'message_hidden': (feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>, channel: OpenChannel, feed: OpenRewriteFeed) => void;

    // 외치기 등 이벤트성 기능 사용시
    'chat_event': (channel: OpenChannel, user: ChatUser, type: KnownRelayEventType, count: number, logId: Long) => void;

}

declare interface OpenChannelListEvent {

    // 채널에서 킥 되었을시 호출
    'channel_kicked': (feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>, channel: OpenChannel, feed: OpenKickFeed) => void;

}

declare interface OpenLinkEvent {

    // 클라이언트 오픈링크가 생성 되었을시 호출
    'link_created': (link: InformedOpenLink) => void;

    // 클라이언트 오픈링크가 삭제 되었을시 호출
    'link_deleted': (link: InformedOpenLink) => void;
}

declare interface ClientEvent {

    // 서버 변경시 호출
    'switch_server': () => void;

    // 서버에 의해 연결이 끊어졌을시 호출 (서버 변경 포함)
    'disconnected': (reason: KickoutType) => void;

    // 클라이언트 처리 에러.
    // 핸들링 되지 않을시 클라이언트 세션이 종료됨.
    'error': (error: any) => void;

}

export type ClientEvents = ClientEvent & TalkChannelListEvents & OpenLinkEvents;
export type TalkChannelListEvents = OpenChannelListEvents & NormalChannelListEvents;

export type NormalChannelListEvents = ChannelListEvents & ChannelEvents;
export type OpenChannelListEvents = ChannelListEvents & OpenChannelEvents & OpenChannelListEvent;
export type ChannelListEvents = ChannelListEvent;

export type OpenLinkEvents = OpenLinkEvent;

export type ChannelEvents = ChannelEvent & ChatEvent;
export type OpenChannelEvents = ChannelEvents & OpenChannelEvent;