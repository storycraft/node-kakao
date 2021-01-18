import { Long } from "bson";
import { UserType } from "./user-type";
import { EventEmitter } from "events";
import { ChatChannel, OpenChatChannel, MemoChatChannel } from "../channel_old/chat-channel";
import { Chat, FeedChat } from "../chat_old/chat";
import { LocoClient } from "../../client_old";
import { OpenProfileType, OpenMemberType } from "../open_old/open-link-type";
import { OpenLinkProfile } from "../open_old/open-link";
import { RequestResult } from "../../request/request-result";
import { UserEvents } from "../../event/events";

/*
 * Created on Fri Nov 01 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatUser extends UserEvents {

    readonly Client: LocoClient;

    readonly Id: Long;

    isClientUser(): boolean;

    createDM(): Promise<RequestResult<ChatChannel>>;

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

export interface DisplayUserInfo extends ChatUserInfo {



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

    readonly UserType: UserType;
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

    readonly EmailAddress: string;

    readonly AccountDisplayId: string;

    readonly TalkId: string;

    readonly StatusMessage: string;

    readonly NsnPhoneNumber: string;

    readonly PstnPhoneNumber: string;

    readonly FormattedNsnPhoneNumber: string;

    readonly FormattedPstnPhoneNumber: string;
}