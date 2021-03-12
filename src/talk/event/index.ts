/*
 * Created on Sat Jun 20 2020
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

import { SetChannelMeta } from '../../channel';
import { ChannelMetaType } from '../../channel/meta';
import {
  ChatFeeds,
  ChatLogged,
  ChatLoggedType,
  DeleteAllFeed,
  KnownChatType,
  OpenKickFeed,
  OpenLinkDeletedFeed,
  OpenRewriteFeed,
  TypedChatlog,
} from '../../chat';
import { InformedOpenLink, OpenLink, OpenLinkChannelUserInfo } from '../../openlink';
import { KickoutType } from '../../packet/chat';
import { RelayEventType } from '../../relay';
import { TalkChatData } from '../chat';

export interface ChatEvent<T, U> {

  // 챗을 받을시 호출
  'chat': (data: TalkChatData, channel: T) => void;

  // 유저가 챗 읽었을시 호출
  'chat_read': (chat: Readonly<ChatLogged>, channel: T, reader?: U) => void;

  // 쳇 삭제되었을시 호출
  'chat_deleted': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    feed: DeleteAllFeed
  ) => void;

}

export interface ChannelEvent<T, U> {

  // 채널 meta 정보가 수정될때 호출
  'meta_change': (channel: T, type: ChannelMetaType, newMeta: SetChannelMeta) => void;

  // 유저가 방에 들어올시 호출
  'user_join': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    user: U,
    feed: ChatFeeds
  ) => void

  // 유저가 방에서 나갈시 호출 (킥 미포함)
  'user_left': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    user: U,
    feed: ChatFeeds
  ) => void;

}

export interface ChannelListEvent<T> {

  // 클라이언트가 채널 들어갔을시 호출
  'channel_join': (channel: T) => void;

  // 클라이언트에 채널 초기화 또는 비활성 채널 활성화로 인한 채널 추가시 호출
  'channel_added': (channel: T) => void;

  // 클라이언트가 채널 나갈시 호출
  'channel_left': (channel: T) => void;

}

export interface OpenChannelEvent<T, U> {

  // 유저가 오픈프로필 변경시 호출
  'profile_changed': (channel: T, lastInfo: U, user: OpenLinkChannelUserInfo) => void;

  // 오픈채팅 권한 변경시 호출
  'perm_changed': (channel: T, lastInfo: U, user: U) => void;

  // 오픈 채팅 방장이 바뀌었을시 호출
  'host_handover': (channel: T, lastLink: OpenLink, link: OpenLink) => void;

  // 채팅방 링크가 삭제 되었을시 호출
  'channel_link_deleted': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    feed: OpenLinkDeletedFeed
  ) => void;

  // 메세지가 가려졌을시 호출
  'message_hidden': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    feed: OpenRewriteFeed
  ) => void;

  // 채팅방 이벤트 (ex: 외치기 기능 하트 변화 시)
  'chat_event': (
    channel: T,
    author: U,
    type: RelayEventType,
    count: number,
    chat: ChatLoggedType
  ) => void;

}

export interface OpenChannelListEvent<T> {

  // 채널에서 킥 되었을시 호출
  'channel_kicked': (
    feedChatlog: Readonly<TypedChatlog<KnownChatType.FEED>>,
    channel: T,
    feed: OpenKickFeed
  ) => void;

}

export interface OpenLinkEvent {

  // 클라이언트 오픈링크가 생성 되었을시 호출
  'link_created': (link: InformedOpenLink) => void;

  // 클라이언트 오픈링크가 삭제 되었을시 호출
  'link_deleted': (link: InformedOpenLink) => void;
}

export interface ClientEvent {

  // 서버 변경시 호출
  'switch_server': () => void;

  // 서버에 의해 연결이 끊어졌을시 호출 (서버 변경 포함)
  'disconnected': (reason: KickoutType) => void;

  // 클라이언트 처리 에러.
  // 핸들링 되지 않을시 클라이언트 세션이 종료됨.
  'error': (error: unknown) => void;

}

export type ClientEvents<T, U> = ClientEvent & ChannelListEvents<T, U>;
export type ChannelListEvents<T, U> = OpenChannelListEvents<T, U> & NormalChannelListEvents<T, U>;

export type NormalChannelListEvents<T, U> = ChannelListEvent<T> & ChannelEvents<T, U>;
export type OpenChannelListEvents<T, U>
= OpenLinkEvent & ChannelListEvent<T> & OpenChannelEvents<T, U> & OpenChannelListEvent<T>;

export type ChannelEvents<T, U> = ChannelEvent<T, U> & ChatEvent<T, U>;
export type OpenChannelEvents<T, U> = ChannelEvents<T, U> & OpenChannelEvent<T, U>;
