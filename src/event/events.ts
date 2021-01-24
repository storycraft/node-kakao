/*
 * Created on Sat Jun 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatChannel, OpenChatChannel } from "../talk/channel_old/chat-channel";
import { FeedChat, Chat } from "../talk/chat_old/chat";
import { ChatUser, OpenChatUserInfo } from "../talk/user_old/chat-user";
import { Long } from "bson";
import { DeleteAllFeed, OpenJoinFeed, InviteFeed, OpenKickFeed, OpenRewriteFeed, OpenLinkDeletedFeed, LeaveFeed } from "../talk/chat_old/chat-feed";
import { OpenMemberType, OpenProfileType } from "../talk/open_old/open-link-type";
import { RelayEventType } from "../relay/relay-event-type";
import { KickoutType } from "../packet/chat/kickout";
import { Chatlog, ChatLogged } from "../chat/chat";
import { AnyTalkChannel } from "../talk/channel/talk-channel";
import { AnyChannelUserInfo, ChannelUserInfo } from "../user/channel-user-info";
import { SetChannelMeta } from "../channel/channel-info";
import { ChannelMetaType } from "../packet/struct/channel";

declare interface ChatEvent {

    // 챗을 받을시 호출
    'chat': (chat: Readonly<Chatlog>, channel: AnyTalkChannel, sender?: AnyChannelUserInfo) => void;

    // 피드 쳇 받을시 호출
    'feed': (chat: Readonly<Chatlog>, channel: AnyTalkChannel, sender?: AnyChannelUserInfo) => void

    // 쳇 읽을 시 호출
    'chat_read': (chat: Readonly<ChatLogged>, channel: AnyTalkChannel, reader?: AnyChannelUserInfo) => void;

    // 쳇 삭제 시 호출
    'chat_deleted': (feed: FeedChat<DeleteAllFeed>) => void;

}

declare interface ChannelEvent {

    // 채널 meta 정보가 수정될때 호출
    'meta_change': (channel: AnyTalkChannel, type: ChannelMetaType, newMeta: SetChannelMeta) => void;

}

declare interface ChannelListEvent {
    
    // 유저가 방에 들어올시 호출
    'user_join': (channel: AnyTalkChannel, user: AnyChannelUserInfo, feed?: FeedChat<OpenJoinFeed>) => void

    // 유저가 방에서 나갈시 호출 (킥 미포함)
    'user_left': (channel: AnyTalkChannel, user: AnyChannelUserInfo, feed?: FeedChat<LeaveFeed>) => void;

    // 클라이언트가 채널 들어올시 호출
    'channel_join': (channel: AnyTalkChannel, feed?: FeedChat<OpenJoinFeed>) => void;

    // 클라이언트가 채널 나갈시 호출
    'channel_left': (channel: AnyTalkChannel) => void;

}

declare interface OpenChannelEvent {

    // 유저가 킥 되었을시 호출
    'user_kicked': (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<OpenKickFeed>) => void;

    // 유저가 오픈프로필 변경시 호출
    'profile_changed': (channel: OpenChatChannel, user: ChatUser, lastUserInfo: OpenChatUserInfo, changedProfileType: OpenProfileType) => void;

    // 오픈채팅 유저 타입 변경시 호출
    'member_type_changed': (channel: OpenChatChannel, user: ChatUser, lastType: OpenMemberType) => void;

    // 메세지가 가려졌을시 호출
    'message_hidden': (channel: OpenChatChannel, logId: Long, feed?: FeedChat<OpenRewriteFeed>) => void;

    // 채널의 오픈링크가 삭제되었을시 호출
    'link_deleted': (channel: OpenChatChannel, feed: FeedChat<OpenLinkDeletedFeed>) => void;

    // 채널의 오픈링크 소유자가 바뀌었을시 호출
    'link_hand_over_host': (channel: OpenChatChannel, newHost: ChatUser, prevHost: ChatUser) => void;

    // 외치기 등 이벤트성 기능 사용시
    'chat_event': (channel: OpenChatChannel, user: ChatUser, type: RelayEventType, count: number, logId: Long) => void;


}

declare interface ClientEvent {

    // 서버 변경시 호출
    'switch_server': () => void;

    // 서버에 의해 연결이 끊어졌을시 호출 (서버 변경 포함)
    'disconnected': (reason: KickoutType) => void;

    // 클라이언트 처리 에러
    'error': (error: any) => void;

}

export type ClientEvents = ClientEvent & ChannelListEvents;
export type ChannelListEvents = ChannelListEvent & OpenChannelEvents;
export type ChannelEvents = ChannelEvent & ChatEvent;
export type OpenChannelEvents = ChannelEvents & OpenChannelEvent;