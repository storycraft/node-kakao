import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ChannelType } from "../chat/channel-type";
import { ChatlogStruct } from "./chatlog-struct";
import { MemberStruct } from "./member-struct";
import { JsonUtil } from "../../util/json-util";
import { ChannelMetaStruct } from "./channel-meta-set-struct";
import { ObjectMapper, Converter } from "json-proxy-mapper";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatInfoStruct extends StructBase {

    channelId: Long;
    type: ChannelType;
    openLinkId: Long;
    openChatToken: number;
    activeMemberCount: number;
    newMessageCount: number;
    lastUpdatedAt: string;
    lastMessage: string;
    lastLogId: Long;
    lastSeenLogId: Long;
    lastChatLog: ChatlogStruct;
    metadata: ChatMetaStruct;
    displayMemberList: MemberStruct[];
    pushAlert: boolean;
    chatMetaList: ChannelMetaStruct[];
    isDirectChat: boolean;

    linkId?: Long,
    openToken: number

}

export namespace ChatInfoStruct {

    export const Mappings = {
        
        channelId: 'chatId',
        type: 'type',
        activeMemberCount: 'activeMembersCount',
        newMessageCount: 'newMessageCount',
        lastUpdatedAt: 'lastUpdatedAt',
        lastMessage: 'lastMessage',
        lastLogId: 'lastLogId',
        lastSeenLogId: 'lastSeenLogId',
        lastChatLog: 'lastChatLog',
        metadata: 'meta',
        displayMemberList: 'displayMembers',
        pushAlert: 'pushAlert',
        chatMetaList: 'chatMetas',
        isDirectChat: 'directChat',

        linkId: 'li',
        openToken: 'otk'

    }

    export const ConvertMap = {

        displayMemberList: new Converter.Array(MemberStruct.Mappings, MemberStruct.ConvertMap),

        channelId: JsonUtil.LongConverter,
        lastLogId: JsonUtil.LongConverter,
        lastSeenLogId: JsonUtil.LongConverter,
        linkId: JsonUtil.LongConverter

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}

export interface ChatMetaStruct extends StructBase {

    fullImageURL: string;
    omageURL: string;
    name: string;
    favorite: boolean;

}