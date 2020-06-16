import { Long } from "bson";
import { UserType } from "./user-type";
import { EventEmitter } from "events";
import { ChatChannel, OpenChatChannel, MemoChatChannel } from "../channel/chat-channel";
import { Chat, FeedChat } from "../chat/chat";
import { LocoClient } from "../../client";
import { OpenProfileType, OpenMemberType } from "../open/open-link-type";
import { OpenLinkProfile } from "../open/open-link";
import { RequestResult } from "../request/request-result";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatUser extends EventEmitter {

    readonly Client: LocoClient;

    readonly Id: Long;

    isClientUser(): boolean;

    createDM(): Promise<RequestResult<ChatChannel>>;

    on(event: 'message', listener: (chat: Chat) => void): this;
    on(event: 'message_read', listener: (channel: ChatChannel, watermark: Long) => void): this;
    on(event: 'join', listener: (newChannel: ChatChannel, joinFeed: FeedChat) => void): this;
    on(event: 'left', listener: (leftChannel: ChatChannel, leftFeed: FeedChat) => void): this;

    once(event: 'message', listener: (chat: Chat) => void): this;
    once(event: 'message_read', listener: (channel: ChatChannel, watermark: Long) => void): this;
    once(event: 'join', listener: (newChannel: ChatChannel, joinFeed: FeedChat) => void): this;
    once(event: 'left', listener: (leftChannel: ChatChannel, leftFeed: FeedChat) => void): this;

}

export interface UserInfo {

    readonly Client: LocoClient;

    readonly Id: Long;

    readonly Nickname: string;

    readonly ProfileImageURL: string;
    readonly FullProfileImageURL: string;
    readonly OriginalProfileImageURL: string;

    isOpenUser(): boolean;
    
}

export interface ChatUserInfo extends UserInfo {

    readonly User: ChatUser;
    
}

export interface NormalChatUserInfo extends ChatUserInfo {

    readonly User: ChatUser;

    readonly AccountId: number;

    readonly UserType: UserType;

    isOpenUser(): boolean;

}

export interface OpenKickedUserInfo extends UserInfo {

    readonly KickedChannelId: Long;

}

export interface OpenUserInfo extends UserInfo {

    readonly ProfileLinkId: Long | null;
    readonly ProfileOpenToken: number;

    readonly ProfileType: OpenProfileType;
    readonly MemberType: OpenMemberType;

    getOpenLink(): Promise<OpenLinkProfile | null>;

    isOpenUser(): boolean;
    hasOpenProfile(): boolean;

}

export interface OpenChatUserInfo extends OpenUserInfo, ChatUserInfo {

}

export interface ClientChatUser extends ChatUser {

    createDM(): Promise<RequestResult<MemoChatChannel>>;

    readonly MainUserInfo: ClientUserInfo;

    readonly MainOpenToken: number;

}

export interface ClientUserInfo extends ChatUserInfo {

}