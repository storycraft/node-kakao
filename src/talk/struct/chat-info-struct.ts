import { StructBase } from "./struct-base";
import { Long } from "bson";
import { ChannelType } from "../chat/channel-type";
import { ChatlogStruct } from "./chatlog-struct";
import { MemberStruct } from "./member-struct";
import { JsonUtil } from "../../util/json-util";
import { ChannelMetaStruct } from "./channel-meta-set-struct";
import { ObjectMapper, Converter } from "json-proxy-mapper";
import { ChatDataStruct, ChatMetaStruct } from "./chatdata-struct";

/*
 * Created on Sat Nov 02 2019
 *
 * Copyright (c) storycraft. Licensed under the MIT Licence.
 */

export interface ChatInfoStruct extends ChatDataStruct {

    activeMemberCount: number;
    newMessageCount: number;
    lastUpdatedAt: string;
    lastMessage: string;
    lastLogId: Long;
    lastSeenLogId: Long;
    lastChatLog: ChatlogStruct;
    displayMemberList: MemberStruct[];
    chatMetaList: ChannelMetaStruct[];
    isDirectChat: boolean;

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

        displayMemberList: new Converter.Array(MemberStruct.Mappings),

    }

    export const MAPPER = new ObjectMapper(Mappings, ConvertMap);

}