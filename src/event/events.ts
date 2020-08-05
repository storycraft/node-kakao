/*
 * Created on Sat Jun 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { ChatChannel, OpenChatChannel } from "../talk/channel/chat-channel";
import { FeedChat, Chat } from "../talk/chat/chat";
import { ChatUser, ClientChatUser, OpenUserInfo, OpenChatUserInfo } from "../talk/user/chat-user";
import { Long } from "bson";
import { DeleteAllFeed, OpenJoinFeed, InviteFeed, OpenKickFeed, OpenRewriteFeed, OpenLinkDeletedFeed, OpenHandOverHostFeed, LeaveFeed } from "../talk/chat/chat-feed";
import { LocoKickoutType } from "../packet/packet-kickout";
import { ChannelMetaType, ChannelMetaStruct } from "../talk/struct/channel-meta-struct";
import { OpenLinkChannel } from "../talk/open/open-link";
import { OpenMemberType, OpenProfileType } from "../talk/open/open-link-type";
import { RelayEventType } from "../talk/relay/relay-event-type";

declare interface Event {

    off(event: string, listener: (...args: any[]) => void): this;

    emit(event: string, ...args: any[]): boolean;

}

declare interface ChatEvent extends Event {

    // 메세지 받을시 호출
    on(event: 'message', listener: (chat: Chat) => void): this;

    // 피드 메세지 받을시 호출
    on(event: 'feed', listener: (feed: FeedChat) => void): this;

    // 메세지 읽을 시 호출
    on(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, readChatLogId: Long) => void): this;

    // 메세지 삭제 시 호출
    on(event: 'message_deleted', listener: (feed: FeedChat<DeleteAllFeed>) => void): this;

    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'feed', listener: (feed: FeedChat) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, reader: ChatUser, readChatLogId: Long) => void): this;
    once(event: 'message_deleted', listener: (feed: FeedChat<DeleteAllFeed>) => void): this;

}

declare interface UserEvent extends Event {

    // 유저가 방에 들어올시 호출 (클라이언트 유저 포함)
    on(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) => void): this;

    // 유저가 방에서 나갈시 호출  (클라이언트 유저 포함, 킥 미포함)
    on(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed?: FeedChat<LeaveFeed | OpenKickFeed>) => void): this;

    // 유저가 킥 되었을시 호출
    on(event: 'user_kicked', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<OpenKickFeed>) => void): this;
    
    // 유저가 오픈프로필 변경시 호출
    on(event: 'profile_changed', listener: (channel: OpenChatChannel, user: ChatUser, lastUserInfo: OpenChatUserInfo, changedProfileType: OpenProfileType) => void): this;

    // 오픈채팅 유저 타입 변경시 호출
    on(event: 'member_type_changed', listener: (channel: OpenChatChannel, user: ChatUser, lastType: OpenMemberType) => void): this;
    
    once(event: 'user_join', listener: (channel: ChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed | InviteFeed>) => void): this;
    once(event: 'user_left', listener: (channel: ChatChannel, user: ChatUser, feed?: FeedChat<LeaveFeed | OpenKickFeed>) => void): this;
    once(event: 'user_kicked', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<OpenKickFeed>) => void): this;
    once(event: 'profile_changed', listener: (channel: OpenChatChannel, user: ChatUser, lastUserInfo: OpenChatUserInfo, changedProfileType: OpenProfileType) => void): this;
    once(event: 'member_type_changed', listener: (channel: OpenChatChannel, user: ChatUser, lastType: OpenMemberType) => void): this;
    
}

declare interface ChannelEvent extends Event {

    // 채널 meta 정보가 수정될시 호출
    on(event: 'meta_changed', listener: (channel: ChatChannel, type: ChannelMetaType, meta: ChannelMetaStruct, lastMeta: ChannelMetaStruct | null) => void): this;

    once(event: 'meta_changed', listener: (channel: ChatChannel, type: ChannelMetaType, meta: ChannelMetaStruct, lastMeta: ChannelMetaStruct | null) => void): this;

}

declare interface OpenChannelEvent extends Event {
    
    on(event: 'user_join', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed>) => void): this;
    on(event: 'user_left', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<LeaveFeed>) => void): this;

    // 메세지가 가려졌을시 호출
    on(event: 'message_hidden', listener: (channel: OpenChatChannel, logId: Long, feed?: FeedChat<OpenRewriteFeed>) => void): this;

    // 채널의 오픈링크가 삭제되었을시 호출
    on(event: 'link_deleted', listener: (channel: OpenChatChannel, feed: FeedChat<OpenLinkDeletedFeed>) => void): this;

    // 채널의 오픈링크 소유자가 바뀌었을시 호출
    on(event: 'link_hand_over_host', listener: (channel: OpenChatChannel, newHost: ChatUser, prevHost: ChatUser) => void): this;

    // 외치기 등 이벤트성 기능 사용시
    on(event: 'chat_event', listener: (channel: OpenChatChannel, user: ChatUser, type: RelayEventType, count: number, logId: Long) => void): this;

    once(event: 'user_join', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<OpenJoinFeed>) => void): this;
    once(event: 'user_left', listener: (channel: OpenChatChannel, user: ChatUser, feed?: FeedChat<LeaveFeed>) => void): this;
    
    once(event: 'message_hidden', listener: (channel: OpenChatChannel, logId: Long, feed?: FeedChat<OpenRewriteFeed>) => void): this;
    once(event: 'link_deleted', listener: (channel: OpenChatChannel, feed: FeedChat<OpenLinkDeletedFeed>) => void): this;
    once(event: 'link_hand_over_host', listener: (channel: OpenChatChannel, feed: FeedChat<OpenHandOverHostFeed>) => void): this;
    once(event: 'chat_event', listener: (channel: OpenChatChannel, user: ChatUser, type: RelayEventType, count: number, logId: Long) => void): this;

}

declare interface ClientEvent extends Event {

    // 로그인 완료시 호출
    on(event: 'login', listener: (user: ClientChatUser) => void): this;

    // 서버 변경시 호출
    on(event: 'switch_server', listener: () => void): this;

    // 연결이 끊어졌을시 호출 (서버 변경)
    on(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;

    // 클라이언트 처리 에러
    on(event: 'error', listener: (error: Error) => void): this;

    once(event: 'login', listener: (user: ClientChatUser) => void): this;
    once(event: 'switch_server', listener: () => void): this;
    once(event: 'disconnected', listener: (reason: LocoKickoutType) => void): this;
    once(event: 'error', listener: (error: Error) => void): this;


}

export type ClientEvents = ClientEvent & UserEvent & ChannelEvent & OpenChannelEvent & ChatEvent;
export type UserEvents = ChatEvent & UserEvent;
export type ChannelEvents = ChannelEvent & ChatEvent & UserEvent;
export type OpenChannelEvents = ChannelEvents & OpenChannelEvent;